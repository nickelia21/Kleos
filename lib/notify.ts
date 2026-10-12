// ---------------------------------------------------------------------------
// Outbound notification layer — DEV MOCKS ONLY in this prototype.
//
// Both transports log to the server console instead of sending anything, per
// the prototype spec. To go real, implement Mailer with Resend/Postmark and
// SmsSender with Twilio/Vonage and swap the exports at the bottom — nothing
// else in the codebase knows the difference.
//
// Note on PII: the app never logs emails/phones anywhere EXCEPT these two
// console transports, whose entire purpose is to show the developer the
// verification link / OTP that a real provider would deliver.
// ---------------------------------------------------------------------------

export interface Mailer {
  sendMail(msg: { to: string; subject: string; text: string }): Promise<void>;
}

export interface SmsSender {
  sendSms(msg: { to: string; body: string }): Promise<void>;
}

const BANNER = "═".repeat(72);

class ConsoleMailer implements Mailer {
  async sendMail({ to, subject, text }: { to: string; subject: string; text: string }) {
    console.log(
      `\n${BANNER}\n📧  KLEOS DEV MAILER (no email actually sent)\n` +
        `    To:      ${to}\n    Subject: ${subject}\n\n${text}\n${BANNER}\n`
    );
  }
}

class ConsoleSms implements SmsSender {
  async sendSms({ to, body }: { to: string; body: string }) {
    console.log(
      `\n${BANNER}\n📱  KLEOS DEV SMS (no SMS actually sent)\n` +
        `    To: ${to}\n\n    ${body}\n${BANNER}\n`
    );
  }
}

// Real-provider drop-in point (e.g. `new ResendMailer(process.env.RESEND_API_KEY)`).
export const mailer: Mailer = new ConsoleMailer();
export const sms: SmsSender = new ConsoleSms();
