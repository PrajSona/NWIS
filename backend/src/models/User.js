const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  role: {
    type: String,
    enum: ['engineer', 'geologist', 'supervisor', 'admin'],
    default: 'engineer',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
