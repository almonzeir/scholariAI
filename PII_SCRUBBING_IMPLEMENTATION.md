# PII Scrubbing Implementation

## Overview

This document describes the implementation of the PII (Personally Identifiable Information) Scrubbing system, which removes sensitive personal data from profile objects before saving them to ensure privacy compliance and data protection.

## System Architecture

### Core Components

1. **AI-Powered PII Detection & Scrubbing Engine** (`server/lib/piiScrub.js`)
2. **RESTful API Endpoints** (`server/routes/pii-scrub.js`)
3. **Client-Side Service** (`src/services/piiScrubService.js`)
4. **Interactive Demo Interface** (`src/pages/PIIScrubDemo.jsx`)
5. **OpenAPI Documentation** (`openapi.yaml`)

## Data Flow

```
Profile with PII → AI Detection → PII Scrubbing → Clean Profile
                ↓
            PII Report
```

### Input Format
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  "degreeTarget": "Bachelor",
  "targetField": "Computer Science",
  "experience": "Worked at Tech Corp (contact: john.doe@techcorp.com)"
}
```

### Output Format
```json
{
  "original": { /* original profile */ },
  "scrubbed": {
    "degreeTarget": "Bachelor",
    "targetField": "Computer Science",
    "experience": "Worked at Tech Corp (contact: [EMAIL_REMOVED])"
  },
  "piiDetection": {
    "hasPII": true,
    "hasName": true,
    "hasEmail": true,
    "hasPhone": true,
    "details": ["Name field detected", "Email found in experience: 1 occurrence(s)"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## PII Detection Categories

### 1. Name Fields
- `name`
- `fullName`
- `firstName`
- `lastName`

### 2. Contact Information
- **Email Addresses**: Detected using regex pattern `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b`
- **Phone Numbers**: Multiple formats supported:
  - `(555) 123-4567`
  - `555-123-4567`
  - `555.123.4567`
  - `+1-555-123-4567`

### 3. Embedded PII
- PII found within text fields (experience, education, projects, etc.)
- Detected and replaced with placeholder text

## API Endpoints

### 1. Single Profile Scrubbing
```http
POST /api/pii-scrub/scrub
Content-Type: application/json

{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "experience": "Contact me at john.work@company.com"
  }
}
```

**Response:**
```json
{
  "original": { /* original profile */ },
  "scrubbed": { /* scrubbed profile */ },
  "piiDetection": { /* detection results */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. PII Detection Only
```http
POST /api/pii-scrub/detect
Content-Type: application/json

{
  "profile": { /* profile to analyze */ }
}
```

**Response:**
```json
{
  "profile": { /* original profile */ },
  "piiDetection": {
    "hasPII": true,
    "hasName": true,
    "hasEmail": true,
    "hasPhone": false,
    "details": ["Name field detected", "Email found in experience"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Batch Processing
```http
POST /api/pii-scrub/batch
Content-Type: application/json

{
  "profiles": [
    { /* profile 1 */ },
    { /* profile 2 */ }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "original": { /* profile 1 original */ },
      "scrubbed": { /* profile 1 scrubbed */ },
      "piiDetection": { /* detection results */ },
      "success": true
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. API Testing
```http
GET /api/pii-scrub/test
```

Runs predefined test cases and returns results with success/failure status.

## Implementation Details

### AI Integration

The system uses Google's Gemini AI with a specialized system prompt:

```
Given a profile JSON, return the same object but remove "name" and any emails/phone numbers embedded in other fields. Output JSON only.
```

**User Prompt Format:**
```
PROFILE: {{json_profile}}
```

### Dual-Layer Protection

1. **AI-Powered Scrubbing**: Primary method using Gemini for intelligent PII detection
2. **Manual Regex Scrubbing**: Fallback method using pattern matching

### Error Handling

- **AI Failures**: Graceful fallback to manual scrubbing
- **Input Validation**: Ensures profile objects are valid
- **Batch Limits**: Maximum 50 profiles per batch request
- **JSON Parsing**: Robust parsing with cleanup of markdown formatting

### Security Features

- **Data Sanitization**: Complete removal of PII from responses
- **No Data Persistence**: PII is not stored or logged
- **Rate Limiting**: Applied to all endpoints
- **CORS Protection**: Configured for secure cross-origin requests

## Client-Side Integration

### Service Functions

```javascript
import { 
  scrubProfilePII,
  detectProfilePII,
  batchScrubProfilePII,
  testPIIScrubbing 
} from '../services/piiScrubService';

// Single profile scrubbing
const result = await scrubProfilePII(profile);

// PII detection only
const detection = await detectProfilePII(profile);

// Batch processing
const batchResults = await batchScrubProfilePII(profiles);

// API testing
const testResults = await testPIIScrubbing();
```

### Utility Functions

- `hasPII(piiDetection)` - Check if PII was detected
- `getPIISummary(piiDetection)` - Get human-readable PII summary
- `formatPIIScrubResults(original, scrubbed, piiDetection)` - Format results for display
- `createMockProfileWithPII()` - Generate test data with PII
- `createMockProfilesBatch(count)` - Generate multiple test profiles

## Demo Interface

The PII scrubbing demo (`/pii-scrub-demo`) provides:

### Features

1. **Single Profile Tab**
   - Interactive form for testing individual profiles
   - Option to detect PII only or scrub completely
   - Visual comparison of original vs. scrubbed profiles
   - Detailed PII detection report

2. **Batch Processing Tab**
   - Process multiple profiles simultaneously
   - Batch processing statistics
   - Individual profile results display
   - Success/failure tracking

3. **API Test Tab**
   - Comprehensive API testing
   - Predefined test cases
   - Success/failure reporting
   - Performance metrics

### UI Components

- **Tabbed Interface**: Clean navigation between different modes
- **JSON Editor**: Syntax-highlighted profile input
- **Comparison View**: Side-by-side original vs. scrubbed profiles
- **PII Detection Report**: Detailed breakdown of detected PII
- **Batch Results**: Summary statistics and individual results
- **Error Handling**: User-friendly error messages
- **Loading States**: Progress indicators during processing

## Privacy Compliance

### GDPR Compliance

- **Right to Erasure**: Complete PII removal capability
- **Data Minimization**: Only necessary data is retained
- **Purpose Limitation**: PII scrubbing serves specific privacy protection purpose
- **Transparency**: Clear reporting of what PII was detected and removed

### CCPA Compliance

- **Consumer Rights**: Users can request PII removal before data storage
- **Data Categories**: Clear identification of personal information categories
- **Opt-Out Mechanism**: Users can choose to scrub PII before saving

## Testing Strategy

### Test Cases

The system includes comprehensive test cases covering:

1. **Name Detection**
   - Direct name fields
   - Embedded names in text
   - Various name formats

2. **Email Detection**
   - Standard email formats
   - Embedded emails in descriptions
   - Multiple emails per field

3. **Phone Detection**
   - Various phone number formats
   - International numbers
   - Embedded phone numbers

4. **Complex Scenarios**
   - Multiple PII types in single field
   - Nested object structures
   - Array fields with PII

### Quality Assurance

- **Input Validation**: Ensures proper data types and structure
- **Output Validation**: Verifies complete PII removal
- **AI Fallback Testing**: Tests manual scrubbing when AI fails
- **Performance Testing**: Batch processing efficiency
- **Security Testing**: Ensures no PII leakage

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5002
NODE_ENV=development
```

### Server Configuration

- **Port**: 5002 (configurable via environment)
- **CORS**: Enabled for development
- **Rate Limiting**: Applied to all endpoints
- **Security**: Helmet middleware for security headers
- **Logging**: PII-safe logging (no sensitive data logged)

## Usage Examples

### Basic Usage

```javascript
// Scrub PII from a profile
const profile = {
  name: "John Doe",
  email: "john@example.com",
  experience: "Contact me at john.work@company.com"
};

const result = await scrubProfilePII(profile);
console.log(result.scrubbed);
// Output: {
//   experience: "Contact me at [EMAIL_REMOVED]"
// }
```

### Detection Only

```javascript
// Detect PII without scrubbing
const detection = await detectProfilePII(profile);
console.log(detection.piiDetection);
// Output: {
//   hasPII: true,
//   hasName: true,
//   hasEmail: true,
//   hasPhone: false,
//   details: ["Name field detected", "Email found in experience"]
// }
```

### Integration with Profile Saving

```javascript
// Optional PII scrubbing before saving
async function saveProfile(profile, scrubPII = false) {
  let finalProfile = profile;
  
  if (scrubPII) {
    const scrubResult = await scrubProfilePII(profile);
    finalProfile = scrubResult.scrubbed;
    
    // Log PII detection for audit purposes
    console.log('PII detected and removed:', scrubResult.piiDetection);
  }
  
  // Save the (potentially scrubbed) profile
  return await saveToDatabase(finalProfile);
}
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Reduces API calls for multiple profiles
2. **Fallback Mechanism**: Fast regex-based scrubbing when AI fails
3. **Caching**: Consider implementing cache for common PII patterns
4. **Rate Limiting**: Prevents API abuse and ensures fair usage

### Scalability

- **Stateless Design**: Supports horizontal scaling
- **Load Balancing**: Can be deployed behind load balancer
- **Database Independence**: No persistent storage requirements
- **Memory Efficient**: Processes profiles individually to minimize memory usage

## Future Enhancements

### Planned Features

1. **Custom PII Patterns**: Support for organization-specific PII detection
2. **Confidence Scores**: AI confidence ratings for PII detection
3. **Audit Logging**: Comprehensive logging of PII scrubbing activities
4. **Selective Scrubbing**: Choose which PII types to remove
5. **Data Masking**: Alternative to removal (e.g., "John D." instead of removal)

### Integration Opportunities

1. **CV Parsing Pipeline**: Automatic PII scrubbing during CV processing
2. **User Consent Management**: Integration with consent management systems
3. **Data Export**: PII-scrubbed data export functionality
4. **Analytics Dashboard**: PII detection statistics and trends

## Troubleshooting

### Common Issues

1. **AI API Failures**: Gemini API errors
   - Solution: Check API key and network connectivity
   - Fallback: Manual regex scrubbing is automatically used

2. **False Positives**: Over-aggressive PII detection
   - Solution: Refine regex patterns or AI prompts
   - Workaround: Use detection-only mode to review before scrubbing

3. **Performance Issues**: Slow processing for large profiles
   - Solution: Use batch processing for multiple profiles
   - Optimization: Consider implementing caching

4. **JSON Parsing Errors**: Malformed profile objects
   - Solution: Implement stricter input validation
   - Prevention: Use TypeScript interfaces for type safety

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=pii-scrub:*
```

## Security Considerations

### Data Protection

- **No Persistence**: PII is never stored or logged
- **Memory Cleanup**: Sensitive data is cleared from memory after processing
- **Secure Transmission**: HTTPS required for production
- **Access Control**: API endpoints can be protected with authentication

### Compliance Monitoring

- **Audit Trail**: Track when PII scrubbing is performed
- **Data Lineage**: Maintain record of data transformations
- **Regular Testing**: Automated tests ensure PII removal effectiveness
- **Compliance Reporting**: Generate reports for regulatory compliance

## Conclusion

The PII Scrubbing system provides a comprehensive, AI-powered solution for removing personally identifiable information from profile data. With dual-layer protection, comprehensive API coverage, and an intuitive demo interface, it ensures privacy compliance while maintaining data utility.

The system's modular design allows for easy integration with existing workflows while providing flexibility for future enhancements and customizations. By combining AI intelligence with robust fallback mechanisms, it delivers reliable PII protection for sensitive user data.