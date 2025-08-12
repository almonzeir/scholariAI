# Phase 5 Implementation Guide

## Overview

Phase 5 introduces a robust data model and API infrastructure for AI-powered CV parsing and scholarship matching. This implementation follows a design-first approach optimized for Gemini AI integration.

## 🏗️ Architecture

### Data Model
- **Canonical Types**: Strict, UI-friendly TypeScript interfaces
- **Runtime Validation**: Zod schemas for type safety
- **API Contracts**: OpenAPI 3.0 specification
- **AI Integration**: Gemini-optimized prompts and responses

### Key Components

```
src/
├── types/shared.ts          # Core TypeScript interfaces
├── lib/schema.ts            # Zod validation schemas
├── services/aiService.js    # Client-side API service
└── pages/Phase5Demo.jsx     # Demo implementation

server/
├── routes/parse-cv.js       # CV parsing endpoint
├── routes/match.js          # Scholarship matching endpoint
└── lib/ai.js               # Gemini AI integration

openapi.yaml                 # API documentation
```

## 📋 Data Structures

### Profile Interface
```typescript
interface Profile {
  name?: string | null;
  nationality: string | null;
  degreeTarget: DegreeTarget | null;  // "Bachelor" | "Master" | "PhD"
  field: string | null;
  gpa?: string | null;
  certifications?: string[];          // ["PMP", "IELTS 7.0"]
  specialStatus?: string | null;      // "refugee", "low-income"
  languages?: string[];
}
```

### Scholarship Interface
```typescript
interface Scholarship {
  id: string;
  name: string;
  country: string;
  degree: DegreeTarget | "Any";
  eligibility: string;                // ≤ 180 chars
  deadline: string;                   // "YYYY-MM-DD" or "varies"
  link: string;                       // direct official URL
  source: string;                     // domain, e.g., "daad.de"
  fitScore: number;                   // 0..1
}
```

## 🔌 API Endpoints

### POST /api/parse-cv
**Purpose**: Extract structured profile data from PDF CV

**Request**:
```bash
curl -X POST http://localhost:5000/api/parse-cv \
  -F "cvFile=@resume.pdf"
```

**Response**:
```json
{
  "name": "John Doe",
  "nationality": "United States",
  "degreeTarget": "Master",
  "field": "Computer Science",
  "gpa": "3.8",
  "certifications": ["AWS Certified", "TOEFL 110"],
  "specialStatus": null,
  "languages": ["English", "Spanish"]
}
```

### POST /api/match
**Purpose**: Find and rank scholarships for a profile

**Request**:
```bash
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "nationality": "India",
      "degreeTarget": "Master",
      "field": "Engineering"
    },
    "filters": {
      "country": "Germany",
      "deadlineDaysMax": 90
    }
  }'
```

**Response**:
```json
[
  {
    "id": "daad-masters-2024",
    "name": "DAAD Masters Scholarship",
    "country": "Germany",
    "degree": "Master",
    "eligibility": "International students, Bachelor's degree, German language proficiency",
    "deadline": "2024-10-31",
    "link": "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    "source": "daad.de",
    "fitScore": 0.92
  }
]
```

## 🤖 AI Integration

### Gemini Prompts

#### CV Parsing Prompt
```
You are a JSON-only API. From this CV text, return:
{
  "name": string|null,
  "nationality": string|null,
  "degreeTarget": "Bachelor"|"Master"|"PhD"|null,
  "field": string|null,
  "gpa": string|null,
  "certifications": string[],
  "specialStatus": string|null,
  "languages": string[]
}

Rules:
- Return ONLY valid JSON, no markdown or explanations
- Use null for missing/unclear data
- degreeTarget: infer from context (current degree + career goals)
- field: normalize to broad categories
- Extract certifications, test scores, licenses
- Detect special status (refugee, low-income, etc.)
```

#### Scholarship Ranking Prompt
```
You are a scholarship matching expert. Rank these scholarships for the given profile.

Ranking criteria:
- Degree match (exact > Any)
- Field relevance
- Nationality/location eligibility
- GPA requirements
- Special status advantages
- Language requirements
- Deadline proximity

Return ONLY valid JSON array, sorted by fitScore descending.
```

## 🛠️ Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:5000/api
```

### 2. Dependencies
Install required packages:
```bash
npm install zod @google/generative-ai multer
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access Demo
Visit: `http://localhost:3000/phase5-demo`

## 🧪 Testing

### Client-Side Service
```javascript
import { parseCVFile, matchScholarships, createMockProfile } from '../services/aiService';

// Test CV parsing
const profile = await parseCVFile(pdfFile);

// Test scholarship matching
const scholarships = await matchScholarships(profile, {
  country: 'Germany',
  degree: 'Master'
});

// Use mock data for development
const mockProfile = createMockProfile();
const mockScholarships = createMockScholarships();
```

### API Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Test with mock data
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{"profile": {"nationality": "India", "degreeTarget": "Master"}}'
```

## 📊 Data Validation

### Zod Schemas
- **ProfileSchema**: Validates user profile data
- **ScholarshipSchema**: Validates scholarship objects
- **Runtime Safety**: Catches invalid data before processing
- **Type Inference**: Automatic TypeScript types from schemas

### Validation Examples
```javascript
import { ProfileSchema, ScholarshipSchema } from '../lib/schema';

// Validate profile
const safeProfile = ProfileSchema.parse(userInput);

// Validate scholarship array
const safeScholarships = scholarships.map(s => ScholarshipSchema.parse(s));
```

## 🚀 Next Steps (Phase 6 & 7)

### Phase 6: PDF Processing
- Implement actual PDF text extraction
- Wire up Gemini CV parsing
- Add error handling for malformed PDFs

### Phase 7: Vector Search
- Replace mock data with real scholarship database
- Implement vector similarity search
- Add caching and performance optimization

## 📖 API Documentation

Full OpenAPI specification available at: `openapi.yaml`

For interactive documentation, consider adding Swagger UI:
```bash
npm install swagger-ui-express
```

## 🔧 Troubleshooting

### Common Issues

1. **Zod validation errors**: Check data structure matches schema
2. **CORS issues**: Verify frontend URL in server CORS config
3. **File upload limits**: Ensure multer limits match frontend validation
4. **Gemini API errors**: Verify API key and quota limits

### Debug Mode
Enable detailed logging:
```javascript
// In server/lib/ai.js
console.log('Gemini request:', prompt);
console.log('Gemini response:', response);
```

## 📈 Performance Considerations

- **File Size Limits**: 8MB max for PDF uploads
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Caching**: Consider Redis for frequent profile lookups
- **Async Processing**: Long-running AI calls should be queued

---

**Phase 5 Status**: ✅ Complete
- Data model and validation implemented
- API endpoints created and documented
- Gemini integration framework ready
- Demo UI showcasing full workflow
- Ready for Phase 6 PDF processing integration