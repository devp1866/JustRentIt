import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: `"JustRentIt Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const getEmailTemplate = (otp, type) => {
    let title = '';
    let message = '';

    switch (type) {
        case 'EMAIL_VERIFICATION':
            title = 'Verify Your Email';
            message = 'Thank you for signing up with JustRentIt. Please use the code below to verify your email address.';
            break;
        case 'PASSWORD_RESET':
            title = 'Reset Your Password';
            message = 'We received a request to reset your password. Use the code below to proceed.';
            break;
        case 'PHONE_VERIFICATION':
            title = 'Verify Your Phone';
            message = 'Use the code below to verify your phone number and upgrade your account.';
            break;
        default:
            title = 'Verification Code';
            message = 'Your verification code is below.';
    }

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a8a; margin: 0;">JustRentIt</h1>
        <p style="color: #666; font-size: 14px;">Your Trusted Rental Partner</p>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="color: #333; margin-top: 0;">${title}</h2>
        <p style="color: #555; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="color: #777; font-size: 12px; text-align: center;">This code will expire in 15 minutes.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} JustRentIt. All rights reserved.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `;
};
