// server/routes/parse-cv.js
import express from 'express';
import multer from 'multer';
import { ProfileSchema } from '../lib/schema.js';
import { callGeminiParseCV } from '../lib/ai.js';
const router = express.Router();

// Configure multer for file uploads (8MB max)
const upload = multer({
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// POST /api/parse-cv
router.post('/', upload.single('cvFile'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Missing cvFile' });
    }

    // TODO: run PDF text extraction (PyMuPDF service or Node binding)
    // For now, simulate with mock CV text for testing
    const mockCvText = `
      CV Document
      Name: Test User
      Nationality: Sample Country
      Education: Bachelor's Degree in Computer Science
      GPA: 3.5
      Languages: English, Spanish
      Certifications: AWS Certified
    `;
    
    // Extract profile using Gemini AI with strict validation
    const extractedData = await callGeminiParseCV(mockCvText);
    
    // Separate profile data from metadata
    const { _metadata, ...profile } = extractedData;
    
    // Final validation with Zod schema
    const validatedProfile = ProfileSchema.parse(profile);
    
    // Return profile with quality information
    res.status(200).json({
      profile: validatedProfile,
      quality: _metadata.quality,
      extractedAt: _metadata.extractedAt,
      warnings: _metadata.hallucinations.length > 0 ? 
        _metadata.hallucinations.map(h => `${h.field}: ${h.reason}`) : []
    });
  } catch (error) {
    console.error('Parse CV error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid profile data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;