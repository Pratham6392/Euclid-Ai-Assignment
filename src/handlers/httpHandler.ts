import { Request, Response } from 'express';
import { getTokenMetadata, GetTokenMetadataParams } from '../tools/getTokenMetadata.js';
import { getRoutes, GetRoutesParams } from '../tools/getRoutes.js';
import { formatHTTPChunk, Logger } from '../utils.js';

/**
 * HTTP Chunked Handler for token metadata
 */
export async function handleHTTPTokenMetadata(req: Request, res: Response): Promise<void> {
  // Set HTTP chunked headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    Logger.info('HTTP request for token metadata', req.query);

    // Parse query parameters
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
  } catch (error: any) {
    Logger.error('Error in HTTP token metadata handler', error);
    res.write(formatHTTPChunk({
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
 * HTTP Chunked Handler for routes
 */
export async function handleHTTPRoutes(req: Request, res: Response): Promise<void> {
  // Set HTTP chunked headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    Logger.info('HTTP request for routes', req.body);

    // Parse body parameters
    const params: GetRoutesParams = {
      token_in: req.body.token_in,
      token_out: req.body.token_out,
      amount_in: req.body.amount_in,
      limit: req.body.limit ? parseInt(req.body.limit, 10) : undefined,
    };

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
  } catch (error: any) {
    Logger.error('Error in HTTP routes handler', error);
    res.write(formatHTTPChunk({
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

