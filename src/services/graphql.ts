import { GraphQLClient, gql } from 'graphql-request';
import { TokenMetadataResponse, TokenMetadata } from '../types.js';
import { Logger } from '../utils.js';

const GRAPHQL_ENDPOINT = process.env.EUCLID_GRAPHQL_ENDPOINT || 'https://testnet.api.euclidprotocol.com/graphql';

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

// Query for listing token metadatas
const TOKEN_METADATAS_QUERY = gql`
  query Token_metadatas($limit: Int, $offset: Int, $search: String) {
    token {
      token_metadatas(limit: $limit, offset: $offset, search: $search) {
        coinDecimal
        displayName
        tokenId
        description
        image
        price
        price_change_24h
        price_change_7d
        dex
        chain_uids
        total_volume
        total_volume_24h
        tags
        min_swap_value
        social
        is_verified
      }
    }
  }
`;

// Query for getting token metadata by ID
const TOKEN_METADATA_BY_ID_QUERY = gql`
  query Token_metadata_by_id($tokenId: String!) {
    token {
      token_metadata_by_id(token_id: $tokenId) {
        coinDecimal
        displayName
        tokenId
        description
        image
        price
        price_change_24h
        price_change_7d
        dex
        chain_uids
        total_volume
        total_volume_24h
        tags
        min_swap_value
        social
        is_verified
      }
    }
  }
`;

export interface TokenMetadatasParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface TokenMetadataByIdParams {
  tokenId: string;
}

/**
 * Fetch token metadatas with optional filtering
 */
export async function fetchTokenMetadatas(
  params: TokenMetadatasParams = {}
): Promise<TokenMetadata[]> {
  try {
    Logger.debug('Fetching token metadatas', params);

    const variables = {
      limit: params.limit,
      offset: params.offset,
      search: params.search || undefined,
    };

    const response = await client.request<TokenMetadataResponse>(
      TOKEN_METADATAS_QUERY,
      variables
    );

    const tokens = response.token.token_metadatas || [];
    Logger.info(`Fetched ${tokens.length} token metadatas`);
    return tokens;
  } catch (error: any) {
    Logger.error('Error fetching token metadatas', error);
    throw new Error(`Failed to fetch token metadatas: ${error.message}`);
  }
}

/**
 * Fetch token metadata by ID
 */
export async function fetchTokenMetadataById(
  params: TokenMetadataByIdParams
): Promise<TokenMetadata | null> {
  try {
    Logger.debug('Fetching token metadata by ID', params);

    const response = await client.request<TokenMetadataResponse>(
      TOKEN_METADATA_BY_ID_QUERY,
      { tokenId: params.tokenId }
    );

    const token = response.token.token_metadata_by_id || null;
    if (token) {
      Logger.info(`Fetched token metadata for ID: ${params.tokenId}`);
    } else {
      Logger.info(`No token metadata found for ID: ${params.tokenId}`);
    }
    return token;
  } catch (error: any) {
    Logger.error('Error fetching token metadata by ID', error);
    throw new Error(`Failed to fetch token metadata by ID: ${error.message}`);
  }
}

