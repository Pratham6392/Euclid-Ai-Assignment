import { Request, Response } from 'express';
import { getTokenMetadata, GetTokenMetadataParams } from '../tools/getTokenMetadata.js';
import { getRoutes, GetRoutesParams } from '../tools/getRoutes.js';
import { formatHTTPChunk, formatStreamChunk, Logger } from '../utils.js';
import { MCPStreamChunk } from '../types.js';

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
      const progressChunk: MCPStreamChunk = {
        type: 'progress',
        tool: 'getRoutes',
        data: { message: 'Fetching routes...' },
      };
      console.log('\n[ROUTES REQUEST - SSE]');
      console.log('Status: In Progress');
      console.log('Message:', progressChunk.data.message);
      const progressResponse = formatStreamChunk(progressChunk);
      console.log('Response Chunk Sent:', progressResponse.trim());
      res.write(progressResponse);

      // Execute tool
      const result = await getRoutes(params);

      // Send result chunk
      if (result.error) {
        const errorChunk: MCPStreamChunk = {
          type: 'error',
          tool: 'getRoutes',
          error: result.error,
        };
        console.log('[ROUTES RESPONSE - SSE] ERROR');
        console.log('Error Code:', result.error.code);
        console.log('Error Message:', result.error.message);
        const errorResponse = formatStreamChunk(errorChunk);
        console.log('Response Chunk Sent:', errorResponse.trim());
        console.log('Full Error Response:', JSON.stringify(errorChunk, null, 2));
        res.write(errorResponse);
      } else {
        const resultChunk: MCPStreamChunk = {
          type: 'result',
          tool: 'getRoutes',
          data: result.result,
        };
        console.log('[ROUTES RESPONSE - SSE] SUCCESS');
        console.log('Summary:', JSON.stringify(result.result.summary, null, 2));
        console.log('Total Routes:', result.result.summary?.totalRoutes || 0);
        if (result.result.routes && result.result.routes.length > 0) {
          console.log('Routes Preview (first 3):');
          result.result.routes.slice(0, 3).forEach((route: any, idx: number) => {
            console.log(`  Route ${idx + 1}: Path: ${route.path?.join(' -> ') || 'N/A'}, Amount Out: ${route.amountOut || 'N/A'}`);
          });
          if (result.result.routes.length > 3) {
            console.log(`  ... and ${result.result.routes.length - 3} more routes`);
          }
        }
        console.log('Full Response Data:', JSON.stringify(result.result, null, 2));
        const resultResponse = formatStreamChunk(resultChunk);
        console.log('Response Chunk Sent:', resultResponse.trim());
        console.log('Full Response Chunk:', JSON.stringify(resultChunk, null, 2));
        res.write(resultResponse);
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
      const progressChunk: MCPStreamChunk = {
        type: 'progress',
        tool: 'getTokenMetadata',
        data: { message: 'Fetching token metadata...' },
      };
      console.log('\n[TOKEN METADATA REQUEST - SSE]');
      console.log('Status: In Progress');
      console.log('Message:', progressChunk.data.message);
      const progressResponse = formatStreamChunk(progressChunk);
      console.log('Response Chunk Sent:', progressResponse.trim());
      res.write(progressResponse);

      // Execute tool
      const result = await getTokenMetadata(params);

      // Send result chunk
      if (result.error) {
        const errorChunk: MCPStreamChunk = {
          type: 'error',
          tool: 'getTokenMetadata',
          error: result.error,
        };
        console.log('[TOKEN METADATA RESPONSE - SSE] ERROR');
        console.log('Error Code:', result.error.code);
        console.log('Error Message:', result.error.message);
        const errorResponse = formatStreamChunk(errorChunk);
        console.log('Response Chunk Sent:', errorResponse.trim());
        console.log('Full Error Response:', JSON.stringify(errorChunk, null, 2));
        res.write(errorResponse);
      } else {
        const resultChunk: MCPStreamChunk = {
          type: 'result',
          tool: 'getTokenMetadata',
          data: result.result,
        };
        console.log('[TOKEN METADATA RESPONSE - SSE] SUCCESS');
        if (result.result.summary && result.result.token) {
          // Single token response
          console.log('Token ID:', result.result.summary.id);
          console.log('Name:', result.result.summary.name);
          console.log('Price:', result.result.token.price?.current || 'N/A');
          console.log('24h Change:', result.result.token.price?.change24h?.percentage || 'N/A');
          console.log('Volume 24h:', result.result.token.volume?.total24h || 'N/A');
          console.log('Verified:', result.result.token.details?.verified ? 'Yes' : 'No');
        } else if (result.result.summary && result.result.tokens) {
          // Multiple tokens response
          console.log('Summary:', JSON.stringify(result.result.summary, null, 2));
          console.log('Total Tokens:', result.result.summary.total);
          if (result.result.tokens && result.result.tokens.length > 0) {
            console.log('Tokens Preview (first 5):');
            result.result.tokens.slice(0, 5).forEach((token: any, idx: number) => {
              console.log(`  Token ${idx + 1}: ${token.name} (${token.id}) - ${token.price} | 24h: ${token.priceChange24h}`);
            });
            if (result.result.tokens.length > 5) {
              console.log(`  ... and ${result.result.tokens.length - 5} more tokens`);
            }
          }
        }
        console.log('Full Response Data:', JSON.stringify(result.result, null, 2));
        const resultResponse = formatStreamChunk(resultChunk);
        console.log('Response Chunk Sent:', resultResponse.trim());
        console.log('Full Response Chunk:', JSON.stringify(resultChunk, null, 2));
        res.write(resultResponse);
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
      const progressChunk: MCPStreamChunk = {
        type: 'progress',
        tool: 'getRoutes',
        data: { message: 'Fetching routes...' },
      };
      console.log('\n[ROUTES REQUEST - HTTP]');
      console.log('Status: In Progress');
      console.log('Message:', progressChunk.data.message);
      const progressResponse = formatHTTPChunk(progressChunk);
      console.log('Response Chunk Sent:', progressResponse.trim());
      res.write(progressResponse);

      // Execute tool
      const result = await getRoutes(params);

      // Send result chunk
      if (result.error) {
        const errorChunk: MCPStreamChunk = {
          type: 'error',
          tool: 'getRoutes',
          error: result.error,
        };
        console.log('[ROUTES RESPONSE - HTTP] ERROR');
        console.log('Error Code:', result.error.code);
        console.log('Error Message:', result.error.message);
        const errorResponse = formatHTTPChunk(errorChunk);
        console.log('Response Chunk Sent:', errorResponse.trim());
        console.log('Full Error Response:', JSON.stringify(errorChunk, null, 2));
        res.write(errorResponse);
      } else {
        const resultChunk: MCPStreamChunk = {
          type: 'result',
          tool: 'getRoutes',
          data: result.result,
        };
        console.log('[ROUTES RESPONSE - HTTP] SUCCESS');
        console.log('Summary:', JSON.stringify(result.result.summary, null, 2));
        console.log('Total Routes:', result.result.summary?.totalRoutes || 0);
        if (result.result.routes && result.result.routes.length > 0) {
          console.log('Routes Preview (first 3):');
          result.result.routes.slice(0, 3).forEach((route: any, idx: number) => {
            console.log(`  Route ${idx + 1}: Path: ${route.path?.join(' -> ') || 'N/A'}, Amount Out: ${route.amountOut || 'N/A'}`);
          });
          if (result.result.routes.length > 3) {
            console.log(`  ... and ${result.result.routes.length - 3} more routes`);
          }
        }
        console.log('Full Response Data:', JSON.stringify(result.result, null, 2));
        const resultResponse = formatHTTPChunk(resultChunk);
        console.log('Response Chunk Sent:', resultResponse.trim());
        console.log('Full Response Chunk:', JSON.stringify(resultChunk, null, 2));
        res.write(resultResponse);
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
      const progressChunk: MCPStreamChunk = {
        type: 'progress',
        tool: 'getTokenMetadata',
        data: { message: 'Fetching token metadata...' },
      };
      console.log('\n[TOKEN METADATA REQUEST - HTTP]');
      console.log('Status: In Progress');
      console.log('Message:', progressChunk.data.message);
      const progressResponse = formatHTTPChunk(progressChunk);
      console.log('Response Chunk Sent:', progressResponse.trim());
      res.write(progressResponse);

      // Execute tool
      const result = await getTokenMetadata(params);

      // Send result chunk
      if (result.error) {
        const errorChunk: MCPStreamChunk = {
          type: 'error',
          tool: 'getTokenMetadata',
          error: result.error,
        };
        console.log('[TOKEN METADATA RESPONSE - HTTP] ERROR');
        console.log('Error Code:', result.error.code);
        console.log('Error Message:', result.error.message);
        const errorResponse = formatHTTPChunk(errorChunk);
        console.log('Response Chunk Sent:', errorResponse.trim());
        console.log('Full Error Response:', JSON.stringify(errorChunk, null, 2));
        res.write(errorResponse);
      } else {
        const resultChunk: MCPStreamChunk = {
          type: 'result',
          tool: 'getTokenMetadata',
          data: result.result,
        };
        console.log('[TOKEN METADATA RESPONSE - HTTP] SUCCESS');
        if (result.result.summary && result.result.token) {
          // Single token response
          console.log('Token ID:', result.result.summary.id);
          console.log('Name:', result.result.summary.name);
          console.log('Price:', result.result.token.price?.current || 'N/A');
          console.log('24h Change:', result.result.token.price?.change24h?.percentage || 'N/A');
          console.log('Volume 24h:', result.result.token.volume?.total24h || 'N/A');
          console.log('Verified:', result.result.token.details?.verified ? 'Yes' : 'No');
        } else if (result.result.summary && result.result.tokens) {
          // Multiple tokens response
          console.log('Summary:', JSON.stringify(result.result.summary, null, 2));
          console.log('Total Tokens:', result.result.summary.total);
          if (result.result.tokens && result.result.tokens.length > 0) {
            console.log('Tokens Preview (first 5):');
            result.result.tokens.slice(0, 5).forEach((token: any, idx: number) => {
              console.log(`  Token ${idx + 1}: ${token.name} (${token.id}) - ${token.price} | 24h: ${token.priceChange24h}`);
            });
            if (result.result.tokens.length > 5) {
              console.log(`  ... and ${result.result.tokens.length - 5} more tokens`);
            }
          }
        }
        console.log('Full Response Data:', JSON.stringify(result.result, null, 2));
        const resultResponse = formatHTTPChunk(resultChunk);
        console.log('Response Chunk Sent:', resultResponse.trim());
        console.log('Full Response Chunk:', JSON.stringify(resultChunk, null, 2));
        res.write(resultResponse);
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

