# API Documentation

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### Get Latest Block

Retrieves the most recent block from the Cardano blockchain.

```
GET /block/latest
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

### Get Block Details

Retrieves detailed information about a specific block.

```
GET /block/:hash
```

#### Parameters

- `hash`: The block hash (64 characters)

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

### Get Block Transactions

Retrieves transactions for a specific block.

```
GET /block/:hash/transactions
```

#### Parameters

- `hash`: The block hash (64 characters)

#### Response

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "string",
        "block_time": number,
        "inputs": number,
        "outputs": number,
        "input_amount": "string",
        "output_amount": "string",
        "fees": "string"
      }
    ]
  }
}
```

### Get Block List

Retrieves a paginated list of blocks.

```
GET /blocks
```

#### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### Response

```json
{
  "success": true,
  "data": {
    "blocks": [
      {
        "hash": "string",
        "height": number,
        "time": number
      }
    ],
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrevious": boolean,
      "totalBlocks": number
    }
  }
}
```

## Error Responses

### Standard Error Format

```json
{
  "status": "error",
  "message": "string",
  "stack": "string" // Only in development
}
```

### Status Codes

| Code | Description           |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 502  | Bad Gateway           |

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per IP
- Response when limit exceeded:

```json
{
  "error": "Too many requests, please try again later."
}
```

## Security Headers

All endpoints are protected with the following security headers:

- Content-Security-Policy
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## CORS

Cross-Origin Resource Sharing is configured with:

- Allowed origins: All (in development)
- Methods: GET
- Headers: Content-Type, Accept

## Example Usage

### JavaScript Fetch

```javascript
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

### cURL

```bash
# Get latest block
curl http://localhost:3001/api/block/latest

# Get specific block
curl http://localhost:3001/api/block/{block_hash}

# Get block transactions
curl http://localhost:3001/api/block/{block_hash}/transactions

# Get block list
curl http://localhost:3001/api/blocks?page=1&limit=10
```
