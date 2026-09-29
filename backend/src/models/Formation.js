const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  typicalLithology: { type: String },
  ageGroup: { type: String }, // e.g., "Tertiary", "Cretaceous"
}, {
  timestamps: true,
});

module.exports = mongoose.model('Formation', formationSchema);
