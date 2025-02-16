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
- `page`: Page number (optional, default: 1)
- `limit`: Items per page (optional, default: 20)

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
    ],
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrevious": boolean
    }
  }
}
```

### Get Address Details

Retrieves details about a specific address.

```
GET /address/:address
```

#### Parameters

- `address`: The Cardano address

#### Response

```json
{
  "success": true,
  "data": {
    "address": "string",
    "balance": "string",
    "stake_address": "string",
    "utxos": [
      {
        "tx_hash": "string",
        "output_index": number,
        "amount": "string",
        "assets": [
          {
            "unit": "string",
            "quantity": "string"
          }
        ]
      }
    ],
    "transactions": [
      {
        "tx_hash": "string",
        "block_height": number,
        "block_time": number
      }
    ]
  }
}
```

## Utility Functions

### Currency Utilities

```javascript
// Convert Lovelace to ADA
const ada = formatAda('5000000'); // "5.000000"

// Convert ADA to Lovelace
const lovelace = adaToLovelace('5.5'); // "5500000"

// Format number with options
const formatted = formatNumber('1234.5678', {
  decimals: 2,
  trimZeros: true,
}); // "1,234.57"

// Validate ADA amount
const isValid = isValidAdaAmount('5.123456'); // true
```

### Date Utilities

```javascript
// Format date
const date = formatDate(1645564800); // "Feb 23, 2022, 12:00:00 AM"

// Get relative time
const relative = getRelativeTime(1645564800); // "2 years ago"

// Format short date
const shortDate = formatShortDate(1645564800); // "2022-02-23"

// Check if within time range
const isRecent = isWithinRange(1645564800, {
  value: 24,
  unit: 'hours',
}); // false
```

### DOM Utilities

```javascript
// Get element safely
const element = getElement('my-id');

// Add event listener
addSafeEventListener(element, 'click', () => {});

// Remove event listener
removeSafeEventListener(element, 'click', handler);

// Create element
const div = createElement(
  'div',
  {
    className: 'my-class',
    dataset: { id: '123' },
  },
  'Content'
);
```

### UI Utilities

```javascript
// Display error
displayError('Failed to load', 'error-container', {
  isWarning: true,
  autoHide: 3000,
});

// Display loading
displayLoading('content-container', {
  message: 'Loading blocks...',
  showSpinner: true,
});

// Clear content
clearContent('container-id');

// Toggle visibility
toggleVisibility('element-id', true);
```

## Error Handling

### Standard Error Format

```json
{
  "status": "error",
  "message": "string",
  "type": "string",
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
| 404  | Not Found             |
| 408  | Request Timeout       |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 502  | Bad Gateway           |

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per IP
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining
- Response when limit exceeded:

```json
{
  "status": "error",
  "message": "Too many requests, please try again later.",
  "type": "rate_limit_exceeded"
}
```

## Security Headers

All endpoints are protected with:

- Content-Security-Policy
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy
- Strict-Transport-Security (in production)

## CORS

Cross-Origin Resource Sharing is configured with:

- Allowed origins: Configurable per environment
- Methods: GET
- Headers: Content-Type, Accept
- Credentials: false

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

# Get block transactions with pagination
curl http://localhost:3001/api/block/{block_hash}/transactions?page=1&limit=20

# Get address details
curl http://localhost:3001/api/address/{address}
```
