const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true, index: true },
  formationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formation', index: true },
  incidentType: { type: String, required: true, index: true },
  depth: { type: Number, index: true },          // meters
  description: { type: String },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  // Drilling parameters at time of incident
  mudWeight: { type: Number },      // PPG
  torque: { type: Number },         // Nm
  pumpPressure: { type: Number },   // psi
  rpm: { type: Number },
  rop: { type: Number },            // m/hr
  mitigation: { type: String },
  lessonLearned: { type: String },
  sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  sourcePage: { type: Number },
  incidentDate: { type: Date },
  isSynthetic: { type: Boolean, default: true },
  dataSource: { type: String, default: 'Synthetic Demo Dataset' },
}, {
  timestamps: true,
});

// Text index for search functionality
incidentSchema.index({
  incidentType: 'text',
  description: 'text',
  mitigation: 'text',
  lessonLearned: 'text',
});

module.exports = mongoose.model('Incident', incidentSchema);
