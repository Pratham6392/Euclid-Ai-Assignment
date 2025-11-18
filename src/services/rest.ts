import { RoutesRequest, RoutesResponse } from '../types';
import { Logger } from '../utils';

const REST_ENDPOINT = process.env.EUCLID_REST_ENDPOINT || 'https://testnet.api.euclidprotocol.com/api/v1/routes';

export interface RoutesParams extends RoutesRequest {
  limit?: number;
}

/**
 * Fetch swap routes from the REST API
 */
export async function fetchRoutes(params: RoutesParams): Promise<RoutesResponse> {
  try {
    Logger.debug('Fetching routes', params);

    const { limit, token_in, token_out, amount_in } = params;

    // Build URL with query parameters
    const url = new URL(REST_ENDPOINT);
    if (limit !== undefined) {
      url.searchParams.set('limit', limit.toString());
    }

    // Make POST request
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token_in,
        token_out,
        amount_in,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: RoutesResponse = await response.json();
    Logger.info(`Fetched routes for ${token_in} -> ${token_out}`);
    return data;
  } catch (error: any) {
    Logger.error('Error fetching routes', error);
    throw new Error(`Failed to fetch routes: ${error.message}`);
  }
}

