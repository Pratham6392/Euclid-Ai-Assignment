import { Request, Response } from 'express';
import { getTokenMetadata, GetTokenMetadataParams } from '../tools/getTokenMetadata';
import { getRoutes, GetRoutesParams } from '../tools/getRoutes';
import { formatHTTPChunk, formatStreamChunk, Logger } from '../utils';

/**
 * Unified SSE Handler - handles both token metadata and routes
 */
export async function handleSSE(req: Request, res: Response): Promise<void> {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Determine request type based on body or query params
    const isRoutesRequest = req.body && (req.body.token_in || req.body.token_out);
    const isTokenMetadataRequest = req.query.tokenId || req.query.search || req.query.limit || req.query.offset;

    if (isRoutesRequest) {
      // Handle routes request
      Logger.info('SSE request for routes', req.body);

      const params: GetRoutesParams = {
        token_in: req.body.token_in,
        token_out: req.body.token_out,
        amount_in: req.body.amount_in,
        limit: req.body.limit ? parseInt(req.body.limit, 10) : undefined,
      };

      // Validate required fields
      if (!params.token_in || !params.token_out || !params.amount_in) {
        res.write(formatStreamChunk({
          type: 'error',
          tool: 'getRoutes',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: token_in, token_out, amount_in',
          },
        }));
        res.end();
        return;
      }

      // Send progress chunk
      res.write(formatStreamChunk({
        type: 'progress',
        tool: 'getRoutes',
        data: { message: 'Fetching routes...' },
      }));

      // Execute tool
      const result = await getRoutes(params);

      // Send result chunk
      if (result.error) {
        res.write(formatStreamChunk({
          type: 'error',
          tool: 'getRoutes',
          error: result.error,
        }));
      } else {
        res.write(formatStreamChunk({
          type: 'result',
          tool: 'getRoutes',
          data: result.result,
        }));
      }

      res.end();
    } else if (isTokenMetadataRequest || req.method === 'GET') {
      // Handle token metadata request
      Logger.info('SSE request for token metadata', req.query);

      const params: GetTokenMetadataParams = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
        search: req.query.search as string | undefined,
        tokenId: req.query.tokenId as string | undefined,
      };

      // Send progress chunk
      res.write(formatStreamChunk({
        type: 'progress',
        tool: 'getTokenMetadata',
        data: { message: 'Fetching token metadata...' },
      }));

      // Execute tool
      const result = await getTokenMetadata(params);

      // Send result chunk
      if (result.error) {
        res.write(formatStreamChunk({
          type: 'error',
          tool: 'getTokenMetadata',
          error: result.error,
        }));
      } else {
        res.write(formatStreamChunk({
          type: 'result',
          tool: 'getTokenMetadata',
          data: result.result,
        }));
      }

      res.end();
    } else {
      res.write(formatStreamChunk({
        type: 'error',
        tool: 'unknown',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request. Provide either token metadata query params (GET) or routes body params (POST)',
        },
      }));
      res.end();
    }
  } catch (error: any) {
    Logger.error('Error in unified SSE handler', error);
    res.write(formatStreamChunk({
      type: 'error',
      tool: 'unknown',
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Internal server error',
      },
    }));
    res.end();
  }
}

/**
 * Unified HTTP Chunked Handler - handles both token metadata and routes
 */
export async function handleHTTP(req: Request, res: Response): Promise<void> {
  // Set HTTP chunked headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Determine request type based on body or query params
    const isRoutesRequest = req.body && (req.body.token_in || req.body.token_out);
    const isTokenMetadataRequest = req.query.tokenId || req.query.search || req.query.limit || req.query.offset;

    if (isRoutesRequest) {
      // Handle routes request
      Logger.info('HTTP request for routes', req.body);

      const params: GetRoutesParams = {
        token_in: req.body.token_in,
        token_out: req.body.token_out,
        amount_in: req.body.amount_in,
        limit: req.body.limit ? parseInt(req.body.limit, 10) : undefined,
      };

      // Validate required fields
      if (!params.token_in || !params.token_out || !params.amount_in) {
        res.write(formatHTTPChunk({
          type: 'error',
          tool: 'getRoutes',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: token_in, token_out, amount_in',
          },
        }));
        res.end();
        return;
      }

      // Send progress chunk
      res.write(formatHTTPChunk({
        type: 'progress',
        tool: 'getRoutes',
        data: { message: 'Fetching routes...' },
      }));

      // Execute tool
      const result = await getRoutes(params);

      // Send result chunk
      if (result.error) {
        res.write(formatHTTPChunk({
          type: 'error',
          tool: 'getRoutes',
          error: result.error,
        }));
      } else {
        res.write(formatHTTPChunk({
          type: 'result',
          tool: 'getRoutes',
          data: result.result,
        }));
      }

      res.end();
    } else if (isTokenMetadataRequest || req.method === 'GET') {
      // Handle token metadata request
      Logger.info('HTTP request for token metadata', req.query);

      const params: GetTokenMetadataParams = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
        search: req.query.search as string | undefined,
        tokenId: req.query.tokenId as string | undefined,
      };

      // Send progress chunk
      res.write(formatHTTPChunk({
        type: 'progress',
        tool: 'getTokenMetadata',
        data: { message: 'Fetching token metadata...' },
      }));

      // Execute tool
      const result = await getTokenMetadata(params);

      // Send result chunk
      if (result.error) {
        res.write(formatHTTPChunk({
          type: 'error',
          tool: 'getTokenMetadata',
          error: result.error,
        }));
      } else {
        res.write(formatHTTPChunk({
          type: 'result',
          tool: 'getTokenMetadata',
          data: result.result,
        }));
      }

      res.end();
    } else {
      res.write(formatHTTPChunk({
        type: 'error',
        tool: 'unknown',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request. Provide either token metadata query params (GET) or routes body params (POST)',
        },
      }));
      res.end();
    }
  } catch (error: any) {
    Logger.error('Error in unified HTTP handler', error);
    res.write(formatHTTPChunk({
      type: 'error',
      tool: 'unknown',
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Internal server error',
      },
    }));
    res.end();
  }
}

