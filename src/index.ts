import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { handleSSE } from './handlers/unifiedHandler';
import { handleHTTP } from './handlers/unifiedHandler';
import { Logger } from './utils';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const GRAPHQL_ENDPOINT = process.env.EUCLID_GRAPHQL_ENDPOINT || 'https://testnet.api.euclidprotocol.com/graphql';
const REST_ENDPOINT = process.env.EUCLID_REST_ENDPOINT || 'https://testnet.api.euclidprotocol.com/api/v1/routes';
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  Logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
  });
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unified SSE Endpoint - handles both token metadata (GET) and routes (POST)
app.get('/mcp/sse', handleSSE);
app.post('/mcp/sse', handleSSE);

// Unified HTTP Chunked Endpoint - handles both token metadata (GET) and routes (POST)
app.get('/mcp/http', handleHTTP);
app.post('/mcp/http', handleHTTP);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  Logger.error('Unhandled error', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Start server
app.listen(PORT, () => {
  Logger.info(`MCP Server started on port ${PORT}`);
  Logger.info(`GraphQL Endpoint: ${GRAPHQL_ENDPOINT}`);
  Logger.info(`REST Endpoint: ${REST_ENDPOINT}`);
  Logger.info('Available endpoints:');
  Logger.info('  GET  /mcp/sse - Token metadata (SSE streaming)');
  Logger.info('  POST /mcp/sse - Routes (SSE streaming)');
  Logger.info('  GET  /mcp/http - Token metadata (HTTP chunked)');
  Logger.info('  POST /mcp/http - Routes (HTTP chunked)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

