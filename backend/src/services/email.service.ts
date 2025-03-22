import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  } as SMTPTransport.Options);
};

/**
 * Send an email
 * @param {EmailOptions} options - Email options
 * @returns {Promise<any>} - Nodemailer response
 */
export const sendEmail = async (options: EmailOptions): Promise<any> => {
  try {
    // Create transporter
    const transporter = createTransporter();
    
    // Define email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Ticketing System'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Email could not be sent: ${error}`);
  }
};

/**
 * Send a welcome email to a new user
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<any>} - Nodemailer response
 */
export const sendWelcomeEmail = async (to: string, name: string): Promise<any> => {
  return sendEmail({
    to,
    subject: 'Welcome to the Dalhousie Arts Centre Ticketing System',
    text: `Hello ${name},\n\nWelcome to the Dalhousie Arts Centre Ticketing System. We're excited to have you on board!\n\nWith your new account, you can now:\n- Browse upcoming events\n- Purchase tickets\n- View your ticket history\n- Receive updates on new events\n\nIf you have any questions, please don't hesitate to contact our support team.\n\nBest regards,\nThe Dalhousie Arts Centre Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h1 style="color: #003366; text-align: center;">Welcome to the Dalhousie Arts Centre!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to the Dalhousie Arts Centre Ticketing System. We're excited to have you on board!</p>
        <p>With your new account, you can now:</p>
        <ul>
          <li>Browse upcoming events</li>
          <li>Purchase tickets</li>
          <li>View your ticket history</li>
          <li>Receive updates on new events</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Dalhousie Arts Centre Team</p>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>Dalhousie Arts Centre, 6101 University Ave, Halifax, NS B3H 4R2</p>
          <p>© ${new Date().getFullYear()} Dalhousie Arts Centre. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send a ticket confirmation email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} eventTitle - Event title
 * @param {string} ticketNumber - Ticket number
 * @param {Date} eventDate - Event date
 * @param {string} venueName - Venue name
 * @returns {Promise<any>} - Nodemailer response
 */
export const sendTicketConfirmationEmail = async (
  to: string,
  name: string,
  eventTitle: string,
  ticketNumber: string,
  eventDate: Date,
  venueName: string
): Promise<any> => {
  return sendEmail({
    to,
    subject: `Ticket Confirmation - ${eventTitle}`,
    text: `Hello ${name},\n\nThank you for your purchase!\n\nYour ticket for ${eventTitle} has been confirmed. Here are the details:\n\nTicket Number: ${ticketNumber}\nEvent: ${eventTitle}\nDate: ${eventDate.toLocaleDateString()}\nVenue: ${venueName}\n\nYou can access your ticket by logging into your account at any time.\n\nWe look forward to seeing you at the event!\n\nBest regards,\nThe Dalhousie Arts Centre Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h1 style="color: #003366; text-align: center;">Ticket Confirmation</h1>
        <p>Hello ${name},</p>
        <p>Thank you for your purchase!</p>
        <p>Your ticket for <strong>${eventTitle}</strong> has been confirmed. Here are the details:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate.toLocaleDateString()}</p>
          <p><strong>Venue:</strong> ${venueName}</p>
        </div>
        <p>You can access your ticket by logging into your account at any time.</p>
        <p>We look forward to seeing you at the event!</p>
        <p>Best regards,<br>The Dalhousie Arts Centre Team</p>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>Dalhousie Arts Centre, 6101 University Ave, Halifax, NS B3H 4R2</p>
          <p>© ${new Date().getFullYear()} Dalhousie Arts Centre. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}; 