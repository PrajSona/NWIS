/**
 * NWIS — Express Server + Socket.IO
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { connectDB, getConnectionStatus } = require('./db');
const TelemetrySimulator = require('./telemetry/simulator');
const { RiskEngine } = require('./risk-engine/engine');

// Import routes
const wellRoutes = require('./routes/wells');
const incidentRoutes = require('./routes/incidents');
const formationRoutes = require('./routes/formations');
const documentRoutes = require('./routes/documents');
const correlationRoutes = require('./routes/correlation');
const healthRoutes = require('./routes/health');
const telemetryRoutes = require('./routes/telemetry');
const alertRoutes = require('./routes/alerts');

const app = express();
const server = http.createServer(app);

// ── CORS ORIGINS (dynamic for production) ──────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
// Add the deployed frontend URL (e.g., https://nwis.vercel.app)
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Allow Vercel frontend to embed PDFs in iframes
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'self'", ...allowedOrigins],
    },
  },
}));
app.use(cors({
  origin: allowedOrigins,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded documents
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ── TELEMETRY SIMULATOR ────────────────────────────────────
const telemetrySim = new TelemetrySimulator(io, {
  startDepth: 2980,
  targetDepth: 3500,
  tickRate: 2000,
  riskZones: [
    { depth: 3040, range: 60, type: 'Stuck Pipe', formation: 'Barail' },
    { depth: 3080, range: 40, type: 'Mud Loss', formation: 'Barail' },
  ],
  onRiskAlert: async (alertData) => {
    try {
      const Well = require('./models/Well');
      const activeWell = await Well.findOne({ status: 'active' });
      if (activeWell) {
        // Evaluate risk with the engine
        const assessment = await RiskEngine.evaluateRisk({
          wellId: activeWell._id,
          currentDepth: alertData.depth,
          currentTelemetry: alertData.telemetry,
          radius: 5000,
        });

        // Save alert to database
        const RiskAlertModel = require('./models/RiskAlert');
        await RiskAlertModel.create({
          wellId: activeWell._id,
          alertType: `Potential ${alertData.type} Risk`,
          riskLevel: assessment.riskLevel,
          depth: alertData.depth,
          formation: alertData.formation,
          description: assessment.description,
          reasoning: {
            reasons: assessment.reasons,
            correlations: assessment.correlatedIncidents?.slice(0, 5),
          },
          correlatedIncidents: assessment.correlatedIncidents?.slice(0, 5)?.map(c => ({
            incidentId: c.incident._id,
            type: c.incident.incidentType,
            depth: c.incident.depth,
            wellName: c.well.wellName,
            relevanceScore: c.relevance.totalScore,
          })),
          correlatedWells: assessment.correlatedWells?.slice(0, 5)?.map(w => ({
            wellId: w._id,
            wellName: w.wellName,
            distance: w.distance,
          })),
          telemetrySnapshot: alertData.telemetry,
        });

        // Emit enriched alert
        io.emit('risk:alert', {
          ...alertData,
          assessment,
        });
      }
    } catch (err) {
      console.error('[Risk] Error during alert processing:', err.message);
    }
  },
});

// Make simulator accessible to routes
app.set('telemetrySim', telemetrySim);
app.set('io', io);

// ── ROUTES ─────────────────────────────────────────────────
app.use('/api/wells', wellRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/correlation', correlationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);

// ── SOCKET.IO ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send current simulator status on connect
  socket.emit('telemetry:status', telemetrySim.getStatus());

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── ERROR HANDLING ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err.message);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Not found' });
});

// ── START ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n[NWIS] Backend running on http://localhost:${PORT}`);
      console.log(`[NWIS] Socket.IO ready`);
      console.log(`[NWIS] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[NWIS] Uploads: ${uploadsDir}`);
      console.log('');
    });
  } catch (err) {
    console.error('[NWIS] Failed to start:', err.message);
    console.error('[NWIS] Is MongoDB running on', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nwis', '?');
    process.exit(1);
  }
}

start();
