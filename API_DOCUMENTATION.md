# API Documentation

## Overview

The Enterprise IT Helpdesk AI provides RESTful APIs for managing IT support inquiries and interacting with AI agents.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Currently, no authentication is required. Future versions will include JWT-based authentication.

## Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": string | null,
  "message": string | null,
  "timestamp": string
}
```

## Endpoints

### Health Check

#### `GET /health`

Check the health status of the API server.

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Inquiries

#### `POST /inquiries`

Create a new IT support inquiry and get AI-powered response.

**Request Body:**

```json
{
  "title": "string (required)",
  "category": "network|hardware|software|account|security|other (required)",
  "priority": "low|medium|high|urgent (optional, default: medium)",
  "content": "string (required)",
  "userId": "string (optional)",
  "tags": "string[] (optional)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "resp_123456789",
    "inquiryId": "inq_123456789",
    "aiAgent": "claude",
    "content": "Based on your network connectivity issue...",
    "confidence": 0.92,
    "reasoning": "Coordinated response from multiple AI agents...",
    "sources": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /inquiries`

Retrieve a list of inquiries with optional filtering.

**Query Parameters:**

- `limit`: number (optional, default: 10, max: 100)
- `offset`: number (optional, default: 0)
- `status`: string (optional)
- `category`: string (optional)
- `userId`: string (optional)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "inq_123456789",
      "userId": "user_123",
      "title": "Network connectivity issue",
      "category": "network",
      "priority": "high",
      "status": "resolved",
      "tags": ["wifi", "connectivity"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T01:00:00Z",
      "resolvedAt": "2024-01-01T01:00:00Z"
    }
  ]
}
```

#### `GET /inquiries/:id`

Retrieve a specific inquiry by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "inq_123456789",
    "userId": "user_123",
    "title": "Network connectivity issue",
    "description": "Cannot connect to corporate WiFi",
    "content": "Cannot connect to corporate WiFi",
    "category": "network",
    "priority": "high",
    "status": "resolved",
    "tags": ["wifi", "connectivity"],
    "timestamp": 1704067200000,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T01:00:00Z",
    "resolvedAt": "2024-01-01T01:00:00Z",
    "responses": [
      {
        "id": "resp_123456789",
        "inquiryId": "inq_123456789",
        "aiAgent": "claude",
        "content": "Try resetting your network settings...",
        "confidence": 0.92,
        "reasoning": "Coordinated response from GPT and Gemini agents",
        "sources": [
          {
            "type": "documentation",
            "title": "Corporate WiFi Setup Guide",
            "url": "https://docs.company.com/wifi",
            "relevance": 0.95
          }
        ],
        "createdAt": "2024-01-01T00:30:00Z"
      }
    ]
  }
}
```

### Agents

#### `GET /agents`

Get list of available AI agents.

**Response:**

```json
{
  "success": true,
  "data": ["claude", "gpt", "gemini", "perplexity"]
}
```

#### `GET /agents/health`

Get health status of all AI agents.

**Response:**

```json
{
  "success": true,
  "data": {
    "claude": true,
    "gpt": true,
    "gemini": true,
    "perplexity": false
  }
}
```

### System

#### `GET /status`

Get overall system status.

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": {
      "total": 4,
      "healthy": 3
    },
    "database": true,
    "uptime": 3600000
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Missing required fields: title, category, content",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found",
  "message": "Inquiry with ID inq_123456789 not found",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Rate Limiting

- 100 requests per minute per IP address
- 1000 requests per hour per IP address

## WebSocket Support

Real-time updates for inquiry status changes are available via WebSocket:

```
ws://localhost:3000/ws/inquiries
```

## SDKs and Libraries

### JavaScript/TypeScript Client

```javascript
const client = new HelpdeskAIClient({
  baseURL: 'http://localhost:3000/api/v1',
});

// Create inquiry
const response = await client.createInquiry({
  title: 'Printer not working',
  category: 'hardware',
  content: 'Cannot print documents',
});
```

## Changelog

### v1.0.0

- Initial API release
- Basic inquiry management
- AI agent integration
- Multi-agent coordination

## Support

For API support, please create an issue in the [GitHub repository](https://github.com/Kensan196948G/Enterprise-IT-Helpdesk-AI/issues).
