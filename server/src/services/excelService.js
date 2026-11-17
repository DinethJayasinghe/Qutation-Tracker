import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

/**
 * Generate a beautifully formatted template workbook for employees to download and fill out
 */
export function generateQuotationExcelTemplate() {
  const wb = xlsx.utils.book_new();

  const data = [
    ['SUBODHI INSTITUTE OF INTEGRAL EDUCATION - QUOTATION TEMPLATE'],
    ['Wewala, Piliyandala, Sri Lanka | Phone: 011-2614317'],
    [''],
    ['QUOTATION DETAILS'],
    ['Quotation Title:', 'Leadership & Spiritual Formation Program 2026'],
    ['Quotation Number (Optional):', ''],
    ['Prepared By (Employee Name):', 'Kusal Perera'],
    ['Valid Until (Days or Date):', '30 Days'],
    ['Currency:', 'LKR'],
    [''],
    ['CLIENT INFORMATION'],
    ['Client / Contact Person:', 'Mr. Rohan Wickramasinghe'],
    ['Organization / Company:', 'Apex Youth Foundation'],
    ['Phone Number:', '+94 77 123 4567'],
    ['Email Address:', 'rohan@apexyouth.org'],
    ['Address:', 'No. 45, Galle Road, Colombo 03'],
    [''],
    ['LINE ITEMS'],
    ['Item Code', 'Description', 'Unit', 'Quantity', 'Unit Price (Rs.)', 'Discount %', 'Tax %', 'Total (Rs.)'],
    ['ITM-01', 'Main Auditorium & AC Hall (Full Day)', 'Days', 2, 35000, 0, 0, 70000],
    ['ITM-02', 'Full Board Accommodation (Deluxe Rooms)', 'Persons', 25, 4500, 5, 0, 106875],
    ['ITM-03', 'Buffet Meals & Morning/Evening Refreshments', 'Persons', 25, 2200, 0, 0, 55000],
    ['ITM-04', 'Multimedia Projector, PA System & Microphones', 'Sessions', 2, 7500, 0, 0, 15000],
    ['ITM-05', 'Resource Material Printing & Facilitator Packs', 'Sets', 25, 800, 0, 0, 20000],
    [''],
    ['NOTES & SPECIAL TERMS'],
    ['Notes:', 'Complimentary Wi-Fi and parking facilities provided for all participants.'],
    ['Terms & Conditions:', '1. 50% advance confirmation required.\n2. Balance to be settled on or before the program date.\n3. Cheques in favor of "Subodhi Institute of Integral Education".']
  ];

  const ws = xlsx.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 45 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 }
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Quotation');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Parse an uploaded quotation Excel spreadsheet
 */
