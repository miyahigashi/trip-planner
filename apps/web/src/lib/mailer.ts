// apps/web/src/lib/mailer.ts
import nodemailer from "nodemailer";
export async function sendInviteEmail({ to, projectTitle, acceptUrl }:
  { to: string; projectTitle: string; acceptUrl: string }) {
  if (process.env.NODE_ENV !== "production") {
    const test = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: test.smtp.host, port: test.smtp.port, secure: test.smtp.secure,
      auth: { user: test.user, pass: test.pass },
    });
    const info = await transporter.sendMail({
      from: '"Trip Planner" <no-reply@example.com>',
      to, subject: `「${projectTitle}」に招待されました`,
      html: `参加するには <a href="${acceptUrl}">こちら</a>`,
    });
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // これで送信確認OK
    return { messageId: info.messageId };
  }
  // 本番は SES/SendGrid/Resend 等に差し替え
}
