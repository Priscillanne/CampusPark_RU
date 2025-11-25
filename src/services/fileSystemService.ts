import { jsPDF } from 'jspdf';

export interface BookingReceipt {
  bookingId: string;
  fullName: string;
  studentId: string;
  carPlate: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  zone: string;
  slotLabel: string;
  bookedBayType: string;
  parkingType: string;
  status: string;
  createdAt: string;
}

export class FileSystemService {
  
  // Download individual booking receipt as PDF
  static async exportBookingReceipt(bookingData: BookingReceipt): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Add Raffles University Header
      this.addUniversityHeader(doc);
      
      // Add Receipt Title
      this.addReceiptTitle(doc);
      
      // Add Booking Details
      this.addBookingDetails(doc, bookingData);
      
      // Add Footer
      this.addFooter(doc);
      
      // Save the PDF
      const fileName = `RU_Parking_Receipt_${bookingData.bookingId}.pdf`;
      doc.save(fileName);
      
      console.log('✅ PDF Receipt downloaded:', fileName);
    } catch (error) {
      console.error('❌ Error creating PDF receipt:', error);
      throw new Error('Failed to create PDF receipt: ' + error);
    }
  }

  // Download all booking history as PDF
  static async exportBookingHistory(bookings: BookingReceipt[]): Promise<void> {
    try {
      const doc = new jsPDF();
      
      // Add Raffles University Header
      this.addUniversityHeader(doc);
      
      // Add History Title
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102); // Dark blue
      doc.text('PARKING BOOKING HISTORY', 105, 50, { align: 'center' });
      
      // Add summary
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Bookings: ${bookings.length}`, 20, 70);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 80);
      
      // Add bookings table
      let yPosition = 100;
      bookings.forEach((booking, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
          this.addUniversityHeader(doc);
        }
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Booking header
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.text(`Booking ${index + 1}: ${booking.date} | ${booking.zone} ${booking.slotLabel}`, 25, yPosition + 5);
        
        // Booking details
        yPosition += 12;
        doc.text(`Time: ${booking.timeIn} - ${booking.timeOut} (${booking.duration})`, 25, yPosition);
        yPosition += 6;
        doc.text(`Student: ${booking.fullName} | Car: ${booking.carPlate}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Status: ${booking.status} | Type: ${booking.bookedBayType}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Booking ID: ${booking.bookingId}`, 25, yPosition);
        
        yPosition += 15; // Space between bookings
      });
      
      // Add Footer
      this.addFooter(doc);
      
      // Save the PDF
      const fileName = `RU_Parking_History_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      console.log('✅ PDF History downloaded:', fileName);
    } catch (error) {
      console.error('❌ Error creating PDF history:', error);
      throw new Error('Failed to create PDF history: ' + error);
    }
  }

  // Add Raffles University Header
  private static addUniversityHeader(doc: jsPDF): void {
    // University header with background
    doc.setFillColor(0, 51, 102); // Dark blue background
    doc.rect(0, 0, 210, 30, 'F');
    
    // University name
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont('helvetica', 'bold');
    doc.text('RAFFLES UNIVERSITY', 105, 15, { align: 'center' });
    
    // Tagline
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('Excellence in Education', 105, 22, { align: 'center' });
    
    // Add a decorative line
    doc.setDrawColor(255, 204, 0); // Gold line
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
  }

  // Add Receipt Title
  private static addReceiptTitle(doc: jsPDF): void {
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102); // Dark blue
    doc.setFont('helvetica', 'bold');
    doc.text('PARKING RECEIPT', 105, 50, { align: 'center' });
    
    // Receipt subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Parking Confirmation', 105, 57, { align: 'center' });
  }

  // Add Booking Details
  private static addBookingDetails(doc: jsPDF, booking: BookingReceipt): void {
    let yPosition = 80;
    
    // Section header
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', 20, yPosition);
    yPosition += 10;
    
    // Details table
    const details = [
      { label: 'Booking ID', value: booking.bookingId },
      { label: 'Student Name', value: booking.fullName },
      { label: 'Student ID', value: booking.studentId },
      { label: 'Car Plate', value: booking.carPlate },
      { label: 'Date', value: booking.date },
      { label: 'Time Slot', value: `${booking.timeIn} - ${booking.timeOut}` },
      { label: 'Duration', value: booking.duration },
      { label: 'Parking Zone', value: booking.zone },
      { label: 'Parking Spot', value: booking.slotLabel },
      { label: 'Parking Type', value: `${booking.bookedBayType} ${booking.parkingType}` },
      { label: 'Status', value: booking.status },
      { label: 'Booked On', value: booking.createdAt }
    ];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    details.forEach((detail, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
        this.addUniversityHeader(doc);
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 4, 170, 8, 'F');
      }
      
      doc.setTextColor(0, 0, 0);
      doc.text(`${detail.label}:`, 25, yPosition);
      doc.setTextColor(0, 51, 102);
      doc.text(detail.value, 80, yPosition);
      
      yPosition += 8;
    });
    
    // Important Notes section
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT NOTES', 20, yPosition);
    yPosition += 8;
    
    const notes = [
      '• Please arrive on time for your booking',
      '• Late returns may incur penalties (RM10 every 5 minutes)',
      '• Maximum penalty: RM30 after 15 minutes',
      '• Keep this receipt for your records',
      '• Contact campus security for assistance'
    ];
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    notes.forEach(note => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        this.addUniversityHeader(doc);
      }
      doc.text(note, 25, yPosition);
      yPosition += 5;
    });
  }

  // Add Footer
  private static addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Campus Parking System - Raffles University', 105, 285, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Generated on: ' + new Date().toLocaleString(), 105, 295, { align: 'center' });
      
      // University contact
      doc.text('Contact: campus-parking@raffles.edu.my | +603-1234 5678', 105, 275, { align: 'center' });
    }
  }

  // QR Code version (optional - for future enhancement)
  private static addQRCode(doc: jsPDF, bookingId: string, yPosition: number): void {
    // This would require additional QR code library
    // For now, we'll leave it as a placeholder
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('QR Code: ' + bookingId, 150, yPosition);
  }
}