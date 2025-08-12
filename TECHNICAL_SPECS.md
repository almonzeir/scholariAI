# 📋 Technical Implementation Specifications

## 🎯 Implementation Roadmap

### Phase 4A: Core UI Components (Week 1-2)
- **File Upload Component** with drag-and-drop
- **Processing Animation** with progress indicators
- **Scholarship Card** component with filtering
- **Mobile Navigation** and responsive layouts

### Phase 4B: Backend Services (Week 3-4)
- **CV Parser Service** (Python + Docker)
- **API Gateway** setup (Supabase/Firebase)
- **Gemini Integration** service
- **Ephemeral Storage** implementation

### Phase 4C: Integration & Testing (Week 5)
- **End-to-end testing**
- **Performance optimization**
- **Security audit**
- **Mobile testing**

---

## 🔧 Technology Stack Details

### Frontend Stack
```json
{
  "framework": "React 18 + Vite",
  "styling": "Tailwind CSS + Framer Motion",
  "stateManagement": "React Query + Zustand",
  "routing": "React Router v6",
  "forms": "React Hook Form + Zod",
  "fileHandling": "React Dropzone",
  "animations": "Framer Motion + Lottie",
  "icons": "Lucide React",
  "fonts": "Poppins (Google Fonts)"
}
```

### Backend Stack
```json
{
  "apiGateway": "Supabase Edge Functions",
  "cvParser": "Python 3.11 + FastAPI",
  "aiService": "Google Gemini Pro API",
  "storage": "Redis (ephemeral)",
  "fileStorage": "Supabase Storage (temp)",
  "monitoring": "Sentry + Supabase Analytics",
  "deployment": "Docker + Cloud Run"
}
```

---

## 📱 Component Architecture

### 1. Upload Flow Components
```typescript
// Components to build
<FileUploadZone />
<CVPreview />
<ProcessingSpinner />
<ErrorBoundary />
<ProgressIndicator />
```

### 2. Results Display Components
```typescript
// Components to build
<ScholarshipGrid />
<ScholarshipCard />
<FilterSidebar />
<SearchBar />
<SortDropdown />
<PaginationControls />
```

### 3. Shared UI Components
```typescript
// Already have foundation, need enhancement
<Button /> // ✅ Exists, needs variants
<Modal /> // 🔄 Need to create
<Toast /> // 🔄 Need to create
<Skeleton /> // 🔄 Need to create
<Badge /> // 🔄 Need to create
```

---

## 🔌 API Implementation Details

### CV Parser Service (Python)
```python
# Key libraries
from fastapi import FastAPI, UploadFile
from pdfplumber import PDF
from pydantic import BaseModel
import spacy  # For NLP extraction
import redis  # For ephemeral storage

# Core functionality
def extract_profile(pdf_file) -> ProfileSchema:
    # Extract text, parse sections, structure data
    pass

def store_temporarily(profile, ttl=300):
    # Store in Redis with 5-minute TTL
    pass
```

### Scholarship Finder (Node.js)
```javascript
// Key dependencies
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Core functionality
const findScholarships = async (profile, filters) => {
  const prompt = buildGeminiPrompt(profile, filters);
  const response = await gemini.generateContent(prompt);
  return formatScholarships(response);
};
```

---

## 🎨 Design System Specifications

### Color Palette (Dark Mode Focus)
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Indigo Accent */
  --indigo-400: #818cf8;
  --indigo-500: #6366f1;
  --indigo-600: #4f46e5;
  
  /* Dark Theme */
  --gray-900: #111827;
  --gray-800: #1f2937;
  --gray-700: #374151;
  --gray-300: #d1d5db;
}
```

### Typography Scale
```css
/* Poppins Font Hierarchy */
.text-hero { font-size: 3.5rem; font-weight: 800; }
.text-h1 { font-size: 2.5rem; font-weight: 700; }
.text-h2 { font-size: 2rem; font-weight: 600; }
.text-h3 { font-size: 1.5rem; font-weight: 600; }
.text-body { font-size: 1rem; font-weight: 400; }
.text-small { font-size: 0.875rem; font-weight: 400; }
```

### Component Variants
```css
/* Button Variants */
.btn-primary { /* Indigo gradient */ }
.btn-secondary { /* Transparent with border */ }
.btn-ghost { /* Text only */ }
.btn-danger { /* Red for errors */ }

/* Card Variants */
.card-default { /* White background */ }
.card-dark { /* Dark background */ }
.card-scholarship { /* Special styling */ }
.card-interactive { /* Hover effects */ }
```

---

## 🔒 Security Implementation

### Frontend Security
```typescript
// Input validation with Zod
const CVUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.type === 'application/pdf')
    .refine(file => file.size <= 10 * 1024 * 1024), // 10MB limit
});

// Sanitization
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input);
};
```

### Backend Security
```python
# Rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/api/parse-cv")
@limiter.limit("5/minute")
async def parse_cv(file: UploadFile):
    # Validate file type, size, content
    pass
```

---

## 📊 Performance Optimization

### Frontend Optimization
```typescript
// Code splitting
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

// Image optimization
const optimizedImages = {
  scholarship: '/images/scholarship-bg.webp',
  placeholder: '/images/placeholder.svg'
};

// Caching strategy
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Backend Optimization
```python
# Async processing
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def process_cv_async(file_content):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        result = await loop.run_in_executor(
            executor, extract_text_from_pdf, file_content
        )
    return result
```

---

## 🧪 Testing Strategy

### Frontend Testing
```typescript
// Unit tests with Vitest
import { render, screen } from '@testing-library/react';
import { ScholarshipCard } from './ScholarshipCard';

test('renders scholarship card with correct data', () => {
  const mockScholarship = {
    title: 'Test Scholarship',
    amount: '$5000',
    deadline: '2024-12-31'
  };
  
  render(<ScholarshipCard scholarship={mockScholarship} />);
  expect(screen.getByText('Test Scholarship')).toBeInTheDocument();
});
```

### Backend Testing
```python
# API tests with pytest
import pytest
from fastapi.testclient import TestClient

def test_parse_cv_endpoint():
    with open('test_cv.pdf', 'rb') as f:
        response = client.post(
            '/api/parse-cv',
            files={'cvFile': f}
        )
    assert response.status_code == 200
    assert 'profile' in response.json()
```

---

## 🚀 Deployment Configuration

### Docker Configuration
```dockerfile
# CV Parser Service
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
```bash
# Production environment
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
REDIS_URL=your_redis_url
SENTRY_DSN=your_sentry_dsn
```

---

## ✅ Ready for Implementation

This technical specification provides the complete blueprint for implementing our approved Phase 3 architecture. All components, APIs, security measures, and deployment strategies are clearly defined and ready for development.

**Next Step**: Begin Phase 4 implementation with the core UI components.