import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await getTransporter().sendMail({
    from: `"NorzaMart" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
