const { Resend } = require('resend');

const sendEmail = async ({ to, subject, html }) => {
  // Initialize Resend inside the function or globally using your new env key
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'StackDine <onboarding@resend.dev>', // Resend's default free domain identifier
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;