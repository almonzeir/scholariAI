# Degree & Field Canonicalization Implementation

## Overview

This document describes the implementation of the Degree & Field Canonicalization system, which normalizes free text degree and field inputs into a controlled vocabulary using UNESCO-ish taxonomy principles.

## System Architecture

### Core Components

1. **AI-Powered Canonicalization Engine** (`server/lib/canonicalization.js`)
2. **RESTful API Endpoints** (`server/routes/canonicalize.js`)
3. **Client-Side Service** (`src/services/canonicalizationService.js`)
4. **Interactive Demo Interface** (`src/pages/CanonicalizationDemo.jsx`)
5. **OpenAPI Documentation** (`openapi.yaml`)

## Data Model

### Input Format
```json
{
  "degreeTarget": "bachelor of science",
  "field": "computer science"
}
```

### Output Format
```json
{
  "degreeTarget": "Bachelor",
  "field": "Computer Science"
}
```

### Controlled Vocabulary

#### Degree Targets
- `"Bachelor"` - Undergraduate degree
- `"Master"` - Graduate degree
- `"PhD"` - Doctoral degree
- `null` - Unknown or invalid degree

#### Field Canonicalization
- Compact canonical labels (e.g., "Computer Science", "Electrical Engineering")
- Best match approach using AI understanding
- `null` for unrecognizable fields

## API Endpoints

### 1. Single Canonicalization
```http
POST /api/canonicalize/degree-field
Content-Type: application/json

{
  "degreeTarget": "bachelor of science",
  "field": "computer science"
}
```

**Response:**
```json
{
  "input": {
    "degreeTarget": "bachelor of science",
    "field": "computer science"
  },
  "output": {
    "degreeTarget": "Bachelor",
    "field": "Computer Science"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Batch Processing
```http
POST /api/canonicalize/batch
Content-Type: application/json