export function parseQuotationExcel(bufferOrPath) {
  let wb;
  if (typeof bufferOrPath === 'string') {
    wb = xlsx.readFile(bufferOrPath);
  } else {
    wb = xlsx.read(bufferOrPath, { type: 'buffer' });
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let title = 'Quotation from Excel Import';
  let employeeName = 'Employee';
  let clientName = 'Customer';
  let clientOrg = '';
  let clientPhone = '';
  let clientEmail = '';
  let clientAddress = '';
  let validUntilStr = '';
  let notes = '';
  let terms = '1. Quotation valid for 30 days.\n2. 50% advance confirmation required.\n3. Balance upon completion.';
  let items = [];

  let lineItemsHeaderIndex = -1;

  // First pass: extract key-value fields
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const col0 = String(row[0] || '').trim().toLowerCase();
    const col1 = String(row[1] || '').trim();

    if (col0.includes('quotation title')) {
      title = col1 || title;
    } else if (col0.includes('prepared by') || col0.includes('employee')) {
      employeeName = col1 || employeeName;
    } else if (col0.includes('client / contact') || col0.includes('client name') || col0.includes('contact person')) {
      clientName = col1 || clientName;
    } else if (col0.includes('organization') || col0.includes('company')) {
      clientOrg = col1 || clientOrg;
    } else if (col0.includes('phone')) {
      clientPhone = col1 || clientPhone;
    } else if (col0.includes('email')) {
      clientEmail = col1 || clientEmail;
    } else if (col0.includes('address')) {
      clientAddress = col1 || clientAddress;
    } else if (col0.includes('valid until')) {
      validUntilStr = col1 || validUntilStr;
    } else if (col0.includes('notes')) {
      notes = col1 || notes;
    } else if (col0.includes('terms')) {
      terms = col1 || terms;
    }

    // Detect line items header row
    const rowStr = row.map(c => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('description') && (rowStr.includes('unit price') || rowStr.includes('price') || rowStr.includes('rate') || rowStr.includes('total') || rowStr.includes('qty'))) {
      lineItemsHeaderIndex = i;
    }
  }

  // Second pass: extract line items
  if (lineItemsHeaderIndex !== -1) {
    const headerRow = rows[lineItemsHeaderIndex].map(h => String(h || '').trim().toLowerCase());
    
    // Find column indexes
    const descIdx = headerRow.findIndex(h => h.includes('description') || h.includes('item'));
    const unitIdx = headerRow.findIndex(h => h === 'unit' || h.includes('uom'));
    const qtyIdx = headerRow.findIndex(h => h.includes('qty') || h.includes('quantity'));
    const priceIdx = headerRow.findIndex(h => h.includes('unit price') || h.includes('price') || h.includes('rate'));
    const discountIdx = headerRow.findIndex(h => h.includes('discount'));
    const taxIdx = headerRow.findIndex(h => h.includes('tax'));
    const totalIdx = headerRow.findIndex(h => h.includes('total') || h.includes('amount'));

    for (let i = lineItemsHeaderIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const desc = descIdx !== -1 ? String(row[descIdx] || '').trim() : '';
      if (!desc || desc.toLowerCase().includes('total') || desc.toLowerCase().includes('subtotal') || desc.toLowerCase().includes('notes')) {
        continue;
      }

      const unit = unitIdx !== -1 && row[unitIdx] ? String(row[unitIdx]).trim() : 'Nos';
      const quantity = qtyIdx !== -1 && !isNaN(Number(row[qtyIdx])) ? Number(row[qtyIdx]) : 1;
      const unitPrice = priceIdx !== -1 && !isNaN(Number(row[priceIdx])) ? Number(row[priceIdx]) : 0;
      const discountPercent = discountIdx !== -1 && !isNaN(Number(row[discountIdx])) ? Number(row[discountIdx]) : 0;
      const taxPercent = taxIdx !== -1 && !isNaN(Number(row[taxIdx])) ? Number(row[taxIdx]) : 0;

      let lineTotal = 0;
      if (totalIdx !== -1 && !isNaN(Number(row[totalIdx])) && Number(row[totalIdx]) > 0) {
        lineTotal = Number(row[totalIdx]);
      } else {
        const rawTotal = quantity * unitPrice;
        const discountVal = (rawTotal * discountPercent) / 100;
        const taxVal = ((rawTotal - discountVal) * taxPercent) / 100;
        lineTotal = Math.round((rawTotal - discountVal + taxVal) * 100) / 100;
      }

      items.push({
        itemCode: `ITM-${items.length + 1}`,
        description: desc,
        unit,
        quantity,
        unitPrice,
        discountPercent,
        taxPercent,
        total: lineTotal
      });
    }
  }

  // If no items were detected by header row, try row-based fallback
  if (items.length === 0) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 4 && typeof row[1] === 'string' && row[1].length > 3 && !isNaN(Number(row[2])) && !isNaN(Number(row[3]))) {
        const desc = String(row[1]).trim();
        const qty = Number(row[2]) || 1;
        const price = Number(row[3]) || 0;
        const total = qty * price;
        items.push({
          itemCode: `ITM-${items.length + 1}`,
          description: desc,
          unit: 'Nos',
          quantity: qty,
          unitPrice: price,
          discountPercent: 0,
          taxPercent: 0,
          total
        });
      }
    }
  }

  // Default fallback if sheet was empty or unparseable
  if (items.length === 0) {
    items.push({
      itemCode: 'ITM-01',
      description: 'Program Facilities & Resource Facilitation',
      unit: 'Day',
      quantity: 1,
      unitPrice: 50000,
      discountPercent: 0,
      taxPercent: 0,
      total: 50000
    });
  }

  // Calculations
  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  const totalDiscount = items.reduce((acc, curr) => acc + ((curr.quantity * curr.unitPrice * (curr.discountPercent || 0)) / 100), 0);
  const taxAmount = items.reduce((acc, curr) => {
    const discounted = (curr.quantity * curr.unitPrice) - ((curr.quantity * curr.unitPrice * (curr.discountPercent || 0)) / 100);
    return acc + ((discounted * (curr.taxPercent || 0)) / 100);
  }, 0);
  const grandTotal = Math.round((subtotal - totalDiscount + taxAmount) * 100) / 100;

  // Validity calculation
  let validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    title,
    client: {
      name: clientName,
      organization: clientOrg,
      phone: clientPhone,
      email: clientEmail,
      address: clientAddress
    },
    createdBy: {
      name: employeeName,
      role: 'employee',
      email: `${employeeName.toLowerCase().replace(/\s+/g, '.')}@subodhi.org`
    },
    date: new Date(),
    validUntil,
    items,
    subtotal,
    totalDiscount,
    taxAmount,
    grandTotal,
    notes,
    termsAndConditions: terms,
    source: 'excel_import'
  };
}

