import { Resend } from 'resend';

// Initialize Resend with environment key
const resend = new Resend(process.env.RESEND_API_KEY);

interface InquiryEmailProps {
  anchorEmail: string;
  anchorName: string;
  inquiry: {
    name: string;
    phone: string;
    email?: string;
    event_type?: string;
    event_date?: string;
    event_city?: string;
    budget_range?: string;
    message?: string;
  };
}

/**
 * Send an email alert to the anchor whenever a new inquiry is received.
 */
export async function sendInquiryAlertEmail({
  anchorEmail,
  anchorName,
  inquiry,
}: InquiryEmailProps) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_placeholder') {
    console.warn('⚠️ Resend API Key is not configured. Skipping email alert.');
    return { success: false, reason: 'unconfigured_key' };
  }

  try {
    const formattedDate = inquiry.event_date || 'To be decided';
    let cleanPhone = inquiry.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.replace(/^0+/, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
    const whatsappLink = `https://wa.me/${phoneWithCountry}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0F; color: #FFFFFF; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #12121A; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #6C5CE7, #A29BFE); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { display: inline-block; background: rgba(108, 92, 231, 0.2); color: #A29BFE; border: 1px solid rgba(108, 92, 231, 0.4); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-top: 12px; }
    .heading { font-size: 22px; font-weight: 700; margin-top: 8px; margin-bottom: 4px; color: #FFFFFF; }
    .subtext { color: #A0A0B0; font-size: 14px; margin-top: 0; }
    .details-box { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04); font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #808090; font-weight: 500; }
    .detail-value { color: #FFFFFF; font-weight: 600; text-align: right; }
    .message-box { background: rgba(108, 92, 231, 0.05); border-left: 3px solid #6C5CE7; padding: 14px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #E0E0F0; }
    .actions { display: flex; gap: 12px; margin-top: 28px; }
    .btn-primary { display: block; width: 100%; text-align: center; background: #6C5CE7; color: #FFFFFF; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; }
    .btn-secondary { display: block; width: 100%; text-align: center; background: #25D366; color: #FFFFFF; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; margin-top: 10px; }
    .footer { text-align: center; font-size: 12px; color: #606070; margin-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">StageHost</div>
      <div><span class="badge">🔥 New Client Inquiry</span></div>
      <h1 class="heading">You received a new inquiry!</h1>
      <p class="subtext">Hi ${anchorName}, a potential client just reached out through your StageHost portfolio.</p>
    </div>

    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Client Name</span>
        <span class="detail-value">${inquiry.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone</span>
        <span class="detail-value"><a href="tel:+91${inquiry.phone}" style="color: #6C5CE7; text-decoration: none;">+91 ${inquiry.phone}</a></span>
      </div>
      ${inquiry.email ? `
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value"><a href="mailto:${inquiry.email}" style="color: #6C5CE7; text-decoration: none;">${inquiry.email}</a></span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Event Type</span>
        <span class="detail-value">${inquiry.event_type || 'Not specified'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event Date</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Event City</span>
        <span class="detail-value">${inquiry.event_city || 'Not specified'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Budget</span>
        <span class="detail-value" style="color: #F0A500;">${inquiry.budget_range || 'Flexible'}</span>
      </div>
    </div>

    ${inquiry.message ? `
    <div style="font-size: 13px; font-weight: 600; color: #A0A0B0; margin-bottom: 6px;">Client's Message:</div>
    <div class="message-box">"${inquiry.message}"</div>
    ` : ''}

    <a href="${whatsappLink}" class="btn-secondary" target="_blank">
      💬 Quick WhatsApp Reply (+91 ${inquiry.phone})
    </a>

    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stagehost.in'}/inquiries" class="btn-primary" style="margin-top: 10px;">
      ⚡ View in StageHost Inquiries
    </a>

    <div class="footer">
      Sent via <strong>StageHost</strong> — The #1 Portfolio & Booking Platform for Anchors & Emcees in India.<br>
      © ${new Date().getFullYear()} StageHost. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const data = await resend.emails.send({
      from: 'StageHost <notifications@stagehost.in>', // Note: during dev, Resend allows onboarding@resend.dev or verified domain
      to: [anchorEmail],
      replyTo: inquiry.email || undefined,
      subject: `🎉 New Event Inquiry from ${inquiry.name} (${inquiry.event_type || 'Event'})`,
      html: htmlContent,
    });

    console.log('✅ Resend email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send Resend email:', error);
    return { success: false, error };
  }
}
