import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Checks if Google Drive Service Account credentials are configured
 */
export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  );
}

/**
 * Returns the configured service account email so artists can also share
 * private folders directly with this email as an alternative to public edit link.
 */
export function getServiceAccountEmail(): string | null {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return parsed.client_email || null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Creates an authorized Google Drive v3 client
 */
function getDriveClient() {
  let clientEmail: string | undefined;
  let privateKey: string | undefined;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      clientEmail = parsed.client_email;
      privateKey = parsed.private_key;
    } catch (e: any) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  if (!clientEmail) clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!privateKey) privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive Service Account credentials are not configured in environment.');
  }

  // Handle formatted private key with escaped newlines
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  return google.drive({ version: 'v3', auth });
}

export interface GoogleDriveUploadParams {
  file: File;
  folderId: string;
  customFileName?: string;
}

export interface GoogleDriveUploadResult {
  fileId: string;
  fileName: string;
  fileSize: string;
  mediaType: 'video' | 'audio';
  url: string;
  webViewLink: string;
  previewUrl: string;
}

/**
 * Uploads a file buffer directly into an artist's Google Drive folder
 * that has 'Anyone with the link can edit' permission (or shared with service account).
 */
export async function uploadFileToGoogleDrive({
  file,
  folderId,
  customFileName,
}: GoogleDriveUploadParams): Promise<GoogleDriveUploadResult> {
  const drive = getDriveClient();

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

  // Convert File to ArrayBuffer and into a Node stream
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  // Upload to Google Drive folder
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
    supportsAllDrives: true,
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Google Drive upload did not return a valid file ID.');
  }

  // Ensure file is publicly readable so it plays on artist portfolio
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });
  } catch (permErr: any) {
    // Non-fatal if parent folder inherits public permissions
    console.warn('Could not set public permission on Google Drive file:', permErr.message);
  }

  // Calculate human readable size
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const fileSize = `${sizeMb} MB`;

  // Direct streaming link and preview embed links
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
