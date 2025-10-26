import nodemailer from 'nodemailer';

async function send(mailOptions) {
  // Create a transporter object using SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'localhost',
    port: process.env.EMAIL_PORT || 1025,
    secure: process.env.NODE_ENV === 'production' ? true : false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Send the email
  let info = await transporter.sendMail(mailOptions);
  return info;
}

const email = {
  send,
};

export default email;
