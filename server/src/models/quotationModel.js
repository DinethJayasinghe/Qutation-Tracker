import mongoose from 'mongoose';
import fs from 'fs';
import { isConnected, DATA_FILE } from '../config/db.js';
import crypto from 'crypto';

// Sub-schema for Quotation Line Item
const lineItemSchema = new mongoose.Schema({
  itemCode: { type: String, default: '' },
  description: { type: String, required: true },
  unit: { type: String, default: 'Nos' },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  discountPercent: { type: Number, default: 0 },
  taxPercent: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 }
}, { _id: false });

// Sub-schema for Adjustment History
const adjustmentSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  adjustedAt: { type: Date, default: Date.now },
  adjustedBy: { type: String, default: 'Employee' },
  reason: { type: String, required: true },
  previousGrandTotal: { type: Number, required: true },
  newGrandTotal: { type: Number, required: true },
  difference: { type: Number, required: true },
  changesSummary: { type: String, default: '' },
  previousItems: [lineItemSchema],
  newItems: [lineItemSchema]
}, { _id: false });

const quotationMongooseSchema = new mongoose.Schema({
  quotationNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  client: {
    name: { type: String, required: true },
    organization: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  createdBy: {
    name: { type: String, default: 'Sales Executive' },
    role: { type: String, default: 'employee' },
    email: { type: String, default: 'staff@subodhi.org' }
  },
  date: { type: Date, default: Date.now },
  validUntil: { type: Date },
  currency: { type: String, default: 'LKR' },
  items: [lineItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  termsAndConditions: { type: String, default: '1. Quotation is valid for 30 days from date of issue.\n2. 50% advance confirmation required to secure reservation.\n3. Balance payment payable on or before event date.' },
  notes: { type: String, default: '' },
  
  // Status flow: DRAFT -> PENDING_APPROVAL -> APPROVED / REJECTED -> SENT_TO_CUSTOMER -> ADJUSTMENT_REQUESTED -> CONVERTED / LOST
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SENT_TO_CUSTOMER', 'ADJUSTMENT_REQUESTED', 'CONVERTED', 'LOST'],
    default: 'PENDING_APPROVAL'
  },
  
  // Admin authorization record
  approval: {
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    adminNotes: { type: String, default: '' },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' }
  },

  // Business conversion record
  conversion: {
    isConverted: { type: Boolean, default: false },
    convertedAt: { type: Date, default: null },
    convertedValue: { type: Number, default: 0 },
    clientFeedback: { type: String, default: '' },
    lostReason: { type: String, default: '' },
    lostAt: { type: Date, default: null }
  },

  source: {
    type: String,
    enum: ['manual', 'excel_import'],
    default: 'manual'
  },
  excelFileName: { type: String, default: null },

  // Snapshot of the original quotation before any customer adjustments
  originalQuotationSnapshot: {
    items: [lineItemSchema],
    subtotal: Number,
    totalDiscount: Number,
    taxAmount: Number,
    grandTotal: Number,
    date: Date
  },

  // Version counter and list of adjustments
  version: { type: Number, default: 1 },
  adjustments: [adjustmentSchema]
}, {
  timestamps: true
});

const QuotationMongooseModel = mongoose.model('Quotation', quotationMongooseSchema);

// JSON file-based database helper that mirrors Mongoose interface
class JSONQuotationStore {
  static readData() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
        return [];
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw || '[]');
    } catch (e) {
      console.error('Error reading JSON store:', e);
      return [];
    }
  }

  static writeData(data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing JSON store:', e);
    }
  }

  static async find(query = {}) {
    let list = this.readData();
    if (query.status) {
      list = list.filter(item => item.status === query.status);
    }
    if (query['conversion.isConverted'] !== undefined) {
      list = list.filter(item => item.conversion?.isConverted === query['conversion.isConverted']);
    }
    // Sort by createdAt descending
    return list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }

  static async findById(id) {
    const list = this.readData();
    return list.find(item => item._id === id || item.id === id) || null;
  }

  static async findOne(query = {}) {
    const list = this.readData();
    if (query.quotationNumber) {
      return list.find(item => item.quotationNumber === query.quotationNumber) || null;
    }
    return list[0] || null;
  }

  static async create(data) {
    const list = this.readData();
    const now = new Date();
    const doc = {
      _id: crypto.randomUUID(),
      ...data,
      version: data.version || 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    list.unshift(doc);
    this.writeData(list);
    return doc;
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const list = this.readData();
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.writeData(list);
    return updated;
  }

  static async findByIdAndDelete(id) {
    const list = this.readData();
    const filtered = list.filter(item => item._id !== id && item.id !== id);
    this.writeData(filtered);
    return { success: true };
  }

  static async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

// Proxy wrapper that delegates to Mongoose if connected, or JSONQuotationStore if not
export const Quotation = {
  find: (...args) => isConnected() ? QuotationMongooseModel.find(...args).sort({ createdAt: -1 }) : JSONQuotationStore.find(...args),
  findById: (...args) => isConnected() ? QuotationMongooseModel.findById(...args) : JSONQuotationStore.findById(...args),
  findOne: (...args) => isConnected() ? QuotationMongooseModel.findOne(...args) : JSONQuotationStore.findOne(...args),
  create: (...args) => isConnected() ? QuotationMongooseModel.create(...args) : JSONQuotationStore.create(...args),
  findByIdAndUpdate: (...args) => isConnected() ? QuotationMongooseModel.findByIdAndUpdate(...args) : JSONQuotationStore.findByIdAndUpdate(...args),
  findByIdAndDelete: (...args) => isConnected() ? QuotationMongooseModel.findByIdAndDelete(...args) : JSONQuotationStore.findByIdAndDelete(...args),
  countDocuments: (...args) => isConnected() ? QuotationMongooseModel.countDocuments(...args) : JSONQuotationStore.countDocuments(...args)
};

export default Quotation;

