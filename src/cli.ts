import * as readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

interface Question {
  question: string;
  key: string;
  required?: boolean;
  validator?: (value: string) => boolean | string;
}

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function printHeader() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     Euclid Protocol MCP Server - CLI Tool                ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

function printMenu() {
  console.log('Select an option:');
  console.log('  1. Get Token Metadata (HTTP)');
  console.log('  2. Get Token Metadata (SSE)');
  console.log('  3. Get Routes (HTTP)');
  console.log('  4. Get Routes (SSE)');
  console.log('  5. Exit\n');
}

async function fetchTokenMetadataHTTP(params: {
  limit?: number;
  offset?: number;
  search?: string;
  tokenId?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tokenId) queryParams.append('tokenId', params.tokenId);

    const url = `${SERVER_URL}/mcp/http?${queryParams.toString()}`;
    console.log(`\n📡 Fetching from: ${url}\n`);

    const response = await fetch(url);
    const text = await response.text();
    
    // Parse streaming response
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        displayResponse(data);
      } catch (e) {
        console.log(line);
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function fetchTokenMetadataSSE(params: {
  limit?: number;
  offset?: number;
  search?: string;
  tokenId?: string;
}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.tokenId) queryParams.append('tokenId', params.tokenId);

    const url = `${SERVER_URL}/mcp/sse?${queryParams.toString()}`;
    console.log(`\n📡 Fetching from: ${url}\n`);

    const response = await fetch(url);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));
      
      lines.forEach(line => {
        try {
          const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
          displayResponse(data);
        } catch (e) {
          // Ignore parse errors for non-JSON lines
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function fetchRoutesHTTP(params: {
  token_in: string;
  token_out: string;
  amount_in: string;
  limit?: number;
}) {
  try {
    const url = `${SERVER_URL}/mcp/http`;
    console.log(`\n📡 Fetching from: ${url}`);
    console.log(`📤 Request body:`, params, '\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const text = await response.text();
    
    // Parse streaming response
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        displayResponse(data);
      } catch (e) {
        console.log(line);
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function fetchRoutesSSE(params: {
  token_in: string;
  token_out: string;
  amount_in: string;
  limit?: number;
}) {
  try {
    const url = `${SERVER_URL}/mcp/sse`;
    console.log(`\n📡 Fetching from: ${url}`);
    console.log(`📤 Request body:`, params, '\n');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));
      
      lines.forEach(line => {
        try {
          const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
          displayResponse(data);
        } catch (e) {
          // Ignore parse errors for non-JSON lines
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

function displayResponse(data: any) {
  if (data.type === 'progress') {
    console.log(`⏳ ${data.data?.message || 'Processing...'}`);
  } else if (data.type === 'error') {
    console.error(`❌ Error [${data.error?.code || 'UNKNOWN'}]:`, data.error?.message || 'Unknown error');
  } else if (data.type === 'result') {
    console.log('\n✅ Result:');
    console.log(JSON.stringify(data.data, null, 2));
  }
}

async function getTokenMetadataParams(): Promise<{
  limit?: number;
  offset?: number;
  search?: string;
  tokenId?: string;
}> {
  const params: any = {};

  const limit = await askQuestion('Limit (optional, press Enter to skip): ');
  if (limit) {
    const num = parseInt(limit, 10);
    if (!isNaN(num)) params.limit = num;
  }

  const offset = await askQuestion('Offset (optional, press Enter to skip): ');
  if (offset) {
    const num = parseInt(offset, 10);
    if (!isNaN(num)) params.offset = num;
  }

  const search = await askQuestion('Search term (optional, press Enter to skip): ');
  if (search) params.search = search;

  const tokenId = await askQuestion('Token ID (optional, press Enter to skip): ');
  if (tokenId) params.tokenId = tokenId;

  return params;
}

async function getRoutesParams(): Promise<{
  token_in: string;
  token_out: string;
  amount_in: string;
  limit?: number;
}> {
  const token_in = await askQuestion('Token In (required, e.g., "stars"): ');
  if (!token_in) {
    throw new Error('Token In is required');
  }

  const token_out = await askQuestion('Token Out (required, e.g., "usdc"): ');
  if (!token_out) {
    throw new Error('Token Out is required');
  }

  const amount_in = await askQuestion('Amount In (required, e.g., "1000000"): ');
  if (!amount_in) {
    throw new Error('Amount In is required');
  }

  const params: any = {
    token_in,
    token_out,
    amount_in,
  };

  const limit = await askQuestion('Limit (optional, press Enter to skip): ');
  if (limit) {
    const num = parseInt(limit, 10);
    if (!isNaN(num)) params.limit = num;
  }

  return params;
}

async function main() {
  printHeader();

  while (true) {
    printMenu();
    const choice = await askQuestion('Enter your choice (1-5): ');

    try {
      switch (choice) {
        case '1':
          console.log('\n📋 Get Token Metadata (HTTP)\n');
          const httpParams = await getTokenMetadataParams();
          await fetchTokenMetadataHTTP(httpParams);
          break;

        case '2':
          console.log('\n📋 Get Token Metadata (SSE)\n');
          const sseParams = await getTokenMetadataParams();
          await fetchTokenMetadataSSE(sseParams);
          break;

        case '3':
          console.log('\n🛣️  Get Routes (HTTP)\n');
          const httpRoutesParams = await getRoutesParams();
          await fetchRoutesHTTP(httpRoutesParams);
          break;

        case '4':
          console.log('\n🛣️  Get Routes (SSE)\n');
          const sseRoutesParams = await getRoutesParams();
          await fetchRoutesSSE(sseRoutesParams);
          break;

        case '5':
          console.log('\n👋 Goodbye!\n');
          rl.close();
          process.exit(0);
          break;

        default:
          console.log('\n❌ Invalid choice. Please select 1-5.\n');
      }
    } catch (error: any) {
      console.error('\n❌ Error:', error.message, '\n');
    }

    // Ask if user wants to continue
    if (choice !== '5') {
      const continueChoice = await askQuestion('\nPress Enter to continue or type "q" to quit: ');
      if (continueChoice.toLowerCase() === 'q') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!\n');
  rl.close();
  process.exit(0);
});

// Start the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});

