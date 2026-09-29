const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const DocumentPage = require('../models/DocumentPage');
const Incident = require('../models/Incident');

// Configure multer for PDF uploads
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No PDF file uploaded' });
    }

    const doc = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      docType: req.body.docType || 'well_completion_report',
      processingStatus: 'pending',
      isSynthetic: false,
      dataSource: 'Legacy Data — User Upload',
    });

    // Try to process with Python service if available
    const pythonUrl = process.env.PYTHON_SERVICE_URL;
    if (pythonUrl) {
      try {
        doc.processingStatus = 'processing';
        await doc.save();

        // Forward to Python service for processing
        const response = await fetch(`${pythonUrl}/api/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: req.file.path,
            documentId: doc._id.toString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Save extracted pages
          if (result.pages) {
            for (const page of result.pages) {
              await DocumentPage.create({
                documentId: doc._id,
                pageNumber: page.pageNumber,
                extractedText: page.text,
                ocrText: page.ocrText || null,
              });
            }
            doc.totalPages = result.pages.length;
          }

          // Save extracted incidents
          if (result.extractedEvents) {
            for (const event of result.extractedEvents) {
              await Incident.create({
                wellId: event.wellId || null,
                formationId: event.formationId || null,
                incidentType: event.incidentType || 'Other',
                depth: event.depth,
                description: event.description,
                severity: event.severity || 'medium',
                mudWeight: event.mudWeight,
                torque: event.torque,
                pumpPressure: event.pumpPressure,
                sourceDocumentId: doc._id,
                sourcePage: event.sourcePage,
                isSynthetic: false,
                dataSource: `Extracted from ${req.file.originalname}`,
              });
            }
            doc.extractedEvents = result.extractedEvents.length;
          }

          doc.processingStatus = 'completed';
          doc.processedAt = new Date();
          await doc.save();
        } else {
          doc.processingStatus = 'failed';
          doc.processingError = 'Python processing service returned an error';
          await doc.save();
        }
      } catch (pyErr) {
        console.warn('[Documents] Python service unavailable:', pyErr.message);
        doc.processingStatus = 'pending';
        doc.processingError = 'Python processing service unavailable — document saved for later processing';
        await doc.save();
      }
    } else {
      // No Python service — store as legacy data for AI risk analysis
      doc.processingStatus = 'completed';
      doc.processedAt = new Date();
      doc.totalPages = 1;
      await doc.save();
      console.log(`[Documents] Legacy data stored: ${req.file.originalname}`);
    }

    res.status(201).json({
      document: doc,
      message: doc.processingStatus === 'completed'
        ? 'Legacy document uploaded and stored successfully. It will be used for future AI risk analysis.'
        : 'Document uploaded and saved as legacy data. Status: ' + (doc.processingError || 'processing'),
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find().sort({ uploadedAt: -1 }).lean();
    res.json({ documents: docs, count: docs.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: true, message: 'Document not found' });

    const pages = await DocumentPage.find({ documentId: doc._id })
      .sort({ pageNumber: 1 })
      .lean();

    // Get incidents extracted from this document
    const incidents = await Incident.find({ sourceDocumentId: doc._id })
      .populate('wellId', 'wellName')
      .populate('formationId', 'name')
      .lean();

    res.json({ document: doc, pages, incidents });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/documents/:id/file — Serve the actual PDF
router.get('/:id/file', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: true, message: 'Document not found' });

    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: true, message: 'File not found on disk' });
    }

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
