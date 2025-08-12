// server/routes/match.js
import express from 'express';
import { ProfileSchema, ScholarshipSchema } from '../lib/schema.js';
import { callGeminiRank } from '../lib/ai.js';
const router = express.Router();

// POST /api/match
router.post('/', async (req, res) => {
  try {
    const { profile, filters } = req.body || {};
    
    if (!profile) {
      return res.status(400).json({ error: 'Missing profile data' });
    }

    // Validate profile with Zod schema
    const safeProfile = ProfileSchema.parse(profile);

    // TODO Phase 7: vector search Top-K from scraped index
    // const candidates = await searchVector(safeProfile, filters);

    // TEMP: call Gemini with a tiny seed list (to be replaced with candidates)
    const candidates = []; // ← fill in later
    const ranked = await callGeminiRank(safeProfile, candidates);

    // Validate & return
    const output = ranked.map((s) => ScholarshipSchema.parse(s));
    res.status(200).json(output);
  } catch (error) {
    console.error('Match error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;