# API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.vercel.app/api
```

## Endpoints

### Blocks

#### Get Latest Block

```
GET /blocks/latest
```

Response:

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "height": "number",
    "slot": "number",
    "epoch": "number",
    "epoch_slot": "number",
    "slot_leader": "string",
    "size": "number",
    "time": "number",
    "tx_count": "number",
    "output": "string",
    "fees": "string",
    "block_vrf": "string",
    "previous_block": "string",
    "next_block": "string",
    "confirmations": "number"
  }
}
```

#### Get Block Details

```
GET /blocks/:hash
```

Parameters:

- `hash`: Block hash (64 characters)

Response: Same as latest block

#### Get Block by Height

```
GET /blocks/height/:height
```

Parameters:

- `height`: Block height (number)

Response:

```json
{
  "success": true,
  "data": ["block_hash"]
}
```

#### Get Block Transactions

```
GET /blocks/:hash/transactions
```

Parameters:

- `hash`: Block hash (64 characters)

Response:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "hash": "string",
        "block": "string",
        "block_time": "number",
        "inputs": "number",
        "outputs": "number",
        "input_amount": "string",
        "output_amount": "string",
        "fees": "string"
      }
    ]
  }
}
```

### Transactions

#### Get Transaction Details

```
GET /tx/:hash
```

Parameters:

- `hash`: Transaction hash (64 characters)

Response:

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "block_hash": "string",
    "block_height": "number",
    "block_time": "number",
    "slot": "number",
    "index": "number",
    "output_amount": "string",
    "input_amount": "string",
    "fees": "string",
    "deposit": "string",
    "size": "number",
    "invalid_before": "string",
    "invalid_hereafter": "string",
    "utxos": {
      "inputs": [
        {
          "tx_hash": "string",
          "output_index": "number",
          "amount": "string",
          "address": "string"
        }
      ],
      "outputs": [
        {
          "address": "string",
          "amount": "string",
          "assets": [
            {
              "unit": "string",
              "quantity": "string"
            }
          ]
        }
      ]
    }
  }
}
```

### Search

#### Global Search

```
GET /blocks/search?q=:query
```

Parameters:

- `q`: Search query (min 3 characters)

Response:

```json
{
  "success": true,
  "data": {
    "type": "string", // "block", "transaction", "address", "stake_address", "pool"
    "result": {
      // Varies based on type
    }
  }
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "status": "number"
}
```

Common error codes:

- 400: Bad Request (invalid input)
- 403: Forbidden (invalid API key)
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Client Utilities

### API Client

```javascript
import {
  getLatestBlock,
  getBlockDetails,
  getBlockTransactions,
  getTransactionDetails,
  search,
} from './api.js';

// Get latest block
const latestBlock = await getLatestBlock();

// Get block details
const block = await getBlockDetails(hashOrHeight);

// Get block transactions
const transactions = await getBlockTransactions(blockHash);

// Get transaction details
const transaction = await getTransactionDetails(txHash);

// Search
const results = await search(query);
```

### Response Formatting

```javascript
import { formatSuccess, formatError } from './utils/responseFormatter.js';

// Success response
const success = formatSuccess(data);

// Error response
const error = formatError(new Error('Not found'));

// Paginated response
const paginated = formatPagination(data, {
  currentPage: 1,
  totalPages: 10,
  hasNext: true,
  hasPrevious: false,
  totalItems: 100,
});
```

### Error Handling

```javascript
import { APIError } from './utils/APIError.js';
import { logger } from './utils/logger.js';

try {
  // API operations
} catch (error) {
  logger.error('Operation failed', { error });
  throw new APIError(error.message, error.status);
}
```

## Rate Limiting

- Limit: 100 requests per 15 minutes
- Headers:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time until reset

## Security

- All endpoints require HTTPS in production
- API key required for Blockfrost operations
- Input validation on all parameters
- Rate limiting protection
- CORS protection
- Security headers via Helmet
