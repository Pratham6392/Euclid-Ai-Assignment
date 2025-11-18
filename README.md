# Euclid Protocol MCP Server

A Model Context Protocol (MCP) server implementation in TypeScript that connects to the Euclid Protocol Testnet API and exposes SSE (Server-Sent Events) and HTTP streamable endpoints.

## 🎯 Overview

This server acts as middleware that:
- Fetches token information from the Euclid GraphQL API
- Fetches swap routes using the REST endpoint
- Streams responses back to clients in MCP-compliant format

## 📦 Features

- ✅ **GraphQL Integration**: Token metadata queries with filtering
- ✅ **REST API Integration**: Swap routes with customizable limits
- ✅ **Dual Streaming**: Both SSE and HTTP chunked transfer
- ✅ **Comprehensive Logging**: Console-based logging with timestamps
- ✅ **Error Handling**: Structured error responses
- ✅ **TypeScript**: Full type safety with strict mode
- ✅ **MCP-Compliant**: Structured JSON responses

## 🌐 Hosted Server

**Live Production URL:** https://euclid-mcp-server.vercel.app

All endpoints are available at the hosted URL:
- `GET https://euclid-mcp-server.vercel.app/health` - Health check
- `GET https://euclid-mcp-server.vercel.app/mcp/sse` - Token metadata (SSE)
- `POST https://euclid-mcp-server.vercel.app/mcp/sse` - Routes (SSE)
- `GET https://euclid-mcp-server.vercel.app/mcp/http` - Token metadata (HTTP)
- `POST https://euclid-mcp-server.vercel.app/mcp/http` - Routes (HTTP)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (required for native fetch API)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Or run in development mode with auto-reload
npm run dev
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
EUCLID_GRAPHQL_ENDPOINT=https://testnet.api.euclidprotocol.com/graphql
EUCLID_REST_ENDPOINT=https://testnet.api.euclidprotocol.com/api/v1/routes
```

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Token Metadata Endpoints

#### SSE Streaming
```
GET /mcp/sse/token-metadata?limit=10&offset=0&search=STARS
GET /mcp/sse/token-metadata?tokenId=stars
```

#### HTTP Streaming
```
GET /mcp/http/token-metadata?limit=10&offset=0&search=STARS
GET /mcp/http/token-metadata?tokenId=stars
```

**Query Parameters:**
- `limit` (optional): Maximum number of tokens to return
- `offset` (optional): Pagination offset
- `search` (optional): Search term for filtering
- `tokenId` (optional): Specific token ID to fetch (when provided, other params are ignored)

**Response Format:**
```json
{
  "type": "result",
  "tool": "getTokenMetadata",
  "data": {
    "tokens": [...],
    "count": 10
  }
}
```

Or for single token:
```json
{
  "type": "result",
  "tool": "getTokenMetadata",
  "data": {
    "token": { ... }
  }
}
```

### Routes Endpoints

#### SSE Streaming
```
POST /mcp/sse/routes
Content-Type: application/json

{
  "token_in": "stars",
  "token_out": "ntrn",
  "amount_in": "10000000000000000000000",
  "limit": 100
}
```

#### HTTP Streaming
```
POST /mcp/http/routes
Content-Type: application/json

{
  "token_in": "stars",
  "token_out": "ntrn",
  "amount_in": "10000000000000000000000",
  "limit": 100
}
```

**Request Body:**
- `token_in` (required): Source token ID
- `token_out` (required): Destination token ID
- `amount_in` (required): Amount to swap (as string)
- `limit` (optional): Maximum number of routes to return (default: 100)

**Response Format:**
```json
{
  "type": "result",
  "tool": "getRoutes",
  "data": {
    "routes": [...],
    ...
  }
}
```

## 🏗️ Project Structure

```
.
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # Utility functions (Logger, formatters, validators)
│   ├── handlers/
│   │   ├── sseHandler.ts        # SSE streaming handlers
│   │   └── httpHandler.ts       # HTTP chunked streaming handlers
│   ├── services/
│   │   ├── graphql.ts           # GraphQL client service
│   │   └── rest.ts              # REST API client service
│   └── tools/
│       ├── getTokenMetadata.ts  # Token metadata tool
│       └── getRoutes.ts         # Routes tool
├── .env                         # Environment variables
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 📝 MCP Response Format

All responses follow the MCP-compliant structure:

### Success Response
```json
{
  "type": "result",
  "tool": "toolName",
  "data": { ... }
}
```

### Error Response
```json
{
  "type": "error",
  "tool": "toolName",
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### Progress Response (Streaming)
```json
{
  "type": "progress",
  "tool": "toolName",
  "data": {
    "message": "Status update..."
  }
}
```

## 🔍 Error Codes

- `INVALID_PARAMS`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `EXECUTION_ERROR`: Error during tool execution
- `HANDLER_ERROR`: Error in request handler
- `INTERNAL_ERROR`: Unhandled server error

## 🛠️ Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload

### Logging

The server uses console-based logging with three levels:
- `INFO`: General information and request logs
- `ERROR`: Error messages with stack traces
- `DEBUG`: Detailed debugging information (enable with `DEBUG=true` env var)

All logs include timestamps in ISO format.

## 📊 Example Usage

### Fetch Token List (Local)
```bash
curl "http://localhost:3000/mcp/http?limit=5"
```

### Fetch Token List (Production)
```bash
curl "https://euclid-mcp-server.vercel.app/mcp/http?limit=5"
```

### Fetch Single Token (Production)
```bash
curl "https://euclid-mcp-server.vercel.app/mcp/http?tokenId=stars"
```

### Get Swap Routes (Production)
```bash
curl -X POST https://euclid-mcp-server.vercel.app/mcp/http \
  -H "Content-Type: application/json" \
  -d '{
    "token_in": "stars",
    "token_out": "ntrn",
    "amount_in": "10000000000000000000000"
  }'
```

### SSE Streaming (JavaScript - Production)
```javascript
const eventSource = new EventSource('https://euclid-mcp-server.vercel.app/mcp/sse?limit=5');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  if (data.type === 'result') {
    eventSource.close();
  }
};
```

## 🧪 Testing

The server can be tested using:
- `curl` for HTTP requests
- Browser console for SSE connections
- Postman or Insomnia for API testing
- Any HTTP client library

### Test the Hosted Server

```bash
# Health check
curl https://euclid-mcp-server.vercel.app/health

# Token metadata
curl "https://euclid-mcp-server.vercel.app/mcp/http?limit=5"

# Routes
curl -X POST https://euclid-mcp-server.vercel.app/mcp/http \
  -H "Content-Type: application/json" \
  -d '{"token_in":"stars","token_out":"usdc","amount_in":"1000000"}'
```

## 🚀 Deployment on Vercel

This project is configured for Vercel deployment. To deploy:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Or connect via GitHub**:
   - Push your code to GitHub
   - Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
   - Vercel will automatically detect and deploy

The project includes:
- `vercel.json` - Vercel configuration
- `api/index.ts` - Serverless function handler

## 📄 License

ISC

## 🤝 Contributing

This is an assignment project for Euclid Protocol.

