import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Quotation } from '../models/quotationModel.js';
import { parseQuotationExcel, generateQuotationExcelTemplate } from '../services/excelService.js';
import { generateQuotationPDF } from '../services/pdfService.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Helper to generate a sequential or unique quotation number
async function generateNextQuoteNumber() {
  const currentYear = new Date().getFullYear();
  const count = await Quotation.countDocuments();
  const nextNum = String(count + 1).padStart(4, '0');
  return `QT-${currentYear}-${nextNum}`;
}

// ==========================================
// 1. GET ALL QUOTATIONS & STATS
// ==========================================
router.get('/', async (req, res) => {
  try {
    const { status, isConverted, search } = req.query;
    let quotations = await Quotation.find({});

    if (status && status !== 'ALL') {
      quotations = quotations.filter(q => q.status === status);
    }

    if (isConverted !== undefined && isConverted !== 'ALL') {
      const boolVal = isConverted === 'true';
      quotations = quotations.filter(q => q.conversion?.isConverted === boolVal);
    }

    if (search) {
      const q = search.toLowerCase();
      quotations = quotations.filter(item => 
        (item.quotationNumber && item.quotationNumber.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.client?.name && item.client.name.toLowerCase().includes(q)) ||
        (item.client?.organization && item.client.organization.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    console.error('Error fetching quotations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. ANALYTICS & DASHBOARD METRICS
// ==========================================
router.get('/stats/analytics', async (req, res) => {
  try {
    const list = await Quotation.find({});

    const totalQuotes = list.length;
    const totalQuotedValue = list.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

    const convertedList = list.filter(q => q.status === 'CONVERTED' || q.conversion?.isConverted === true);
    const wonCount = convertedList.length;
    const wonRevenue = convertedList.reduce((sum, q) => sum + (Number(q.conversion?.convertedValue || q.grandTotal) || 0), 0);

    const lostList = list.filter(q => q.status === 'LOST');
    const lostCount = lostList.length;
    const lostValue = lostList.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

    const pendingApprovalCount = list.filter(q => q.status === 'PENDING_APPROVAL').length;
    const approvedCount = list.filter(q => q.status === 'APPROVED' || q.status === 'SENT_TO_CUSTOMER').length;
    const adjustedCount = list.filter(q => q.version > 1 || q.status === 'ADJUSTMENT_REQUESTED').length;

    // Conversion rate based on closed quotes (won + lost)
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : (totalQuotes > 0 ? Math.round((wonCount / totalQuotes) * 100) : 0);

    // Adjustment impact
    let totalOriginalValueOfAdjusted = 0;
    let totalNewValueOfAdjusted = 0;
    list.filter(q => q.version > 1 && q.originalQuotationSnapshot).forEach(q => {
      totalOriginalValueOfAdjusted += Number(q.originalQuotationSnapshot.grandTotal || 0);
      totalNewValueOfAdjusted += Number(q.grandTotal || 0);
    });
    const totalAdjustmentVariance = totalNewValueOfAdjusted - totalOriginalValueOfAdjusted;

    res.json({
      success: true,
      data: {
        totalQuotes,
        totalQuotedValue,
        wonCount,
        wonRevenue,
        lostCount,
        lostValue,
        conversionRate,
        pendingApprovalCount,
        approvedCount,
        adjustedCount,
        totalOriginalValueOfAdjusted,
        totalNewValueOfAdjusted,
        totalAdjustmentVariance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. GET SAMPLE EXCEL TEMPLATE
// ==========================================
router.get('/sample-excel', (req, res) => {
  try {
    const buffer = generateQuotationExcelTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Subodhi_Quotation_Template.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. GET SINGLE QUOTATION
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quotation.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.json({ success: true, data: quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. CREATE NEW QUOTATION (MANUAL)
// ==========================================
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const quotationNumber = body.quotationNumber || await generateNextQuoteNumber();

    const items = (body.items || []).map((it, idx) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const disc = Number(it.discountPercent) || 0;
      const tax = Number(it.taxPercent) || 0;
      const base = qty * price;
      const discVal = (base * disc) / 100;
      const taxVal = ((base - discVal) * tax) / 100;
      const total = Number(it.total) || Math.round((base - discVal + taxVal) * 100) / 100;

      return {
        itemCode: it.itemCode || `ITM-${idx + 1}`,
        description: it.description || 'Item description',
        unit: it.unit || 'Nos',
        quantity: qty,
        unitPrice: price,
        discountPercent: disc,
        taxPercent: tax,
        total
      };
    });

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    const totalDiscount = items.reduce((sum, it) => sum + ((it.quantity * it.unitPrice * (it.discountPercent || 0)) / 100), 0);
    const taxAmount = items.reduce((sum, it) => {
      const discounted = (it.quantity * it.unitPrice) - ((it.quantity * it.unitPrice * (it.discountPercent || 0)) / 100);
      return sum + ((discounted * (it.taxPercent || 0)) / 100);
    }, 0);
    const grandTotal = Math.round((subtotal - totalDiscount + taxAmount) * 100) / 100;

    const initialDate = body.date ? new Date(body.date) : new Date();
    let validUntil = body.validUntil ? new Date(body.validUntil) : new Date(initialDate);
    if (!body.validUntil) {
      validUntil.setDate(validUntil.getDate() + 30);
    }

    const newQuotationData = {
      quotationNumber,
      title: body.title || 'Official Quotation',
      client: {
        name: body.client?.name || 'Customer Name',
        organization: body.client?.organization || '',
        email: body.client?.email || '',
        phone: body.client?.phone || '',
        address: body.client?.address || ''
      },
      createdBy: {
        name: body.createdBy?.name || 'Sales Staff',
        role: body.createdBy?.role || 'employee',
        email: body.createdBy?.email || 'staff@subodhi.org'
      },
      date: initialDate,
      validUntil,
      currency: body.currency || 'LKR',
      items,
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      termsAndConditions: body.termsAndConditions || '1. Valid for 30 days.\n2. 50% advance confirmation.\n3. Balance on event completion.',
      notes: body.notes || '',
      status: body.status || 'PENDING_APPROVAL',
      source: 'manual',
      version: 1,
      // Record initial state snapshot
      originalQuotationSnapshot: {
        items,
        subtotal,
        totalDiscount,
        taxAmount,
        grandTotal,
        date: initialDate
      },
      adjustments: []
    };

    const created = await Quotation.create(newQuotationData);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Error creating quotation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. UPLOAD EXCEL FILE & CONVERT TO QUOTATION
// ==========================================
router.post('/upload-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No Excel file provided' });
    }

    const parsed = parseQuotationExcel(req.file.buffer);
    const quotationNumber = await generateNextQuoteNumber();

    const newQuotationData = {
      ...parsed,
      quotationNumber,
      source: 'excel_import',
      excelFileName: req.file.originalname,
      status: 'PENDING_APPROVAL',
      version: 1,
      originalQuotationSnapshot: {
        items: parsed.items,
        subtotal: parsed.subtotal,
        totalDiscount: parsed.totalDiscount,
        taxAmount: parsed.taxAmount,
        grandTotal: parsed.grandTotal,
        date: parsed.date
      },
      adjustments: []
    };

    const created = await Quotation.create(newQuotationData);
    res.status(201).json({
      success: true,
      message: 'Excel quotation imported successfully and prepared for Admin Authorization',
      data: created,
      pdfDownloadUrl: `/api/quotations/${created._id || created.id}/pdf`
    });
  } catch (err) {
    console.error('Error parsing excel upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. ADMIN AUTHORIZATION & REJECTION
// ==========================================
router.post('/:id/authorize', async (req, res) => {
  try {
    const { adminName, adminNotes } = req.body;
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const updateData = {
      status: 'APPROVED',
      approval: {
        isApproved: true,
        approvedBy: adminName || 'Rev. Fr. Director',
        approvedAt: new Date(),
        adminNotes: adminNotes || 'Authorized and approved for client delivery.',
        rejectionReason: '',
        rejectedAt: null
      }
    };

    const updated = await Quotation.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, message: 'Quotation authorized by Admin!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { adminName, reason } = req.body;
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const updateData = {
      status: 'REJECTED',
      approval: {
        isApproved: false,
        approvedBy: adminName || 'Admin',
        rejectedAt: new Date(),
        rejectionReason: reason || 'Revision required by admin before sending to customer.'
      }
    };

    const updated = await Quotation.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, message: 'Quotation marked as revision required / rejected', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 8. SEND TO CUSTOMER / RESUBMIT
// ==========================================
router.post('/:id/send-to-customer', async (req, res) => {
  try {
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    // Must be approved before sending to customer!
    if (!existing.approval?.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Authorization Required: The quotation must be authorized by an Admin before sending it to the customer.'
      });
    }

    const updated = await Quotation.findByIdAndUpdate(req.params.id, { status: 'SENT_TO_CUSTOMER' }, { new: true });
    res.json({ success: true, message: 'Quotation marked as sent to customer', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/submit-for-approval', async (req, res) => {
  try {
    const updated = await Quotation.findByIdAndUpdate(req.params.id, {
      status: 'PENDING_APPROVAL',
      'approval.isApproved': false,
      'approval.rejectionReason': ''
    }, { new: true });

    res.json({ success: true, message: 'Submitted for Admin approval', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 9. RECORD ADJUSTMENTS WITH ORIGINAL TRACKING
// ==========================================
router.post('/:id/adjust', async (req, res) => {
  try {
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    const { items, reason, adjustedBy, notes, requireReApproval } = req.body;

    const newItems = (items || []).map((it, idx) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const disc = Number(it.discountPercent) || 0;
      const tax = Number(it.taxPercent) || 0;
      const base = qty * price;
      const discVal = (base * disc) / 100;
      const taxVal = ((base - discVal) * tax) / 100;
      const total = Number(it.total) || Math.round((base - discVal + taxVal) * 100) / 100;

      return {
        itemCode: it.itemCode || `ITM-${idx + 1}`,
        description: it.description || 'Item description',
        unit: it.unit || 'Nos',
        quantity: qty,
        unitPrice: price,
        discountPercent: disc,
        taxPercent: tax,
        total
      };
    });

    const newSubtotal = newItems.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    const newTotalDiscount = newItems.reduce((sum, it) => sum + ((it.quantity * it.unitPrice * (it.discountPercent || 0)) / 100), 0);
    const newTaxAmount = newItems.reduce((sum, it) => {
      const discounted = (it.quantity * it.unitPrice) - ((it.quantity * it.unitPrice * (it.discountPercent || 0)) / 100);
      return sum + ((discounted * (it.taxPercent || 0)) / 100);
    }, 0);
    const newGrandTotal = Math.round((newSubtotal - newTotalDiscount + newTaxAmount) * 100) / 100;

    const previousGrandTotal = Number(existing.grandTotal || 0);
    const difference = newGrandTotal - previousGrandTotal;

    const newVersion = (existing.version || 1) + 1;

    const adjustmentRecord = {
      version: newVersion,
      adjustedAt: new Date(),
      adjustedBy: adjustedBy || 'Sales Executive',
      reason: reason || 'Customer requested modifications / discounts',
      previousGrandTotal,
      newGrandTotal,
      difference,
      changesSummary: `Revision #${newVersion}: Grand Total changed from Rs. ${previousGrandTotal.toLocaleString()} to Rs. ${newGrandTotal.toLocaleString()} (${difference >= 0 ? '+' : ''}${difference.toLocaleString()})`,
      previousItems: existing.items,
      newItems
    };

    const adjustmentsList = Array.isArray(existing.adjustments) ? [...existing.adjustments, adjustmentRecord] : [adjustmentRecord];

    // Preserve original snapshot if not already set
    const originalSnapshot = existing.originalQuotationSnapshot || {
      items: existing.items,
      subtotal: existing.subtotal,
      totalDiscount: existing.totalDiscount,
      taxAmount: existing.taxAmount,
      grandTotal: existing.grandTotal,
      date: existing.date
    };

    const updatePayload = {
      items: newItems,
      subtotal: newSubtotal,
      totalDiscount: newTotalDiscount,
      taxAmount: newTaxAmount,
      grandTotal: newGrandTotal,
      version: newVersion,
      notes: notes !== undefined ? notes : existing.notes,
      originalQuotationSnapshot: originalSnapshot,
      adjustments: adjustmentsList,
      // If adjustment requires re-authorization before client resend:
      status: requireReApproval ? 'PENDING_APPROVAL' : 'ADJUSTMENT_REQUESTED',
      ...(requireReApproval ? {
        'approval.isApproved': false,
        'approval.adminNotes': 'Pending re-authorization following customer adjustments'
      } : {})
    };

    const updated = await Quotation.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    res.json({
      success: true,
      message: `Adjustment logged successfully! Created Revision v${newVersion}.`,
      data: updated
    });
  } catch (err) {
    console.error('Error adjusting quotation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 10. BUSINESS CONVERSION TRACKER (WON / LOST)
// ==========================================
router.post('/:id/conversion', async (req, res) => {
  try {
    const { isConverted, finalValue, clientFeedback, lostReason } = req.body;
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    let updateData = {};

    if (isConverted) {
      updateData = {
        status: 'CONVERTED',
        conversion: {
          isConverted: true,
          convertedAt: new Date(),
          convertedValue: Number(finalValue) || Number(existing.grandTotal),
          clientFeedback: clientFeedback || 'Customer accepted quotation and finalized business agreement.',
          lostReason: '',
          lostAt: null
        }
      };
    } else {
      updateData = {
        status: 'LOST',
        conversion: {
          isConverted: false,
          convertedAt: null,
          convertedValue: 0,
          clientFeedback: clientFeedback || '',
          lostReason: lostReason || 'Customer did not proceed (price/budget or schedule mismatch)',
          lostAt: new Date()
        }
      };
    }

    const updated = await Quotation.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({
      success: true,
      message: isConverted ? '🎉 Congratulations! Marked as Converted into Business!' : 'Marked as Lost / Not Converted',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 11. GENERATE & STREAM STYLED PDF
// ==========================================
router.get('/:id/pdf', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quotation.quotationNumber || 'Quotation'}.pdf"`);

    await generateQuotationPDF(quotation, res);
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// ==========================================
// 12. DELETE QUOTATION
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

