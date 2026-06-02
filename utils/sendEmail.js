// const nodemailer = require('nodemailer');

// const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"StackDine" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//   });
// };

// module.exports = sendEmail;

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