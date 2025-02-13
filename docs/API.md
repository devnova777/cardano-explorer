# API Documentation

## Endpoints

### Get Latest Block

Retrieves the most recent block from the Cardano blockchain.

```
GET /api/block/latest
```

#### Response

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "height": number,
    "slot": number,
    "epoch": number,
    "epoch_slot": number,
    "slot_leader": "string",
    "size": number,
    "time": number,
    "tx_count": number,
    "output": "string",
    "fees": "string",
    "block_vrf": "string",
    "previous_block": "string",
    "next_block": "string",
    "confirmations": number
  }
}
```

#### Error Response

```json
{
  "status": "error",
  "message": "string",
  "stack": "string" // Only in development
}
```

### Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per IP
- Response when limit exceeded:

```json
{
  "error": "Too many requests, please try again later."
}
```

## Security

### Headers

The API uses Helmet middleware to set the following security headers:

- Content-Security-Policy
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

### CORS

Cross-Origin Resource Sharing is enabled with the following configuration:

- Allowed origins: All (in development)
- Methods: GET
- Headers: Content-Type, Accept

### Error Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 502  | Bad Gateway           |

## Frontend Integration

### Example Usage

```javascript
// Fetch latest block
async function getLatestBlock() {
  try {
    const response = await fetch('http://localhost:3001/api/block/latest');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching block:', error);
    throw error;
  }
}
```

## Development

### Environment Variables

Required environment variables:

```env
BLOCKFROST_API_KEY=your_api_key_here
NODE_ENV=development
```

### Local Development

1. Start the server:

```bash
npm run dev
```

2. The API will be available at:

```
http://localhost:3001
```

## Testing

To test the API endpoints:

```bash
# Get latest block
curl http://localhost:3001/api/block/latest | json_pp
```
