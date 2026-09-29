const mongoose = require('mongoose');

const wellFormationSchema = new mongoose.Schema({
  wellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Well', required: true, index: true },
  formationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Formation', required: true, index: true },
  topDepth: { type: Number, required: true },    // meters
  bottomDepth: { type: Number, required: true },  // meters
  remarks: { type: String },
}, {
  timestamps: true,
});

wellFormationSchema.index({ wellId: 1, formationId: 1 }, { unique: true });

module.exports = mongoose.model('WellFormation', wellFormationSchema);
