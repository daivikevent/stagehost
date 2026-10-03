/**
 * Meta WhatsApp Cloud API Service
 * Handles automated lead alerts and notifications for artists.
 * Reads credentials from environment variables or `platform_settings` table.
 * Supports sandbox test mode with simulated delivery when credentials are not configured.
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface WhatsAppInquiryAlertPayload {
  artistPhone: string;
  artistName: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventCity: string;
  budgetRange?: string;
  artistSlug?: string;
  inquiryId?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  recipient?: string;
  error?: string;
}

/**
 * Clean and format Indian / International phone numbers for WhatsApp API.
 * Ensures E.164 format without '+' (e.g., '919820198201').
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');

  // If 10-digit Indian number, add 91 prefix
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }

  // If 11-digit starting with 0 (e.g., 09820198201)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.slice(1)}`;
  }

  return digitsOnly;
}

/**
 * Retrieve WhatsApp Cloud API credentials from platform_settings or process.env.
 */
async function getWhatsAppCredentials() {
  const adminClient = createAdminClient();

  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  let templateName = process.env.WHATSAPP_INQUIRY_TEMPLATE || 'inquiry_alert_v1';

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

  return {
    phoneNumberId,
    accessToken,
    templateName,
    isConfigured,
  };
}

/**
 * Send an automated WhatsApp notification ping to an artist when a lead arrives.
 */
export async function sendWhatsAppInquiryAlert(
  payload: WhatsAppInquiryAlertPayload
): Promise<WhatsAppSendResult> {
  const recipient = formatPhoneNumberForWhatsApp(payload.artistPhone);

  if (!recipient || recipient.length < 10) {
    console.warn('[WhatsApp Alert] Skipped: Invalid recipient phone number:', payload.artistPhone);
    return { success: false, error: 'Invalid recipient phone number' };
  }

  const { phoneNumberId, accessToken, templateName, isConfigured } = await getWhatsAppCredentials();
  const cleanClientPhone = formatPhoneNumberForWhatsApp(payload.clientPhone);

  // Fallback direct text message content
  const alertText = 
`🔔 *NEW BOOKMYARTIST BOOKING LEAD* 🔔

Hi ${payload.artistName}! You received a new event booking inquiry:

👤 *Client:* ${payload.clientName}
📞 *Phone:* +${cleanClientPhone}
🎉 *Event:* ${payload.eventType}
📅 *Date:* ${payload.eventDate}
📍 *City:* ${payload.eventCity}
💰 *Budget:* ${payload.budgetRange || 'Flexible'}

👉 *Reply to Client on WhatsApp:* https://wa.me/${cleanClientPhone}?text=${encodeURIComponent(`Hi ${payload.clientName}! Thank you for your inquiry on BookMyArtist regarding ${payload.eventType} on ${payload.eventDate}. I'd love to discuss!`)}
👉 *View Inquiries Dashboard:* https://bookmyartist.in/inquiries`;

  // 1. Sandbox Test Simulation Mode (if credentials not configured)
  if (!isConfigured) {
    console.log('----------------------------------------------------');
    console.log(`📱 [WhatsApp Cloud API — Sandbox Simulation Mode]`);
    console.log(`📤 To: +${recipient} (${payload.artistName})`);
    console.log(`💬 Message:\n${alertText}`);
    console.log('----------------------------------------------------');

    return {
      success: true,
      simulated: true,
      recipient,
      messageId: `sim_wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  // 2. Real Meta Graph API Execution
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    // Try template payload first
    const templateBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: payload.artistName },
              { type: 'text', text: payload.clientName },
              { type: 'text', text: `+${cleanClientPhone}` },
              { type: 'text', text: payload.eventType },
              { type: 'text', text: payload.eventDate },
              { type: 'text', text: payload.eventCity },
              { type: 'text', text: payload.budgetRange || 'Flexible' },
            ],
          },
        ],
      },
    };

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateBody),
    });

    // If template fails (e.g., template not yet approved by Meta), fallback to standard text message
    if (!response.ok) {
      const templateError = await response.text();
      console.warn('[WhatsApp Cloud API] Template delivery failed, attempting direct text fallback:', templateError);

      const textBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: true,
          body: alertText,
        },
      };

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WhatsApp Cloud API] Delivery failed:', errorText);
      return { success: false, error: errorText, recipient };
    }

    const data = await response.json();
    const messageId = data?.messages?.[0]?.id;

    console.log(`✅ [WhatsApp Cloud API] Sent successfully to +${recipient} (ID: ${messageId})`);
    return { success: true, messageId, recipient };
  } catch (err: any) {
    console.error('[WhatsApp Cloud API] Network error:', err);
    return { success: false, error: err.message, recipient };
  }
}
