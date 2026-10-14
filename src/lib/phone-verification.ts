import crypto from 'crypto';
import { formatPhoneNumberForWhatsApp } from '@/lib/whatsapp';
import { createAdminClient } from '@/lib/supabase/admin';

const VERIFICATION_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXTAUTH_SECRET ||
  'bma-phone-verification-secret-seed-key-2026';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const PROOF_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Sign payload with HMAC-SHA256
 */
function createHmacSignature(data: string): string {
  return crypto.createHmac('sha256', VERIFICATION_SECRET).update(data).digest('hex');
}

/**
 * Clean phone to standard 10-digit Indian mobile number
 */
export function sanitizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/**
 * Generate 4-digit numeric verification OTP and a cryptographically signed token
 */
export function generateVerificationSession(phone: string): { code: string; token: string } {
  const cleanPhone = sanitizeIndianPhone(phone);
  // Generate random 4-digit code between 1000 and 9999
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const timestamp = Date.now().toString();

  const rawPayload = `${cleanPhone}:${timestamp}:${code}`;
  const signature = createHmacSignature(rawPayload);
  const token = Buffer.from(`${rawPayload}:${signature}`).toString('base64url');

  return { code, token };
}

/**
 * Verify submitted OTP against token
 */
export function verifyOTPSession(
  phone: string,
  inputCode: string,
  token: string
): { valid: boolean; error?: string; verifiedProofToken?: string } {
  try {
    const cleanPhone = sanitizeIndianPhone(phone);
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) {
      return { valid: false, error: 'Malformed verification token' };
    }

    const [tokenPhone, tokenTimestamp, tokenCode, signature] = parts;
    const rawPayload = `${tokenPhone}:${tokenTimestamp}:${tokenCode}`;
    const expectedSignature = createHmacSignature(rawPayload);

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid verification signature' };
    }

    if (tokenPhone !== cleanPhone) {
      return { valid: false, error: 'Phone number mismatch' };
    }

    const timeDiff = Date.now() - parseInt(tokenTimestamp, 10);
    if (timeDiff > OTP_EXPIRY_MS) {
      return { valid: false, error: 'Verification code expired (10m limit). Please request a new code.' };
    }

    if (tokenCode.trim() !== inputCode.trim()) {
      return { valid: false, error: 'Incorrect 4-digit verification code' };
    }

    // Generate verified proof token
    const proofTimestamp = Date.now().toString();
    const proofPayload = `verified:${cleanPhone}:${proofTimestamp}`;
    const proofSignature = createHmacSignature(proofPayload);
    const verifiedProofToken = Buffer.from(`${proofPayload}:${proofSignature}`).toString('base64url');

    return { valid: true, verifiedProofToken };
  } catch (err) {
    return { valid: false, error: 'Failed to verify security token' };
  }
}

/**
 * Validate that an inquiry was accompanied by an authenticated verified proof token
 */
export function validateVerifiedProof(phone: string, proofToken: string): boolean {
  try {
    const cleanPhone = sanitizeIndianPhone(phone);
    const decoded = Buffer.from(proofToken, 'base64url').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) return false;
    const [prefix, tokenPhone, tokenTimestamp, signature] = parts;

    if (prefix !== 'verified') return false;
    if (tokenPhone !== cleanPhone) return false;

    const rawPayload = `${prefix}:${tokenPhone}:${tokenTimestamp}`;
    const expectedSignature = createHmacSignature(rawPayload);
    if (signature !== expectedSignature) return false;

    const timeDiff = Date.now() - parseInt(tokenTimestamp, 10);
    if (timeDiff > PROOF_EXPIRY_MS) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatch verification OTP to client via Meta WhatsApp Cloud API (if credentials configured)
 */
export async function sendClientVerificationOTP(params: {
  phone: string;
  code: string;
  artistName?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumberForWhatsApp(params.phone);
  if (!formattedPhone || formattedPhone.length < 10) {
    return { success: false, error: 'Invalid mobile number' };
  }

  try {
    const adminClient = createAdminClient();
    let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || phoneNumberId.includes('placeholder')) {
      const { data: dbPhoneId } = await adminClient
        .from('platform_settings')
        .select('value')
        .eq('key', 'whatsapp_phone_number_id')
        .maybeSingle();
      if (dbPhoneId?.value && !dbPhoneId.value.includes('placeholder')) {
        phoneNumberId = dbPhoneId.value;
      }
    }

    if (!accessToken || accessToken.includes('placeholder')) {
      const { data: dbToken } = await adminClient
        .from('platform_settings')
        .select('value')
        .eq('key', 'whatsapp_access_token')
        .maybeSingle();
      if (dbToken?.value && !dbToken.value.includes('placeholder')) {
        accessToken = dbToken.value;
      }
    }

    const isConfigured = Boolean(
      phoneNumberId &&
      !phoneNumberId.includes('placeholder') &&
      accessToken &&
      !accessToken.includes('placeholder')
    );

    const messageText = `🔐 *BookMyArtist Security Code*

Your 4-digit verification code is: *${params.code}*

Use this code to verify your booking inquiry for ${params.artistName || 'the artist'}. 
This code expires in 10 minutes.

(BookMyArtist - Direct Verified Artist Bookings)`;

    if (isConfigured) {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'text',
            text: {
              preview_url: false,
              body: messageText,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('[WhatsApp OTP] Meta API error, fallback to simulated delivery:', errorData);
        return { success: true, simulated: true };
      }

      return { success: true, simulated: false };
    }

    // Sandbox / Simulation Mode
    console.info(`[WhatsApp OTP Sandbox] Verification code for ${formattedPhone}: ${params.code}`);
    return { success: true, simulated: true };
  } catch (err: any) {
    console.error('[WhatsApp OTP Exception]', err);
    return { success: true, simulated: true };
  }
}
