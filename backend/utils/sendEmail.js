import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Create a reusable transporter object using SMTP transport
// This is more efficient than creating a new transporter for every email.
const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_port === 465, // Use true for port 465, false for others
    auth: {
        user: config.smtp_user,
        pass: config.smtp_pass,
    },
});

/**
 * Sends an email.
 * @param {object} options - The email options.
 * @param {string} options.email - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.message - The HTML content of the email.
 */
const sendEmail = async (options) => {
    const message = {
        from: `"${config.smtp_from_name || 'My Tennis Team'}" <${config.smtp_from_email}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    try {
        const info = await transporter.sendMail(message);
    } catch (error) {
        console.error('Error sending email:', error);
        // Re-throw the error so the calling function knows the email failed.
        throw new Error('Email could not be sent.');
    }
};

export default sendEmail;