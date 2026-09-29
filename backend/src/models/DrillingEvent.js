const mongoose = require('mongoose');

const drillingEventSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true, index: true },
  eventType: { type: String, required: true },
  depth: { type: Number },
  description: { type: String },
  eventDate: { type: Date },
  durationHours: { type: Number },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DrillingEvent', drillingEventSchema);
