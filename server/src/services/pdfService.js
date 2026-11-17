import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, '../../assets/logo.png');

export function generateQuotationPDF(quotation, dataStream) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36, // 0.5 inch margins
        info: {
          Title: `Quotation - ${quotation.quotationNumber}`,
          Author: 'Subodhi Institute of Integral Education',
          Subject: quotation.title || 'Official Quotation'
        }
      });

      doc.pipe(dataStream);

      const primaryBlue = '#1e3a8a';
      const secondaryRed = '#dc2626';
      const slateDark = '#1e293b';
      const slateMuted = '#64748b';
      const tableBorder = '#e2e8f0';
      const rowBgAlt = '#f8fafc';

      const pageWidth = 595.28;
      const contentWidth = pageWidth - 72; // 523.28

      // ==========================================
      // HEADER SECTION: LOGO & INSTITUTE TITLE
      // ==========================================
      const headerTop = 36;
      let logoDrawn = false;

      if (fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, 36, headerTop, { width: 62, height: 62 });
          logoDrawn = true;
        } catch (e) {
          console.warn('Could not draw logo image:', e.message);
        }
      }

      const textStartX = logoDrawn ? 110 : 36;

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(primaryBlue)
        .text('SUBODHI INSTITUTE OF INTEGRAL EDUCATION', textStartX, headerTop);

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(secondaryRed)
        .text('Center for Human Development, Spiritual Formation & Social Transformation', textStartX, headerTop + 20);

      // Institute Contact Bar (from uploaded image details)
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(slateMuted)
        .text('Address: Wewala, Piliyandala, Sri Lanka | Phone: 011-2614317', textStartX, headerTop + 33)
        .text('Director: Rev. Fr: Lawrence Ramanayake (+94 77 789 9116) | Coordinator: Rev. Fr. Meril Gunawardena (+94 75 3 668 056)', textStartX, headerTop + 43)
        .text('Resource Facilitator: 011-2613705 | Official Web Portal & Training Facility', textStartX, headerTop + 53);

      // Horizontal separator line
      doc
        .moveTo(36, headerTop + 68)
        .lineTo(pageWidth - 36, headerTop + 68)
        .strokeColor(primaryBlue)
        .lineWidth(1.5)
        .stroke();

      // ==========================================
      // QUOTATION TITLE & STATUS BADGE BAR
      // ==========================================
      const titleBarTop = headerTop + 76;
      
      // Background bar
      doc
        .rect(36, titleBarTop, contentWidth, 26)
        .fillColor('#eff6ff')
        .fill();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(primaryBlue)
        .text('PRICE QUOTATION', 46, titleBarTop + 7);

      // Status pill on right side
      const statusText = (quotation.status || 'DRAFT').replace(/_/g, ' ');
      let pillBg = '#cbd5e1';
      let pillTextColor = '#0f172a';

      if (quotation.status === 'APPROVED' || quotation.status === 'CONVERTED') {
        pillBg = '#dcfce7'; // green-100
        pillTextColor = '#15803d'; // green-700
      } else if (quotation.status === 'PENDING_APPROVAL') {
        pillBg = '#fef3c7'; // amber-100
        pillTextColor = '#b45309'; // amber-700
      } else if (quotation.status === 'ADJUSTMENT_REQUESTED') {
        pillBg = '#e0e7ff'; // indigo-100
        pillTextColor = '#4338ca'; // indigo-700
      } else if (quotation.status === 'LOST' || quotation.status === 'REJECTED') {
        pillBg = '#fee2e2'; // red-100
        pillTextColor = '#b91c1c'; // red-700
      }

      const pillWidth = 125;
      const pillX = pageWidth - 36 - pillWidth - 10;
      doc
        .roundedRect(pillX, titleBarTop + 4, pillWidth, 18, 4)
        .fillColor(pillBg)
        .fill();

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(pillTextColor)
        .text(statusText.toUpperCase(), pillX, titleBarTop + 8, { width: pillWidth, align: 'center' });

      // ==========================================
      // META BOXES: CLIENT INFO & QUOTE INFO
      // ==========================================
      const metaTop = titleBarTop + 34;
      const colWidth = (contentWidth - 12) / 2;

      // Box 1: Quotation Details (Left)
      doc
        .rect(36, metaTop, colWidth, 90)
        .strokeColor(tableBorder)
        .lineWidth(1)
        .stroke();

      doc
        .rect(36, metaTop, colWidth, 18)
        .fillColor('#f1f5f9')
        .fill();

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(slateDark)
        .text('QUOTATION DETAILS', 44, metaTop + 5);

      const qDate = quotation.date ? new Date(quotation.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
      const vDate = quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-GB') : '30 Days from Issue';

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(slateMuted)
        .text('Quote Number:', 44, metaTop + 24)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(quotation.quotationNumber || 'QT-0000', 115, metaTop + 24)

        .font('Helvetica-Bold')
        .fillColor(slateMuted)
        .text('Date of Issue:', 44, metaTop + 37)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(qDate, 115, metaTop + 37)

        .font('Helvetica-Bold')
        .fillColor(slateMuted)
        .text('Valid Until:', 44, metaTop + 50)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(vDate, 115, metaTop + 50)

        .font('Helvetica-Bold')
        .fillColor(slateMuted)
        .text('Revision / Ver:', 44, metaTop + 63)
        .font('Helvetica')
        .fillColor(quotation.version > 1 ? secondaryRed : slateDark)
        .text(`v${quotation.version || 1} ${quotation.version > 1 ? '(Adjusted Quotation)' : '(Original)'}`, 115, metaTop + 63)

        .font('Helvetica-Bold')
        .fillColor(slateMuted)
        .text('Prepared By:', 44, metaTop + 76)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(`${quotation.createdBy?.name || 'Staff'} (${quotation.createdBy?.role || 'Employee'})`, 115, metaTop + 76);

      // Box 2: Client / Customer Information (Right)
      const col2X = 36 + colWidth + 12;
      doc
        .rect(col2X, metaTop, colWidth, 90)
        .strokeColor(tableBorder)
        .lineWidth(1)
        .stroke();

      doc
        .rect(col2X, metaTop, colWidth, 18)
        .fillColor('#f1f5f9')
        .fill();

      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(slateDark)
        .text('CLIENT / BILL TO', col2X + 8, metaTop + 5);

      const client = quotation.client || {};
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(primaryBlue)
        .text(client.organization || client.name || 'Valued Customer', col2X + 8, metaTop + 24)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(`Attn: ${client.name || 'Representative'}`, col2X + 8, metaTop + 37)
        .text(`Phone: ${client.phone || 'N/A'}`, col2X + 8, metaTop + 50)
        .text(`Email: ${client.email || 'N/A'}`, col2X + 8, metaTop + 63)
        .text(`Address: ${client.address || 'Colombo / Western Province, Sri Lanka'}`, col2X + 8, metaTop + 76, { width: colWidth - 16, height: 12, ellipsis: true });

      // Title line if present
      let currentY = metaTop + 98;
      if (quotation.title) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(slateDark)
          .text(`Subject: ${quotation.title}`, 36, currentY);
        currentY += 16;
      }

      // ==========================================
      // LINE ITEMS TABLE
      // ==========================================
      const tableTop = currentY;
      const colDef = [
        { label: '#', width: 25, align: 'center' },
        { label: 'Item Description', width: 238, align: 'left' },
        { label: 'Unit', width: 50, align: 'center' },
        { label: 'Qty', width: 45, align: 'right' },
        { label: 'Unit Price (Rs.)', width: 85, align: 'right' },
        { label: 'Total (Rs.)', width: 80, align: 'right' }
      ];

      // Table Header Row
      doc
        .rect(36, tableTop, contentWidth, 20)
        .fillColor(primaryBlue)
        .fill();

      let currentX = 36;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      colDef.forEach(col => {
        doc.text(col.label, currentX + 3, tableTop + 6, { width: col.width - 6, align: col.align });
        currentX += col.width;
      });

      // Table Rows
      let rowY = tableTop + 20;
      const items = quotation.items && quotation.items.length > 0 ? quotation.items : [
        { description: 'Facility Rental & Program Hall', unit: 'Days', quantity: 1, unitPrice: 25000, total: 25000 }
      ];

      items.forEach((item, index) => {
        const isAlt = index % 2 === 1;
        const rowHeight = 20;

        if (isAlt) {
          doc
            .rect(36, rowY, contentWidth, rowHeight)
            .fillColor(rowBgAlt)
            .fill();
        }

        // Draw row border bottom
        doc
          .moveTo(36, rowY + rowHeight)
          .lineTo(pageWidth - 36, rowY + rowHeight)
          .strokeColor(tableBorder)
          .lineWidth(0.5)
          .stroke();

        let cellX = 36;
        doc.fontSize(7.5).font('Helvetica').fillColor(slateDark);

        // #
        doc.text((index + 1).toString(), cellX + 3, rowY + 6, { width: colDef[0].width - 6, align: colDef[0].align });
        cellX += colDef[0].width;

        // Description
        doc.text(item.description || '', cellX + 3, rowY + 6, { width: colDef[1].width - 6, align: colDef[1].align, ellipsis: true });
        cellX += colDef[1].width;

        // Unit
        doc.text(item.unit || 'Nos', cellX + 3, rowY + 6, { width: colDef[2].width - 6, align: colDef[2].align });
        cellX += colDef[2].width;

        // Qty
        doc.text((item.quantity || 1).toString(), cellX + 3, rowY + 6, { width: colDef[3].width - 6, align: colDef[3].align });
        cellX += colDef[3].width;

        // Unit Price
        const priceStr = Number(item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        doc.text(priceStr, cellX + 3, rowY + 6, { width: colDef[4].width - 6, align: colDef[4].align });
        cellX += colDef[4].width;

        // Total
        const totalStr = Number(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        doc.font('Helvetica-Bold').text(totalStr, cellX + 3, rowY + 6, { width: colDef[5].width - 6, align: colDef[5].align });

        rowY += rowHeight;
      });

      // ==========================================
      // SUMMARY / TOTALS SECTION
      // ==========================================
      const totalsTop = rowY + 8;
      const totalsBoxWidth = 220;
      const totalsBoxX = pageWidth - 36 - totalsBoxWidth;

      doc
        .rect(totalsBoxX, totalsTop, totalsBoxWidth, 80)
        .strokeColor(tableBorder)
        .lineWidth(1)
        .stroke();

      const formatCurrency = (val) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Subtotal
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(slateMuted)
        .text('Subtotal:', totalsBoxX + 10, totalsTop + 8)
        .font('Helvetica')
        .fillColor(slateDark)
        .text(`Rs. ${formatCurrency(quotation.subtotal)}`, totalsBoxX + 100, totalsTop + 8, { width: totalsBoxWidth - 110, align: 'right' });

      // Discount (if any)
      doc
        .font('Helvetica')
        .fillColor(slateMuted)
        .text('Discount:', totalsBoxX + 10, totalsTop + 22)
        .fillColor(secondaryRed)
        .text(`- Rs. ${formatCurrency(quotation.totalDiscount)}`, totalsBoxX + 100, totalsTop + 22, { width: totalsBoxWidth - 110, align: 'right' });

      // Tax (if any)
      doc
        .font('Helvetica')
        .fillColor(slateMuted)
        .text('Taxes & Charges:', totalsBoxX + 10, totalsTop + 36)
        .fillColor(slateDark)
        .text(`Rs. ${formatCurrency(quotation.taxAmount)}`, totalsBoxX + 100, totalsTop + 36, { width: totalsBoxWidth - 110, align: 'right' });

      // Grand Total Bar
      doc
        .rect(totalsBoxX, totalsTop + 52, totalsBoxWidth, 28)
        .fillColor(primaryBlue)
        .fill();

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('GRAND TOTAL:', totalsBoxX + 10, totalsTop + 60)
        .text(`Rs. ${formatCurrency(quotation.grandTotal)}`, totalsBoxX + 80, totalsTop + 60, { width: totalsBoxWidth - 90, align: 'right' });

      // Left of totals: Notes / Adjustment Highlights
      const notesWidth = contentWidth - totalsBoxWidth - 16;
      doc
        .rect(36, totalsTop, notesWidth, 80)
        .strokeColor(tableBorder)
        .lineWidth(1)
        .stroke();

      doc
        .rect(36, totalsTop, notesWidth, 16)
        .fillColor('#f8fafc')
        .fill();

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor(slateDark)
        .text('REVISION & ADJUSTMENT NOTES', 42, totalsTop + 4);

      if (quotation.version > 1 && quotation.originalQuotationSnapshot) {
        const origTotal = quotation.originalQuotationSnapshot.grandTotal || 0;
        const diff = (quotation.grandTotal || 0) - origTotal;
        const diffText = diff < 0 ? `Reduced by Rs. ${formatCurrency(Math.abs(diff))}` : (diff > 0 ? `Increased by Rs. ${formatCurrency(diff)}` : 'Adjusted scope at equal value');
        
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(slateDark)
          .text(`• Original Quoted Total: Rs. ${formatCurrency(origTotal)}`, 42, totalsTop + 22)
          .text(`• Adjustment Impact: ${diffText}`, 42, totalsTop + 34)
          .text(`• Total Revisions Logged: ${quotation.adjustments?.length || 1}`, 42, totalsTop + 46)
          .text(`• Status: Customer negotiation reflected in current revision`, 42, totalsTop + 58);
      } else {
        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor(slateDark)
          .text(quotation.notes || 'This is the original quotation submitted. Any customer-requested adjustments will be documented in subsequent revisions.', 42, totalsTop + 22, { width: notesWidth - 12, height: 50 });
      }

      // ==========================================
      // AUTHORIZATION & VERIFICATION SECTION
      // ==========================================
      const authTop = totalsTop + 92;

      // Box 1: Terms and Conditions
      const termsWidth = (contentWidth - 16) * 0.58;
      const authBoxWidth = contentWidth - termsWidth - 16;

      doc
        .rect(36, authTop, termsWidth, 88)
        .strokeColor(tableBorder)
        .lineWidth(1)
        .stroke();

      doc
        .rect(36, authTop, termsWidth, 16)
        .fillColor('#f8fafc')
        .fill();

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor(slateDark)
        .text('TERMS, CONDITIONS & PAYMENT', 42, authTop + 4);

      const termsText = quotation.termsAndConditions || 
        '1. Quotation validity: 30 days from date of issue.\n2. Confirmation requires 50% advance payment.\n3. Make cheques payable to "Subodhi Institute of Integral Education".\n4. Please send payment slip with Quotation No. reference.';

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(slateMuted)
        .text(termsText, 42, authTop + 22, { width: termsWidth - 12, height: 60 });

      // Box 2: Official Admin Authorization Sign-off
      const authBoxX = 36 + termsWidth + 16;
      doc
        .rect(authBoxX, authTop, authBoxWidth, 88)
        .strokeColor(quotation.approval?.isApproved ? '#22c55e' : tableBorder)
        .lineWidth(quotation.approval?.isApproved ? 1.5 : 1)
        .stroke();

      doc
        .rect(authBoxX, authTop, authBoxWidth, 16)
        .fillColor(quotation.approval?.isApproved ? '#dcfce7' : '#f8fafc')
        .fill();

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor(quotation.approval?.isApproved ? '#15803d' : slateDark)
        .text('ADMIN AUTHORIZATION', authBoxX + 8, authTop + 4);

      if (quotation.approval?.isApproved) {
        const approvedDate = quotation.approval.approvedAt ? new Date(quotation.approval.approvedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#15803d')
          .text('VERIFIED & AUTHORIZED', authBoxX + 8, authTop + 24)
          .fontSize(7)
          .font('Helvetica')
          .fillColor(slateDark)
          .text(`Authorized By: ${quotation.approval.approvedBy || 'Institute Admin'}`, authBoxX + 8, authTop + 38)
          .text(`Date: ${approvedDate}`, authBoxX + 8, authTop + 49)
          .text('Official Seal: Verified & Signed', authBoxX + 8, authTop + 60)
          .font('Helvetica-Oblique')
          .fillColor(slateMuted)
          .text('Authorized for client transmission', authBoxX + 8, authTop + 72);
      } else {
        doc
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .fillColor(secondaryRed)
          .text('INTERNAL REVIEW / PENDING', authBoxX + 8, authTop + 26)
          .fontSize(7)
          .font('Helvetica')
          .fillColor(slateMuted)
          .text('Awaiting official sign-off by Admin', authBoxX + 8, authTop + 42)
          .text('Must be authorized before final client acceptance.', authBoxX + 8, authTop + 54, { width: authBoxWidth - 16 });
      }

      // ==========================================
      // FOOTER
      // ==========================================
      const footerY = 780;
      doc
        .moveTo(36, footerY)
        .lineTo(pageWidth - 36, footerY)
        .strokeColor(tableBorder)
        .lineWidth(0.5)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(slateMuted)
        .text('Subodhi Institute of Integral Education • Wewala, Piliyandala • Phone: 011-2614317 / 011-2613705', 36, footerY + 6, { align: 'center', width: contentWidth })
        .text('This quotation was electronically generated by Subodhi Quotation Lifecycle Management System.', 36, footerY + 16, { align: 'center', width: contentWidth });

      doc.end();

      dataStream.on('finish', () => resolve(true));
      dataStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

