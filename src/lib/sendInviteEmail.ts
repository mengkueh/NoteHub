import sgMail from "@sendgrid/mail";

const FROM_EMAIL = process.env.EMAIL_FROM || "no-reply@yourdomain.com";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface InviteEmailParams {
  inviteeEmail: string;
  inviterEmail: string | null;
  noteTitle: string;
  acceptUrl: string;
  expiresAt?: Date;
}

export default async function sendInviteEmail({
  inviteeEmail,
  inviterEmail,
  noteTitle,
  acceptUrl,
  expiresAt,
}: InviteEmailParams) {
  const formattedExpiry = expiresAt
    ? expiresAt.toLocaleDateString()
    : "soon";

  const msg = {
    to: inviteeEmail,
    from: FROM_EMAIL,
    subject: `You've been invited to collaborate on "${noteTitle}"`,
    html: `
      <p>Hello,</p>
      <p>${inviterEmail ?? "Someone"} has invited you to collaborate on the note <b>"${noteTitle}"</b>.</p>
      <p>Click below to accept the invite:</p>
      <p><a href="${acceptUrl}" target="_blank">Accept Invitation</a></p>
      <p>This invite expires on <b>${formattedExpiry}</b>.</p>
    `,
  };

  await sgMail.send(msg);
}
