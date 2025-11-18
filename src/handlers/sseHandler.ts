import { Request, Response } from 'express';
import { getTokenMetadata, GetTokenMetadataParams } from '../tools/getTokenMetadata';
import { getRoutes, GetRoutesParams } from '../tools/getRoutes';
import { formatStreamChunk, Logger } from '../utils';

/**
 * SSE Handler for token metadata
 */
export async function handleSSETokenMetadata(req: Request, res: Response): Promise<void> {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    Logger.info('SSE request for token metadata', req.query);

    // Parse query parameters
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
  } catch (error: any) {
    Logger.error('Error in SSE token metadata handler', error);
    res.write(formatStreamChunk({
      type: 'error',
      tool: 'getTokenMetadata',
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Internal server error',
      },
    }));
    res.end();
  }
}

/**
 * SSE Handler for routes
 */
export async function handleSSERoutes(req: Request, res: Response): Promise<void> {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    Logger.info('SSE request for routes', req.body);

    // Parse body parameters
    const params: GetRoutesParams = {
      token_in: req.body.token_in,
      token_out: req.body.token_out,
      amount_in: req.body.amount_in,
      limit: req.body.limit ? parseInt(req.body.limit, 10) : undefined,
    };

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
  } catch (error: any) {
    Logger.error('Error in SSE routes handler', error);
    res.write(formatStreamChunk({
      type: 'error',
      tool: 'getRoutes',
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Internal server error',
      },
    }));
    res.end();
  }
}

