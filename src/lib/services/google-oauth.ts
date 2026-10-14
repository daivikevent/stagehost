import { google } from 'googleapis';
import { Readable } from 'stream';

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google OAuth authorization URL for the artist to connect their Drive
 */
export function generateGoogleAuthUrl(profileId: string): string {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/drive.file', // Create and manage files created by this app
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical: gives refresh_token for background uploads
    prompt: 'consent', // Ensures refresh_token is always returned
    scope: scopes,
    state: profileId,
  });
}

/**
 * Exchange auth code for tokens and fetch user email
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Fetch basic user profile
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return {
    tokens,
    email: userInfo.data.email || '',
    name: userInfo.data.name || '',
    picture: userInfo.data.picture || '',
  };
}

/**
 * Find or create a designated folder in artist's Google Drive: "BookMyArtist Media Vault"
 */
export async function getOrCreateAppFolder(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const folderName = 'BookMyArtist Media Vault';

  // Search if folder already exists
  const listRes = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name, webViewLink)',
    spaces: 'drive',
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    const existing = listRes.data.files[0];
    return {
      folderId: existing.id!,
      folderName: existing.name!,
      folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
    };
  }

  // Create new folder
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Media files uploaded from BookMyArtist portfolio',
    },
    fields: 'id, name, webViewLink',
  });

  const folderId = createRes.data.id!;

  // Set folder to "Anyone with the link can view" so public portfolio visitors can stream clips
  try {
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (err) {
    console.warn('Could not set public view permission on vault folder:', err);
  }

  return {
    folderId,
    folderName,
    folderUrl: createRes.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`,
  };
}

/**
 * Upload a file buffer directly to artist's Google Drive folder using their OAuth refresh_token
 */
export async function uploadFileWithUserToken({
  refreshToken,
  folderId,
  file,
  customFileName,
}: {
  refreshToken: string;
  folderId: string;
  file: File;
  customFileName?: string;
}) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Detect media type
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'm4v'];
  const audioExts = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];

  let mediaType: 'video' | 'audio' = 'video';
  if (audioExts.includes(rawExt) || file.type.startsWith('audio/')) {
    mediaType = 'audio';
  } else if (videoExts.includes(rawExt) || file.type.startsWith('video/')) {
    mediaType = 'video';
  }

  const fileName = customFileName || file.name;
  const mimeType = file.type || (mediaType === 'video' ? 'video/mp4' : 'audio/mpeg');

  // Convert File to Node stream
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  // Upload to artist's folder
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, size, webViewLink, webContentLink',
  });

  const fileId = response.data.id;
  if (!fileId) throw new Error('Google Drive upload did not return a valid file ID.');

  // Set file to anyone with the link can view
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (permErr: any) {
    console.warn('Could not set public permission on file:', permErr.message);
  }

  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const fileSize = `${sizeMb} MB`;

  const directStreamingUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
  const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    fileId,
    fileName,
    fileSize,
    mediaType,
    url: directStreamingUrl,
    webViewLink,
    previewUrl,
  };
}
