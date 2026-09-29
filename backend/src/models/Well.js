const mongoose = require('mongoose');

const wellSchema = new mongoose.Schema({
  wellName: { type: String, required: true, index: true },
  wellType: {
    type: String,
    enum: ['exploration', 'development', 'appraisal', 'workover'],
    default: 'exploration',
  },
  operator: { type: String, default: 'Synthetic Operator' },
  status: {
    type: String,
    enum: ['active', 'historical', 'abandoned', 'suspended', 'completed'],
    default: 'historical',
    index: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [longitude, latitude] — auto-populated from lat/lng
  },
  totalDepth: { type: Number }, // meters
  currentDepth: { type: Number }, // meters (for active wells)
  spudDate: { type: Date },
  completionDate: { type: Date },
  fieldName: { type: String },
  isSynthetic: { type: Boolean, default: true },
  dataSource: { type: String, default: 'Synthetic Demo Dataset' },
}, {
  timestamps: true,
});

// 2dsphere index for geospatial queries
wellSchema.index({ location: '2dsphere' });

// Auto-populate location from lat/lng before validation
wellSchema.pre('validate', function (next) {
  if (this.latitude != null && this.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }
  next();
});

wellSchema.pre('insertMany', function (next, docs) {
  for (const doc of docs) {
    if (doc.latitude != null && doc.longitude != null) {
      doc.location = {
        type: 'Point',
        coordinates: [doc.longitude, doc.latitude],
      };
    }
  }
  next();
});

module.exports = mongoose.model('Well', wellSchema);
