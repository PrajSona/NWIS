const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nwis';

let isConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    // Log connection info without leaking credentials
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[MongoDB] Connected to ${safeUri}`);
  } catch (err) {
    isConnected = false;
    console.error('[MongoDB] Connection failed:', err.message);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[MongoDB] Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[MongoDB] Reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Error:', err.message);
  });
}

function getConnectionStatus() {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

module.exports = { connectDB, getConnectionStatus };
