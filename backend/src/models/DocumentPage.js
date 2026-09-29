const mongoose = require('mongoose');

const documentPageSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  pageNumber: { type: Number, required: true },
  extractedText: { type: String },
  ocrText: { type: String },
  hasTables: { type: Boolean, default: false },
}, {
  timestamps: true,
});

documentPageSchema.index({ documentId: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('DocumentPage', documentPageSchema);
