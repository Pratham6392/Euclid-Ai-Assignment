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

