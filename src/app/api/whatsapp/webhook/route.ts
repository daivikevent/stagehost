/**
 * Meta WhatsApp Cloud API Webhook Listener
 * GET /api/whatsapp/webhook — Meta Verification Challenge
 * POST /api/whatsapp/webhook — Delivery Status & Incoming Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Handle Meta Webhook Verification handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const adminClient = createAdminClient();
  let expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'bookmyartist_whatsapp_verify_token';

  const { data: dbSetting } = await adminClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'whatsapp_verify_token')
    .maybeSingle();

  if (dbSetting?.value) {
    expectedToken = dbSetting.value;
  }

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ [WhatsApp Webhook] Meta challenge verification succeeded');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('❌ [WhatsApp Webhook] Verification token mismatch');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * Handle WhatsApp Cloud API event delivery notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          const statuses = value?.statuses || [];

          for (const status of statuses) {
            console.log(
              `📲 [WhatsApp Status Update] Msg ID: ${status.id} | Status: ${status.status} | Recipient: ${status.recipient_id}`
            );
          }
        }
      }
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Error processing event:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
