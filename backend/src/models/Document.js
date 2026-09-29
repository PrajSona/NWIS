const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String, default: 'application/pdf' },
  docType: {
    type: String,
    enum: ['well_completion_report', 'drilling_report', 'mud_report', 'geological_report', 'incident_report', 'other'],
    default: 'well_completion_report',
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  processingError: { type: String },
  totalPages: { type: Number },
  extractedEvents: { type: Number, default: 0 },
  isSynthetic: { type: Boolean, default: false },
  dataSource: { type: String, default: 'User Upload' },
  uploadedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Document', documentSchema);
