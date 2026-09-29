const mongoose = require('mongoose');

const riskAlertSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true, index: true },
  alertType: { type: String, required: true },           // e.g., "Potential Stuck Pipe Risk"
  riskLevel: {
    type: String,
    enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    required: true,
    index: true,
  },
  depth: { type: Number },
  formation: { type: String },
  description: { type: String, required: true },
  reasoning: { type: mongoose.Schema.Types.Mixed },      // Structured explanation
  correlatedIncidents: [{ type: mongoose.Schema.Types.Mixed }],
  correlatedWells: [{ type: mongoose.Schema.Types.Mixed }],
  telemetrySnapshot: { type: mongoose.Schema.Types.Mixed },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
}, {
  timestamps: true,
});

riskAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RiskAlert', riskAlertSchema);
