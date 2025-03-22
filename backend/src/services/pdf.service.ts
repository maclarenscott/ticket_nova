import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Ticket } from '../types/ticket.types';

/**
 * Generate a PDF ticket
 * @param {Ticket} ticket - The ticket data
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
export const generatePDF = async (ticket: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      // Buffer to store PDF
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add ticket content to PDF
      generateTicketContent(doc, ticket);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate ticket content in the PDF
 * @param {PDFKit.PDFDocument} doc - The PDF document
 * @param {Ticket} ticket - The ticket data
 */
const generateTicketContent = async (doc: any, ticket: any) => {
  // Add header with logo
  doc.fontSize(25)
    .font('Helvetica-Bold')
    .text('Dalhousie Arts Centre', { align: 'center' })
    .moveDown(0.5);
  
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .text('E-Ticket', { align: 'center' })
    .moveDown(0.5);
  
  // Add ticket details
  doc.fontSize(12)
    .font('Helvetica')
    .text(`Ticket #: ${ticket.ticketNumber}`, { align: 'center' })
    .moveDown(1);
  
  // Add horizontal line
  doc.moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke()
    .moveDown(1);
  
  // Add event details
  doc.fontSize(16)
    .font('Helvetica-Bold')
    .text(ticket.event.title)
    .moveDown(0.5);
  
  doc.fontSize(12)
    .font('Helvetica')
    .text(`Date: ${new Date(ticket.performance.date).toLocaleDateString()}`)
    .text(`Time: ${ticket.performance.startTime}`)
    .text(`Venue: ${ticket.event.venue.name}`)
    .text(`Address: ${ticket.event.venue.address}`)
    .moveDown(1);
  
  // Add seating details
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Seating Details')
    .moveDown(0.5);
  
  doc.fontSize(12)
    .font('Helvetica')
    .text(`Section: ${ticket.section}`)
    .text(`Row: ${ticket.row}`)
    .text(`Seat: ${ticket.seat}`)
    .moveDown(1);
  
  // Add customer details
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .text('Customer')
    .moveDown(0.5);
  
  doc.fontSize(12)
    .font('Helvetica')
    .text(`Name: ${ticket.customer.firstName} ${ticket.customer.lastName}`)
    .text(`Email: ${ticket.customer.email}`)
    .moveDown(1);
  
  // Add horizontal line
  doc.moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke()
    .moveDown(1);
  
  // Generate QR code and add to PDF
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCodeData);
    
    doc.fontSize(14)
      .font('Helvetica-Bold')
      .text('Scan QR Code', { align: 'center' })
      .moveDown(0.5);
    
    // Position QR code in the center
    const qrSize = 150;
    const startX = (doc.page.width - qrSize) / 2;
    
    doc.image(qrCodeDataUrl, startX, doc.y, { width: qrSize, height: qrSize });
    
    doc.moveDown(7); // Move down to account for QR code size
    
    // Add footer with terms
    doc.fontSize(10)
      .font('Helvetica')
      .text('This ticket is only valid for the event and seat specified. Unauthorized duplication is prohibited.', { align: 'center' })
      .moveDown(0.5)
      .text('© Dalhousie Arts Centre. All rights reserved.', { align: 'center' });
  } catch (error) {
    console.error('Error generating QR code:', error);
    doc.text('QR Code generation failed', { align: 'center' });
  }
}; 