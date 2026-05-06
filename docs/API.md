# API Documentation

Complete API reference for PaperThought backend.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <token>
```

## Response Format

All responses follow this format:

**Success (200-201):**
```json
{
  "success": true,
  "data": {...},
  "message": "Success message"
}
```

**Error (400, 401, 404, 500):**
```json
{
  "success": false,
  "error": "Error description"
}
```

## Endpoints

### Authentication

#### Register
```
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "token": "jwt-token"
  }
}
```

#### Login
```
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "jwt-token"
  }
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "institution": "University Name"
  }
}
```

### Papers

#### Upload Paper
```
POST /papers/upload
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "My Research Paper",
  "content": "Full paper content here..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "paper-uuid",
    "title": "My Research Paper",
    "paragraphCount": 5
  }
}
```

#### Get All Papers
```
GET /papers
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Paper Title",
      "status": "draft",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Get Paper Details
```
GET /papers/:paperId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Paper Title",
    "originalContent": "...",
    "status": "analyzing",
    "currentVersionId": "version-uuid"
  }
}
```

#### Analyze Paper
```
POST /papers/:paperId/analyze
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paperId": "uuid",
    "overallScore": "7.2",
    "paragraphsAnalyzed": 5
  }
}
```

#### Get Paragraphs
```
GET /papers/:paperId/paragraphs
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "para-uuid",
      "versionId": "version-uuid",
      "paragraphOrder": 1,
      "originalText": "...",
      "citationScore": 7.5,
      "coherenceScore": 8.0,
      "alignmentScore": 7.2,
      "researchGapScore": 6.8,
      "status": "needs_revision"
    }
  ]
}
```

#### Get Analysis Results
```
GET /papers/:paperId/analysis
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "result-uuid",
      "paragraphId": "para-uuid",
      "issueType": "missing_citation",
      "severity": "major",
      "description": "This claim needs a citation",
      "suggestedAction": "Add a reference to support this point"
    }
  ]
}
```

### Paragraphs

#### Revise Paragraph
```
POST /paragraphs/:paragraphId/revise
Authorization: Bearer <token>
```

**Body:**
```json
{
  "revised_text": "Improved paragraph content..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "para-uuid",
    "revised_text": "..."
  }
}
```

#### Approve Paragraph
```
POST /paragraphs/:paragraphId/approve
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "para-uuid",
    "status": "approved"
  }
}
```

#### Re-analyze Paragraph
```
POST /paragraphs/:paragraphId/reanalyze
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "analyzing"
  }
}
```

### References

#### Upload Reference
```
POST /references/upload
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Reference Paper Title",
  "authors": ["Author One", "Author Two"],
  "year": 2023,
  "content": "Extracted or pasted content..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ref-uuid",
    "title": "Reference Paper Title"
  }
}
```

#### Get References
```
GET /references
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ref-uuid",
      "title": "Paper Title",
      "authors": ["Author One"],
      "year": 2023
    }
  ]
}
```

#### Get Reference Findings
```
GET /references/:referenceId/findings
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "finding-uuid",
      "findingType": "theory",
      "content": "Key finding or theory...",
      "pageNumber": 5
    }
  ]
}
```

#### Delete Reference
```
DELETE /references/:referenceId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ref-uuid"
  }
}
```

### Suggestions

#### Get Suggestions
```
GET /paragraphs/:paragraphId/suggestions
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "suggestion-uuid",
      "paragraphId": "para-uuid",
      "findingId": "finding-uuid",
      "relevanceScore": 8.5,
      "explanation": "This theory supports your argument about..."
    }
  ]
}
```

#### Accept Suggestion
```
POST /suggestions/:suggestionId/accept
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "accepted"
  }
}
```

#### Reject Suggestion
```
POST /suggestions/:suggestionId/reject
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "rejected"
  }
}
```

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid input or missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 500 | Server Error | Internal server error |

## Rate Limiting

API rate limits (subject to change):
- **Standard tier**: 100 requests/minute
- **Premium tier**: 1000 requests/minute

Limits are applied per user, per endpoint.

## Pagination (Future)

When implemented, use query parameters:
```
GET /papers?page=1&limit=10&sort=createdAt&order=DESC
```

## Webhooks (Future)

Subscribe to paper events:
- `paper.analyzed` - When analysis completes
- `paper.revised` - When revision is submitted
- `suggestion.created` - When new suggestion available

## Testing

### Using curl

```bash
# Register and get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}' \
  | jq -r '.data.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile
```

### Using Postman

1. Create new environment with variables:
   - `base_url`: `http://localhost:3001`
   - `token`: (From login response)

2. Use `{{base_url}}` and `{{token}}` in requests

3. Set Authorization header: `Bearer {{token}}`

## Support

For API issues or questions:
- Check [Development Guide](DEVELOPMENT.md)
- Open an issue on GitHub
- Email: support@paperthought.app
