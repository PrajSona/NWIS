const mongoose = require('mongoose');

const telemetryRecordSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true, index: true },
  depth: { type: Number },
  torque: { type: Number },         // Nm
  rpm: { type: Number },
  pumpPressure: { type: Number },   // psi
  mudWeight: { type: Number },      // PPG
  rop: { type: Number },            // m/hr
  wob: { type: Number },            // Weight on bit (kN)
  flowRate: { type: Number },       // L/min
  state: {
    type: String,
    enum: ['NORMAL', 'WARNING', 'RISK'],
    default: 'NORMAL',
  },
  recordedAt: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('TelemetryRecord', telemetryRecordSchema);
