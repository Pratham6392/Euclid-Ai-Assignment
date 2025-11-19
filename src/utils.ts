import { MCPToolResponse, MCPStreamChunk } from './types';

// Log Levels
export enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

// Logger Utility
export class Logger {
  private static formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  static info(message: string, data?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, data));
  }

  static error(message: string, error?: any): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, error));
  }

  static debug(message: string, data?: any): void {
    if (process.env.DEBUG === 'true') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }
}

// Error Formatters
export function formatMCPError(
  code: string,
  message: string,
  data?: any
): MCPToolResponse {
  return {
    tool: '',
    error: {
      code,
      message,
      data,
    },
  };
}

export function formatMCPResult(tool: string, result: any): MCPToolResponse {
  return {
    tool,
    result,
  };
}

// Response Formatters for better readability
export function formatTokenMetadataResult(tokens: any[], count?: number) {
  return {
    summary: {
      total: count || tokens.length,
      timestamp: new Date().toISOString(),
    },
    tokens: tokens.map(token => ({
      id: token.tokenId,
      name: token.displayName,
      price: token.price ? `$${token.price.toFixed(6)}` : 'N/A',
      priceChange24h: token.price_change_24h ? `${token.price_change_24h > 0 ? '+' : ''}${token.price_change_24h.toFixed(2)}%` : 'N/A',
      priceChange7d: token.price_change_7d ? `${token.price_change_7d > 0 ? '+' : ''}${token.price_change_7d.toFixed(2)}%` : 'N/A',
      volume24h: token.total_volume_24h ? `$${formatLargeNumber(token.total_volume_24h)}` : 'N/A',
      totalVolume: token.total_volume ? `$${formatLargeNumber(token.total_volume)}` : 'N/A',
      decimals: token.coinDecimal,
      verified: token.is_verified,
      chains: token.chain_uids || [],
      tags: token.tags || [],
      minSwapValue: token.min_swap_value ? formatLargeNumber(token.min_swap_value) : null,
      image: token.image,
      description: token.description,
      social: token.social,
      // Include full data for advanced use cases
      raw: token,
    })),
  };
}

export function formatSingleTokenResult(token: any) {
  return {
    summary: {
      id: token.tokenId,
      name: token.displayName,
      timestamp: new Date().toISOString(),
    },
    token: {
      id: token.tokenId,
      name: token.displayName,
      price: {
        current: token.price ? `$${token.price.toFixed(6)}` : 'N/A',
        value: token.price,
        change24h: token.price_change_24h ? {
          percentage: `${token.price_change_24h > 0 ? '+' : ''}${token.price_change_24h.toFixed(2)}%`,
          value: token.price_change_24h,
        } : null,
        change7d: token.price_change_7d ? {
          percentage: `${token.price_change_7d > 0 ? '+' : ''}${token.price_change_7d.toFixed(2)}%`,
          value: token.price_change_7d,
        } : null,
      },
      volume: {
        total24h: token.total_volume_24h ? `$${formatLargeNumber(token.total_volume_24h)}` : 'N/A',
        total: token.total_volume ? `$${formatLargeNumber(token.total_volume)}` : 'N/A',
        raw24h: token.total_volume_24h,
        rawTotal: token.total_volume,
      },
      details: {
        decimals: token.coinDecimal,
        verified: token.is_verified,
        chains: token.chain_uids || [],
        tags: token.tags || [],
        minSwapValue: token.min_swap_value ? formatLargeNumber(token.min_swap_value) : null,
        dex: token.dex,
      },
      metadata: {
        image: token.image,
        description: token.description,
        social: token.social,
      },
      // Include full raw data
      raw: token,
    },
  };
}

export function formatRoutesResult(routesData: any) {
  const routes = routesData.routes || [];
  const formattedRoutes = routes.map((route: any, index: number) => {
    // Extract common route information
    const routeInfo: any = {
      index: index + 1,
      path: route.path || route.token_path || [],
      amountOut: route.amount_out ? formatLargeNumber(route.amount_out) : 'N/A',
      amountOutRaw: route.amount_out,
      // Include all route data
      data: route,
    };

    // Add additional fields if they exist
    if (route.price_impact) routeInfo.priceImpact = `${route.price_impact}%`;
    if (route.fee) routeInfo.fee = route.fee;
    if (route.exchange_rate) routeInfo.exchangeRate = route.exchange_rate;
    if (route.estimated_gas) routeInfo.estimatedGas = formatLargeNumber(route.estimated_gas);

    return routeInfo;
  });

  return {
    summary: {
      tokenIn: routesData.token_in,
      tokenOut: routesData.token_out,
      amountIn: formatLargeNumber(routesData.amount_in),
      amountInRaw: routesData.amount_in,
      totalRoutes: routes.length,
      timestamp: new Date().toISOString(),
    },
    routes: formattedRoutes,
    // Include raw response for advanced use cases
    raw: routesData,
  };
}

// Helper function to format large numbers
function formatLargeNumber(num: number | string): string {
  if (typeof num === 'string') {
    num = parseFloat(num);
  }
  
  if (isNaN(num)) return '0';
  
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  } else {
    return num.toFixed(2);
  }
}

export function formatMCPStreamChunk(
  type: 'result' | 'error' | 'progress',
  tool: string,
  data?: any,
  error?: { code: string; message: string; data?: any }
): MCPStreamChunk {
  const chunk: MCPStreamChunk = {
    type,
    tool,
  };

  if (data) {
    chunk.data = data;
  }

  if (error) {
    chunk.error = error;
  }

  return chunk;
}

// Response Formatters
export function formatStreamChunk(chunk: MCPStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function formatHTTPChunk(chunk: MCPStreamChunk): string {
  return `${JSON.stringify(chunk)}\n`;
}

// Validation Helpers
export function validateTokenMetadataParams(params: {
  limit?: number;
  offset?: number;
  search?: string;
  tokenId?: string;
}): { valid: boolean; error?: string } {
  if (params.limit !== undefined && (params.limit < 0 || !Number.isInteger(params.limit))) {
    return { valid: false, error: 'limit must be a non-negative integer' };
  }

  if (params.offset !== undefined && (params.offset < 0 || !Number.isInteger(params.offset))) {
    return { valid: false, error: 'offset must be a non-negative integer' };
  }

  if (params.tokenId !== undefined && typeof params.tokenId !== 'string') {
    return { valid: false, error: 'tokenId must be a string' };
  }

  if (params.search !== undefined && typeof params.search !== 'string') {
    return { valid: false, error: 'search must be a string' };
  }

  return { valid: true };
}

export function validateRoutesParams(params: {
  token_in?: string;
  token_out?: string;
  amount_in?: string;
}): { valid: boolean; error?: string } {
  if (!params.token_in || typeof params.token_in !== 'string') {
    return { valid: false, error: 'token_in is required and must be a string' };
  }

  if (!params.token_out || typeof params.token_out !== 'string') {
    return { valid: false, error: 'token_out is required and must be a string' };
  }

  if (!params.amount_in || typeof params.amount_in !== 'string') {
    return { valid: false, error: 'amount_in is required and must be a string' };
  }

  return { valid: true };
}

