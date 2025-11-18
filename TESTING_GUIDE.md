# Testing Guide - Euclid MCP Server

## Quick Start Testing

### 1. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm run build
npm start
```

Expected output:
```
[2024-11-15T10:30:00.000Z] [INFO] MCP Server started on port 3000
[2024-11-15T10:30:00.000Z] [INFO] GraphQL Endpoint: https://testnet.api.euclidprotocol.com/graphql
[2024-11-15T10:30:00.000Z] [INFO] REST Endpoint: https://testnet.api.euclidprotocol.com/api/v1/routes
[2024-11-15T10:30:00.000Z] [INFO] Available endpoints:
[2024-11-15T10:30:00.000Z] [INFO]   GET  /mcp/sse/token-metadata
[2024-11-15T10:30:00.000Z] [INFO]   POST /mcp/sse/routes
[2024-11-15T10:30:00.000Z] [INFO]   GET  /mcp/http/token-metadata
[2024-11-15T10:30:00.000Z] [INFO]   POST /mcp/http/routes
```

## Test Cases

### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-15T10:30:00.000Z"
}
```

---

### Test 2: Get Token Metadata List (HTTP)

```bash
curl "http://localhost:3000/mcp/http/token-metadata?limit=5&offset=0"
```

**Expected Response (Streaming):**
```json
{"type":"progress","tool":"getTokenMetadata","data":{"message":"Fetching token metadata..."}}
{"type":"result","tool":"getTokenMetadata","data":{"tokens":[...],"count":5}}
```

---

### Test 3: Get Token by ID (HTTP)

```bash
curl "http://localhost:3000/mcp/http/token-metadata?tokenId=stars"
```

**Expected Response:**
```json
{"type":"progress","tool":"getTokenMetadata","data":{"message":"Fetching token metadata..."}}
{"type":"result","tool":"getTokenMetadata","data":{"token":{...}}}
```

---

### Test 4: Search Tokens (HTTP)

```bash
curl "http://localhost:3000/mcp/http/token-metadata?search=STARS&limit=3"
```

---

### Test 5: Get Routes (HTTP)

```bash
curl -X POST http://localhost:3000/mcp/http/routes \
  -H "Content-Type: application/json" \
  -d '{
    "token_in": "stars",
    "token_out": "ntrn",
    "amount_in": "10000000000000000000000",
    "limit": 100
  }'
```

**Expected Response:**
```json
{"type":"progress","tool":"getRoutes","data":{"message":"Fetching routes..."}}
{"type":"result","tool":"getRoutes","data":{"routes":[...]}}
```

---

### Test 6: SSE Streaming (Browser/JavaScript)

Create an HTML file or use browser console:

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE Test</title>
</head>
<body>
    <h1>SSE Token Metadata Stream</h1>
    <pre id="output"></pre>
    
    <script>
        const output = document.getElementById('output');
        const eventSource = new EventSource('http://localhost:3000/mcp/sse/token-metadata?limit=5');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            output.textContent += JSON.stringify(data, null, 2) + '\n\n';
            
            // Close connection when result is received
            if (data.type === 'result') {
                eventSource.close();
                output.textContent += '--- Connection closed ---';
            }
        };
        
        eventSource.onerror = (error) => {
            output.textContent += 'Error: ' + JSON.stringify(error);
            eventSource.close();
        };
    </script>
</body>
</html>
```

---

### Test 7: SSE Routes (Using curl)

```bash
curl -X POST http://localhost:3000/mcp/sse/routes \
  -H "Content-Type: application/json" \
  -d '{
    "token_in": "stars",
    "token_out": "ntrn",
    "amount_in": "10000000000000000000000"
  }'
```

---

### Test 8: Error Handling - Invalid Parameters

```bash
# Missing required parameters
curl -X POST http://localhost:3000/mcp/http/routes \
  -H "Content-Type: application/json" \
  -d '{
    "token_in": "stars"
  }'
