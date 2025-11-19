import { fetchRoutes } from '../services/rest.js';
import { MCPToolResponse } from '../types.js';
import { 
  formatMCPResult, 
  formatMCPError, 
  validateRoutesParams, 
  Logger,
  formatRoutesResult
} from '../utils.js';

export interface GetRoutesParams {
  token_in: string;
  token_out: string;
  amount_in: string;
  limit?: number;
}

/**
 * Get routes tool implementation
 */
export async function getRoutes(params: GetRoutesParams): Promise<MCPToolResponse> {
  try {
    Logger.info('Executing getRoutes tool', params);

    // Validate parameters
    const validation = validateRoutesParams(params);
    if (!validation.valid) {
      return formatMCPError('INVALID_PARAMS', validation.error || 'Invalid parameters');
    }

    // Fetch routes
    const routesData = await fetchRoutes({
      token_in: params.token_in,
      token_out: params.token_out,
      amount_in: params.amount_in,
      limit: params.limit || 100,
    });

    return formatMCPResult('getRoutes', formatRoutesResult(routesData));
  } catch (error: any) {
    Logger.error('Error in getRoutes tool', error);
    return formatMCPError('EXECUTION_ERROR', error.message || 'Failed to get routes');
  }
}

