import { Resend } from 'resend';
import twilio from 'twilio';
import { formatINR } from './utils';

// Helper to get Resend instance safely
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  return new Resend(apiKey);
}

// Helper to get Twilio instance safely
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken || accountSid.trim() === '' || authToken.trim() === '') {
    return null;
  }
  return twilio(accountSid, authToken);
}

export interface ReminderNotificationParams {
  friendName: string;
  friendEmail?: string | null;
  friendWhatsapp?: string | null;
  amountOwed: number;
  note?: string | null;
}

/**
 * Send a friendly reminder email to a friend via Resend.
 */
export async function sendReminderEmail({
  friendName,
  friendEmail,
  amountOwed,
  note,
}: ReminderNotificationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!friendEmail) {
    return { success: false, error: 'Friend email not provided' };
  }

  const resend = getResendClient();
  const formattedAmount = formatINR(amountOwed);
  const myName = process.env.MY_NAME || 'Your friend';

  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY not configured. Mocking reminder email delivery.');
    return { success: true, messageId: 'mock-resend-id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'MoneyTrack <onboarding@resend.dev>',
      to: friendEmail,
      subject: `Friendly reminder from ${myName} for ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf8ff; border-radius: 16px; border: 1px solid #e2e7ff;">
          <h2 style="color: #3525cd; margin-top: 0;">Hi ${friendName}! 👋</h2>
          <p style="font-size: 15px; color: #131b2e; line-height: 1.6;">
            Just a gentle reminder regarding our shared expense on MoneyTrack.
          </p>
          <div style="background: #ffffff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #dae2fd;">
            <p style="margin: 0; font-size: 13px; color: #464555; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Pending Balance</p>
            <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: 800; color: #006c49;">${formattedAmount}</p>
            ${note ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #464555;">Note: <em>${note}</em></p>` : ''}
          </div>
          <p style="font-size: 14px; color: #464555;">
            You can settle up via UPI or bank transfer at your convenience. Thank you!
          </p>
          <hr style="border: none; border-top: 1px solid #dae2fd; margin: 24px 0;" />
          <p style="font-size: 11px; color: #777587; text-align: center; margin: 0;">
            Sent via MoneyTrack Personal Ledger & Debt Management
          </p>
        </div>
      `,
    });

    return { success: true, messageId: data.data?.id };
  } catch (error: any) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: error.message || 'Error sending email' };
  }
}

/**
 * Send WhatsApp reminder message via Twilio Sandbox.
 */
export async function sendReminderWhatsApp({
  friendName,
  friendWhatsapp,
  amountOwed,
  note,
}: ReminderNotificationParams): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!friendWhatsapp) {
    return { success: false, error: 'Friend WhatsApp number not provided' };
  }

  const twilioClient = getTwilioClient();
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const myName = process.env.MY_NAME || 'Your friend';
  const formattedAmount = formatINR(amountOwed);

  // Format to standard E.164 with whatsapp: prefix
  const toWhatsApp = friendWhatsapp.startsWith('whatsapp:')
    ? friendWhatsapp
    : `whatsapp:${friendWhatsapp}`;

  const body = `Hi ${friendName} 👋, this is a quick reminder from ${myName} regarding our pending expense of *${formattedAmount}* on MoneyTrack.${
    note ? ` Note: ${note}.` : ''
  } Please settle whenever convenient. Thanks!`;

  if (!twilioClient) {
    console.warn('[Twilio] Credentials not configured. Mocking WhatsApp reminder delivery.');
    return { success: true, sid: 'mock-twilio-sid' };
  }

  try {
    const message = await twilioClient.messages.create({
      from: fromWhatsApp,
      to: toWhatsApp,
      body,
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('Failed to send reminder WhatsApp:', error);
    return { success: false, error: error.message || 'Error sending WhatsApp' };
  }
}

export interface SettlementEmailParams {
  friendName: string;
  friendEmail?: string | null;
  myEmail?: string | null;
  amountSettled: number;
  settlementDate: Date;
  remainingBalance: number;
  note?: string | null;
}

/**
 * Send Settlement Confirmation Emails via Resend to both Self and Friend (if friend email present).
 */
export async function sendSettlementEmailConfirmations({
  friendName,
  friendEmail,
  myEmail,
  amountSettled,
  settlementDate,
  remainingBalance,
  note,
}: SettlementEmailParams) {
  const resend = getResendClient();
  const myName = process.env.MY_NAME || 'Aditya';
  const formattedSettled = formatINR(amountSettled);
  const formattedDate = settlementDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedRemaining =
    remainingBalance > 0
      ? `+${formatINR(remainingBalance)} (They still owe you)`
      : remainingBalance < 0
      ? `-${formatINR(Math.abs(remainingBalance))} (You still owe them)`
      : '₹0.00 (All Clear / Fully Settled)';

  const results = {
    self: { success: false, messageId: undefined as string | undefined, error: undefined as string | undefined },
    friend: { success: false, messageId: undefined as string | undefined, error: undefined as string | undefined },
  };

  const recipientMyEmail = myEmail || process.env.MY_EMAIL;

  // 1. Send confirmation email to Self
  if (recipientMyEmail) {
    const selfHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf8ff; border-radius: 16px; border: 1px solid #e2e7ff;">
        <h2 style="color: #006c49; margin-top: 0;">✅ Settlement Recorded</h2>
        <p style="font-size: 15px; color: #131b2e; line-height: 1.6;">
          You successfully recorded a settlement payment with <strong>${friendName}</strong> on MoneyTrack.
        </p>
        <div style="background: #ffffff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #dae2fd;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #777587; padding: 6px 0;">Friend:</td>
              <td style="font-weight: bold; color: #131b2e; text-align: right;">${friendName}</td>
            </tr>
            <tr>
              <td style="color: #777587; padding: 6px 0;">Amount Settled:</td>
              <td style="font-weight: 800; color: #006c49; text-align: right; font-size: 18px;">${formattedSettled}</td>
            </tr>
            <tr>
              <td style="color: #777587; padding: 6px 0;">Date:</td>
              <td style="color: #131b2e; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color: #777587; padding: 6px 0;">Updated Remaining Balance:</td>
              <td style="font-weight: bold; color: #3525cd; text-align: right;">${formattedRemaining}</td>
            </tr>
            ${
              note
                ? `<tr><td style="color: #777587; padding: 6px 0;">Note:</td><td style="color: #464555; text-align: right;">${note}</td></tr>`
                : ''
            }
          </table>
        </div>
        <p style="font-size: 13px; color: #464555;">
          Your live peer ledger and financial metrics have been updated.
        </p>
        <hr style="border: none; border-top: 1px solid #dae2fd; margin: 24px 0;" />
        <p style="font-size: 11px; color: #777587; text-align: center; margin: 0;">
          MoneyTrack Settlement Receipt
        </p>
      </div>
    `;

    if (!resend) {
      console.warn('[Resend] RESEND_API_KEY not configured. Mocking settlement email to self:', recipientMyEmail);
      results.self = { success: true, messageId: 'mock-self-settlement-id', error: undefined };
    } else {
      try {
        const data = await resend.emails.send({
          from: 'MoneyTrack <onboarding@resend.dev>',
          to: recipientMyEmail,
          subject: `✅ Settlement Recorded: ${formattedSettled} with ${friendName}`,
          html: selfHtml,
        });
        results.self = { success: true, messageId: data.data?.id, error: undefined };
      } catch (err: any) {
        console.error('Failed to send settlement email to self:', err);
        results.self = { success: false, messageId: undefined, error: err.message };
      }
    }
  }

  // 2. Send confirmation email to Friend if email is present
  if (friendEmail && friendEmail.trim() !== '') {
    const friendHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #faf8ff; border-radius: 16px; border: 1px solid #e2e7ff;">
        <h2 style="color: #006c49; margin-top: 0;">✅ Settlement Confirmation</h2>
        <p style="font-size: 15px; color: #131b2e; line-height: 1.6;">
          Hi ${friendName}, this is a confirmation that a settlement of <strong>${formattedSettled}</strong> was recorded with <strong>${myName}</strong> on <strong>${formattedDate}</strong>.
        </p>
        <div style="background: #ffffff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #dae2fd;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #777587; padding: 6px 0;">Amount Settled:</td>
              <td style="font-weight: 800; color: #006c49; text-align: right; font-size: 18px;">${formattedSettled}</td>
            </tr>
            <tr>
              <td style="color: #777587; padding: 6px 0;">Date:</td>
              <td style="color: #131b2e; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="color: #777587; padding: 6px 0;">Updated Remaining Balance:</td>
              <td style="font-weight: bold; color: #3525cd; text-align: right;">${formattedRemaining}</td>
            </tr>
            ${
              note
                ? `<tr><td style="color: #777587; padding: 6px 0;">Reference:</td><td style="color: #464555; text-align: right;">${note}</td></tr>`
                : ''
            }
          </table>
        </div>
        <p style="font-size: 13px; color: #464555;">
          Thank you for settling up! Your mutual ledger with ${myName} on MoneyTrack has been updated.
        </p>
        <hr style="border: none; border-top: 1px solid #dae2fd; margin: 24px 0;" />
        <p style="font-size: 11px; color: #777587; text-align: center; margin: 0;">
          Sent on behalf of ${myName} via MoneyTrack
        </p>
      </div>
    `;

    if (!resend) {
      console.warn('[Resend] Mocking settlement email to friend:', friendEmail);
      results.friend = { success: true, messageId: 'mock-friend-settlement-id', error: undefined };
    } else {
      try {
        const data = await resend.emails.send({
          from: 'MoneyTrack <onboarding@resend.dev>',
          to: friendEmail,
          subject: `✅ Settlement Receipt: ${formattedSettled} with ${myName}`,
          html: friendHtml,
        });
        results.friend = { success: true, messageId: data.data?.id, error: undefined };
      } catch (err: any) {
        console.error('Failed to send settlement email to friend:', err);
        results.friend = { success: false, messageId: undefined, error: err.message };
      }
    }
  }

  return results;
}

/**
 * Send WhatsApp settlement confirmation to both Friend and Self.
 */
export async function sendSettlementWhatsAppConfirmations({
  friendName,
  friendWhatsapp,
  myWhatsapp,
  amountSettled,
  settlementDate,
  note,
}: {
  friendName: string;
  friendWhatsapp?: string | null;
  myWhatsapp?: string | null;
  amountSettled: number;
  settlementDate: Date;
  note?: string | null;
}) {
  const twilioClient = getTwilioClient();
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const myName = process.env.MY_NAME || 'Me';
  const formattedAmount = formatINR(amountSettled);
  const formattedDate = settlementDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const results = {
    friend: { sent: false, error: null as string | null },
    self: { sent: false, error: null as string | null },
  };

  // 1. WhatsApp confirmation for Friend
  if (friendWhatsapp) {
    const toFriend = friendWhatsapp.startsWith('whatsapp:')
      ? friendWhatsapp
      : `whatsapp:${friendWhatsapp}`;
    const friendMessage = `✅ *Settlement Confirmed!*\n\nSettled *${formattedAmount}* with ${myName} on ${formattedDate}.${
      note ? ` (${note})` : ''
    }\nYour mutual ledger on MoneyTrack has been updated.`;

    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          from: fromWhatsApp,
          to: toFriend,
          body: friendMessage,
        });
        results.friend.sent = true;
      } catch (err: any) {
        results.friend.error = err.message;
      }
    } else {
      console.warn('[Twilio] Mocking settlement WhatsApp to friend:', friendMessage);
      results.friend.sent = true;
    }
  }

  // 2. WhatsApp confirmation for Self
  const selfWhatsappTarget = myWhatsapp || process.env.MY_WHATSAPP_NUMBER;
  if (selfWhatsappTarget) {
    const toSelf = selfWhatsappTarget.startsWith('whatsapp:')
      ? selfWhatsappTarget
      : `whatsapp:${selfWhatsappTarget}`;
    const selfMessage = `✅ *MoneyTrack Settlement Recorded*\n\nYou recorded a settlement of *${formattedAmount}* with ${friendName} on ${formattedDate}.${
      note ? ` (${note})` : ''
    }\nYour live peer ledger and balances have been updated.`;

    if (twilioClient) {
      try {
        await twilioClient.messages.create({
          from: fromWhatsApp,
          to: toSelf,
          body: selfMessage,
        });
        results.self.sent = true;
      } catch (err: any) {
        results.self.error = err.message;
      }
    } else {
      console.warn('[Twilio] Mocking settlement WhatsApp to self:', selfMessage);
      results.self.sent = true;
    }
  }

  return results;
}

/**
 * Send Weekly Summary Report Email via Resend
 */
export async function sendWeeklySummaryEmail({
  recipientEmail,
  totalReceivables,
  totalPayables,
  netBalance,
  upcomingEMIs,
  recentSettlements,
}: {
  recipientEmail: string;
  totalReceivables: number;
  totalPayables: number;
  netBalance: number;
  upcomingEMIs: Array<{
    title: string;
    lender: string;
    amount: number;
    dueDate: Date;
    installmentNo: number;
  }>;
  recentSettlements: Array<{
    friendName: string;
    amount: number;
    date: Date;
    notes?: string | null;
  }>;
}) {
  const resend = getResendClient();
  const myName = process.env.MY_NAME || 'You';

  const emiRows =
    upcomingEMIs.length === 0
      ? '<p style="color: #777587; font-size: 13px;">No upcoming EMIs due this week! 🎉</p>'
      : upcomingEMIs
          .map(
            (e) => `
          <div style="padding: 10px 12px; background: #ffffff; border-radius: 8px; margin-bottom: 8px; border: 1px solid #dae2fd;">
            <div style="font-weight: bold; color: #131b2e; font-size: 14px;">${e.lender} - ${e.title}</div>
            <div style="font-size: 12px; color: #464555;">Due: ${new Date(e.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} &middot; Inst. #${e.installmentNo} &middot; <strong style="color: #3525cd;">${formatINR(e.amount)}</strong></div>
          </div>
        `
          )
          .join('');

  const settlementRows =
    recentSettlements.length === 0
      ? '<p style="color: #777587; font-size: 13px;">No settlements in the past 7 days.</p>'
      : recentSettlements
          .map(
            (s) => `
          <div style="padding: 10px 12px; background: #ffffff; border-radius: 8px; margin-bottom: 8px; border: 1px solid #dae2fd;">
            <div style="font-weight: bold; color: #006c49; font-size: 14px;">+${formatINR(s.amount)} settled with ${s.friendName}</div>
            <div style="font-size: 12px; color: #777587;">${new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${s.notes ? ` &middot; ${s.notes}` : ''}</div>
          </div>
        `
          )
          .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #faf8ff; border-radius: 16px; border: 1px solid #e2e7ff;">
      <h2 style="color: #3525cd; margin-top: 0;">📊 MoneyTrack Weekly Summary</h2>
      <p style="font-size: 14px; color: #464555;">Here is your weekly financial digest and peer ledger overview for ${myName}:</p>

      <!-- KPI Summary -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin: 16px 0;">
        <tr>
          <td style="background: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #dae2fd; width: 33%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #777587; font-weight: bold;">Receivables</div>
            <div style="font-size: 18px; font-weight: bold; color: #006c49; margin-top: 4px;">+${formatINR(totalReceivables)}</div>
          </td>
          <td style="background: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #dae2fd; width: 33%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #777587; font-weight: bold;">Payables</div>
            <div style="font-size: 18px; font-weight: bold; color: #960014; margin-top: 4px;">-${formatINR(totalPayables)}</div>
          </td>
          <td style="background: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #dae2fd; width: 33%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #777587; font-weight: bold;">Net Balance</div>
            <div style="font-size: 18px; font-weight: bold; color: ${netBalance >= 0 ? '#006c49' : '#960014'}; margin-top: 4px;">${netBalance >= 0 ? '+' : '-'}${formatINR(Math.abs(netBalance))}</div>
          </td>
        </tr>
      </table>

      <!-- Upcoming EMIs -->
      <div style="margin-top: 24px;">
        <h3 style="font-size: 15px; color: #131b2e; margin-bottom: 10px;">📅 Upcoming EMIs in the Next 7 Days</h3>
        ${emiRows}
      </div>

      <!-- Past 7 Days Settlements -->
      <div style="margin-top: 24px;">
        <h3 style="font-size: 15px; color: #131b2e; margin-bottom: 10px;">🤝 Settlements (Past 7 Days)</h3>
        ${settlementRows}
      </div>

      <hr style="border: none; border-top: 1px solid #dae2fd; margin: 24px 0;" />
      <p style="font-size: 11px; color: #777587; text-align: center; margin: 0;">
        MoneyTrack Automated Weekly Report
      </p>
    </div>
  `;

  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY not configured. Mocking weekly summary report delivery to', recipientEmail);
    return { success: true, messageId: 'mock-summary-email-id', html: htmlContent };
  }

  try {
    const data = await resend.emails.send({
      from: 'MoneyTrack Digest <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `📊 Your MoneyTrack Weekly Financial Summary - ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
      html: htmlContent,
    });

    return { success: true, messageId: data.data?.id, html: htmlContent };
  } catch (error: any) {
    console.error('Failed to send weekly summary email:', error);
    return { success: false, error: error.message || 'Error sending summary email' };
  }
}