```

**Expected Response:**
```json
{"type":"error","tool":"getRoutes","error":{"code":"INVALID_PARAMS","message":"token_out is required and must be a string"}}
```

---

### Test 9: Error Handling - Invalid Token ID

```bash
curl "http://localhost:3000/mcp/http/token-metadata?tokenId=nonexistent"
```

**Expected Response:**
```json
{"type":"error","tool":"getTokenMetadata","error":{"code":"NOT_FOUND","message":"Token with ID nonexistent not found"}}
```

---

### Test 10: 404 Not Found

```bash
curl http://localhost:3000/invalid-endpoint
```

**Expected Response:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /invalid-endpoint not found"
  }
}
```

---

## Testing with Postman

### Import Collection

Create a Postman collection with these requests:

**Collection: Euclid MCP Server**

1. **Health Check**
   - Method: GET
   - URL: `http://localhost:3000/health`

2. **Get Token List**
   - Method: GET
   - URL: `http://localhost:3000/mcp/http/token-metadata`
   - Params: `limit=5`, `offset=0`

3. **Get Token by ID**
   - Method: GET
   - URL: `http://localhost:3000/mcp/http/token-metadata`
   - Params: `tokenId=stars`

4. **Get Routes**
   - Method: POST
   - URL: `http://localhost:3000/mcp/http/routes`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "token_in": "stars",
     "token_out": "ntrn",
     "amount_in": "10000000000000000000000",
     "limit": 100
   }
   ```

---

## Expected Logging Output

When you run a test, you should see logs like:

```
[2024-11-15T10:31:00.000Z] [INFO] GET /mcp/http/token-metadata {"query":{"limit":"5"}}
[2024-11-15T10:31:00.000Z] [INFO] HTTP request for token metadata {"limit":"5"}
[2024-11-15T10:31:00.000Z] [INFO] Executing getTokenMetadata tool {"limit":5}
[2024-11-15T10:31:00.000Z] [DEBUG] Fetching token metadatas {"limit":5}
[2024-11-15T10:31:01.234Z] [INFO] Fetched 5 token metadatas
```

---

## Debugging

### Enable Debug Logging

Add to your `.env` file:
```
DEBUG=true
```

This will show additional debug logs for API requests and responses.

### Check Server Logs

All errors are logged with full context:
```
[2024-11-15T10:31:00.000Z] [ERROR] Error fetching token metadatas {"message":"...","stack":"..."}
```

---

## Performance Testing

### Load Test with Apache Bench

```bash
# Test 100 requests with 10 concurrent connections
ab -n 100 -c 10 http://localhost:3000/health
```

### Streaming Performance

```bash
# Time a streaming request
time curl "http://localhost:3000/mcp/http/token-metadata?limit=10"
```

---

## Common Issues & Solutions

### Issue 1: Connection Refused
**Problem:** `curl: (7) Failed to connect`
**Solution:** Make sure the server is running on port 3000

### Issue 2: Empty Response
**Problem:** Response has no data
**Solution:** Check that `.env` file exists and has correct API endpoints

### Issue 3: GraphQL Errors
**Problem:** `Error fetching token metadatas`
**Solution:** Verify the GraphQL endpoint is accessible:
```bash
curl -X POST https://testnet.api.euclidprotocol.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### Issue 4: CORS Errors (Browser)
**Problem:** CORS policy blocking requests
**Solution:** The server already includes `Access-Control-Allow-Origin: *` headers

---

## Success Criteria

✅ Health check returns 200 OK
✅ Token list returns array of tokens
✅ Token by ID returns single token
✅ Routes returns swap routes
✅ Error responses are properly formatted
✅ Logs appear in console
✅ SSE streaming works in browser
✅ HTTP streaming returns newline-delimited JSON

---

## Next Steps After Testing

1. ✅ Verify all endpoints work correctly
2. ✅ Check logging output is comprehensive
3. ✅ Confirm error handling works as expected
4. ✅ Test with various parameter combinations
5. ✅ Verify MCP response format compliance
6. 🚀 Ready for production deployment!