{
  "inputs": [
    { "degreeTarget": "masters", "field": "electrical eng" },
    { "degreeTarget": "doctorate", "field": "public health" }
  ]
}
```

**Response:**
```json
{
  "inputs": [...],
  "outputs": [
    { "degreeTarget": "Master", "field": "Electrical Engineering" },
    { "degreeTarget": "PhD", "field": "Public Health" }
  ],
  "count": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. API Testing
```http
GET /api/canonicalize/test
```

Runs predefined test cases and returns results with success/failure statistics.

## Implementation Details

### AI Integration

The system uses Google's Gemini AI with a specialized system prompt:

```
You normalize free text to a controlled vocabulary and output JSON only.

Map degree to: "Bachelor"|"Master"|"PhD"|null.

Map field to a compact canonical label (e.g., "Electrical Engineering", "Computer Science", "Public Health", "Development Studies"). Use best match; else null.
Return: { "degreeTarget": "...", "field": "..." }
```

### Error Handling

- **Input Validation**: Ensures both `degreeTarget` and `field` are strings
- **Batch Limits**: Maximum 50 items per batch request
- **AI Failures**: Graceful fallback to `null` values
- **JSON Parsing**: Robust parsing with cleanup of markdown formatting

### Security Features

- Rate limiting on API endpoints
- Input sanitization
- CORS protection
- Helmet security headers

## Client-Side Integration

### Service Functions

```javascript
import { 
  canonicalizeDegreeField,
  batchCanonicalizeDegreeField,
  testCanonicalization 
} from '../services/canonicalizationService';

// Single canonicalization
const result = await canonicalizeDegreeField('bachelor of science', 'computer science');

// Batch processing
const results = await batchCanonicalizeDegreeField([
  { degreeTarget: 'masters', field: 'electrical eng' },
  { degreeTarget: 'doctorate', field: 'public health' }
]);

// API testing
const testResults = await testCanonicalization();
```

### Utility Functions

- `isValidDegreeTarget(degree)` - Validates degree against controlled vocabulary
- `getValidDegreeTargets()` - Returns array of valid degree targets
- `formatCanonicalizationResult(input, output)` - Formats results for display
- `createMockCanonicalizationData()` - Generates test data

## Demo Interface

The canonicalization demo (`/canonicalization-demo`) provides:

### Features

1. **Single Input Tab**
   - Interactive form for testing individual inputs
   - Real-time canonicalization
   - Visual comparison of input vs. output
   - Change indicators

2. **Batch Processing Tab**
   - Processes multiple predefined test cases
   - Bulk canonicalization results
   - Change tracking and statistics

3. **API Test Tab**
   - Comprehensive API testing
   - Success/failure statistics
   - Error reporting
   - Performance metrics

### UI Components

- **Tabbed Interface**: Clean navigation between different modes
- **Input Forms**: User-friendly degree and field input
- **Results Display**: Color-coded output with change indicators
- **Error Handling**: User-friendly error messages
- **Loading States**: Progress indicators during processing

## Testing Strategy

### Test Cases

The system includes comprehensive test cases covering:

1. **Standard Formats**
   - "bachelor of science" → "Bachelor"
   - "masters" → "Master"
   - "doctorate" → "PhD"

2. **Abbreviations**
   - "BS" → "Bachelor"
   - "MS" → "Master"
   - "PhD" → "PhD"

3. **Alternative Terms**
   - "undergraduate" → "Bachelor"
   - "graduate" → "Master"

4. **Field Variations**
   - "computer science" → "Computer Science"
   - "electrical eng" → "Electrical Engineering"
   - "CS" → "Computer Science"

### Quality Assurance

- **Input Validation**: Ensures proper data types
- **Output Validation**: Verifies controlled vocabulary compliance
- **Error Recovery**: Handles AI failures gracefully
- **Performance Testing**: Batch processing efficiency

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5002
```

### Server Configuration

- **Port**: 5002 (configurable via environment)
- **CORS**: Enabled for development
- **Rate Limiting**: Applied to all endpoints
- **Security**: Helmet middleware for security headers

## Usage Examples

### Basic Usage

```javascript
// Canonicalize a single degree/field pair
const result = await canonicalizeDegreeField(
  'bachelor of science',
  'computer science'
);
console.log(result);
// Output: { degreeTarget: 'Bachelor', field: 'Computer Science' }
```

### Batch Processing

```javascript
// Process multiple inputs at once
const inputs = [
  { degreeTarget: 'masters', field: 'electrical eng' },
  { degreeTarget: 'phd', field: 'data science' }
];

const results = await batchCanonicalizeDegreeField(inputs);
console.log(results);
// Output: [
//   { degreeTarget: 'Master', field: 'Electrical Engineering' },
//   { degreeTarget: 'PhD', field: 'Data Science' }
// ]
```

### Integration with Profile Processing

```javascript
// Use in CV parsing pipeline
const profile = await parseCVFile(file);
if (profile.degreeTarget && profile.targetField) {
  const canonicalized = await canonicalizeDegreeField(
    profile.degreeTarget,
    profile.targetField
  );
  
  profile.degreeTarget = canonicalized.degreeTarget;
  profile.targetField = canonicalized.field;
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Reduces API calls for multiple items
2. **Caching**: Consider implementing Redis cache for common inputs
3. **Rate Limiting**: Prevents API abuse
4. **Error Handling**: Graceful degradation on AI failures

### Scalability

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Load Balancing**: Can be deployed behind load balancer
- **Database Integration**: Ready for caching layer implementation

## Future Enhancements

### Planned Features

1. **Caching Layer**: Redis-based caching for frequent inputs
2. **Analytics**: Track canonicalization patterns and accuracy
3. **Custom Vocabularies**: Support for institution-specific taxonomies
4. **Confidence Scores**: AI confidence ratings for canonicalizations
5. **Bulk Import**: CSV/Excel file processing capabilities

### Integration Opportunities

1. **CV Parsing Pipeline**: Automatic canonicalization during CV processing
2. **Scholarship Matching**: Enhanced matching with normalized fields
3. **User Profiles**: Standardized degree and field storage
4. **Analytics Dashboard**: Canonicalization statistics and trends

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Server fails to start
   - Solution: Change PORT in environment or server configuration

2. **AI API Failures**: Gemini API errors
   - Solution: Check API key and network connectivity

3. **Import Errors**: Module resolution issues
   - Solution: Verify file paths and extensions

4. **CORS Issues**: Client-server communication problems
   - Solution: Configure CORS settings in server

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=canonicalization:*
```

## Conclusion

The Degree & Field Canonicalization system provides a robust, AI-powered solution for normalizing educational data into standardized formats. With comprehensive API coverage, interactive testing capabilities, and production-ready architecture, it serves as a foundation for enhanced scholarship matching and profile management.

The system's modular design allows for easy integration with existing workflows while maintaining flexibility for future enhancements and customizations.