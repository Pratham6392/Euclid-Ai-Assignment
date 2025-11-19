import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { handleSSE } from '../src/handlers/unifiedHandler.js';
import { handleHTTP } from '../src/handlers/unifiedHandler.js';
import { Logger } from '../src/utils.js';


dotenv.config();

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req: Request, res: Response, next) => {
  Logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
  });
  next();
});


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

// Export the Express app as a serverless function
export default app;

