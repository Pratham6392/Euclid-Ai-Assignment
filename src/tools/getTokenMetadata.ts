import {
  fetchTokenMetadatas,
  fetchTokenMetadataById,
} from '../services/graphql.js';
import { MCPToolResponse } from '../types.js';
import { 
  formatMCPResult, 
  formatMCPError, 
  validateTokenMetadataParams, 
  Logger,
  formatTokenMetadataResult,
  formatSingleTokenResult
} from '../utils.js';

export interface GetTokenMetadataParams {
  limit?: number;
  offset?: number;
  search?: string;
  tokenId?: string;
}

/**
 * Get token metadata tool implementation
 */
export async function getTokenMetadata(
  params: GetTokenMetadataParams
): Promise<MCPToolResponse> {
  try {
    Logger.info('Executing getTokenMetadata tool', params);

    // Validate parameters
    const validation = validateTokenMetadataParams(params);
    if (!validation.valid) {
      return formatMCPError('INVALID_PARAMS', validation.error || 'Invalid parameters');
    }

    // If tokenId is provided, fetch by ID
    if (params.tokenId) {
      const token = await fetchTokenMetadataById({ tokenId: params.tokenId });
      
      if (!token) {
        return formatMCPError('NOT_FOUND', `Token with ID ${params.tokenId} not found`);
      }

      return formatMCPResult('getTokenMetadata', formatSingleTokenResult(token));
    }

    // Otherwise, fetch list of tokens
    const tokens = await fetchTokenMetadatas({
      limit: params.limit,
      offset: params.offset,
      search: params.search,
    });

    return formatMCPResult('getTokenMetadata', formatTokenMetadataResult(tokens, tokens.length));
  } catch (error: any) {
    Logger.error('Error in getTokenMetadata tool', error);
    return formatMCPError('EXECUTION_ERROR', error.message || 'Failed to get token metadata');
  }
}

