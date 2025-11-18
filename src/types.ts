// Token Metadata Types
export interface TokenMetadata {
  coinDecimal: number;
  displayName: string;
  tokenId: string;
  description: string | null;
  image: string | null;
  price: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  dex: string | null;
  chain_uids: string[] | null;
  total_volume: number | null;
  total_volume_24h: number | null;
  tags: string[] | null;
  min_swap_value: number | null;
  social: Record<string, string> | null;
  is_verified: boolean;
}

export interface TokenMetadataResponse {
  token: {
    token_metadatas?: TokenMetadata[];
    token_metadata_by_id?: TokenMetadata;
  };
}

// Routes Types
export interface Route {
  [key: string]: any; // Routes structure may vary, using flexible type
}

export interface RoutesRequest {
  token_in: string;
  token_out: string;
  amount_in: string;
}

export interface RoutesResponse {
  routes?: Route[];
  [key: string]: any; // Additional fields may exist
}

// MCP Protocol Types
export interface MCPToolRequest {
  tool: string;
  parameters?: {
    limit?: number;
    offset?: number;
    search?: string;
    tokenId?: string;
    token_in?: string;
    token_out?: string;
    amount_in?: string;
  };
}

export interface MCPToolResponse {
  tool: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    data?: any;
  };
}

export interface MCPStreamChunk {
  type: 'result' | 'error' | 'progress';
  tool: string;
  data?: any;
  error?: {
    code: string;
    message: string;
    data?: any;
  };
}

// Environment Configuration
export interface EnvConfig {
  PORT: number;
  EUCLID_GRAPHQL_ENDPOINT: string;
  EUCLID_REST_ENDPOINT: string;
}

