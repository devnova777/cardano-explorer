# Cardano Block Explorer

A lightweight, high-performance block explorer for the Cardano blockchain built with vanilla JavaScript and the Blockfrost API. This application provides real-time blockchain data visualization with robust security features and a clean, responsive interface.

## 🚀 Features

- **Real-time Block Information**

  - Latest block data auto-refresh
  - Detailed block information display
  - Transaction list viewing with pagination
  - Block navigation and search
  - Advanced transaction details with UTXO tracking
  - Address tracking and balance display

- **Performance Optimized**

  - Efficient DOM updates with modular renderers
  - Debounced search and event handlers
  - Optimized rendering cycles
  - BigInt support for precise calculations
  - Smart date formatting and validation
  - Responsive UI components

- **Security First**

  - Rate limiting protection
  - Secure headers (Helmet)
  - CORS protection
  - API key validation
  - Input validation and sanitization
  - Error handling and logging
  - Type checking and validation

- **Clean UI/UX**
  - Responsive design with mobile support
  - Enhanced loading states
  - Comprehensive error handling
  - Clear navigation with breadcrumbs
  - Smooth transitions
  - Copy-to-clipboard functionality
  - Warning/Error differentiation

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Blockfrost API key ([Get one here](https://blockfrost.io))

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/cardano-block-explorer.git
   cd cardano-block-explorer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file in the root directory:
   ```env
   BLOCKFROST_API_KEY=your_api_key_here
   NODE_ENV=development
   ```

## 🚀 Deployment Options

### Local Development

```bash
# Start the development server
npm run dev

# The application will be available at http://localhost:3001
```

### Production Deployment (Vercel)

The application is configured for serverless deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy using the provided `vercel.json` configuration

## 🏗️ Project Structure

```
cardano-block-explorer/
├── server/
│   ├── middleware/
│   │   ├── errorHandler.js    # Error handling and validation
│   │   └── asyncHandler.js    # Async operation wrapper
│   ├── services/
│   │   └── blockfrost/       # Blockfrost API integration
│   │       ├── blocks.js     # Block-related operations
│   │       ├── transactions.js # Transaction operations
│   │       ├── addresses.js   # Address operations
│   │       ├── search.js     # Search functionality
│   │       ├── utils.js      # Shared utilities
│   │       └── index.js      # Service exports
│   ├── utils/
│   │   ├── APIError.js       # Custom error handling
│   │   ├── responseFormatter.js # Response formatting
│   │   └── logger.js         # Logging utility
│   └── server.js             # Express server (development)
├── js/
│   ├── api.js               # API client
│   ├── utils.js             # Client utilities
│   ├── main.js              # Application entry
│   ├── details.js           # Details page logic
│   ├── transaction.js       # Transaction handling
│   ├── wallet.js            # Wallet functionality
│   └── renderers/           # UI components
├── css/
│   ├── modules/            # CSS modules
│   └── styles.css          # Main styles
├── pages/                  # Static pages
├── docs/                   # Documentation
├── vercel.json            # Vercel configuration
└── index.html             # Entry point
```

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes)
- HTTP security headers via Helmet
- CORS protection with environment config
- API key validation and security
- Comprehensive error handling
- Input validation and sanitization
- Production error sanitization
- Secure number handling with BigInt

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Security Guidelines](docs/SECURITY.md)

## 🧪 Testing

Test the API endpoints:

```bash
# Get latest block
curl http://localhost:3001/api/blocks/latest | json_pp

# Get specific block
curl http://localhost:3001/api/blocks/{block_hash} | json_pp

# Get block transactions
curl http://localhost:3001/api/blocks/{block_hash}/transactions | json_pp

# Get transaction details
curl http://localhost:3001/api/tx/{tx_hash} | json_pp

# Search
curl http://localhost:3001/api/blocks/search?q={query} | json_pp
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Follow code style guidelines:
   - Use meaningful variable names
   - Add JSDoc comments
   - Follow type checking practices
   - Update documentation
   - Test thoroughly
4. Submit a pull request

## 📧 Contact

James Barlay - jamesqbarclay@gmail.com

## 🗺️ Roadmap

- [x] Advanced transaction details
- [x] Address tracking
- [x] Search functionality
- [ ] Asset information display
- [ ] Stake pool integration
- [ ] WebSocket updates
- [ ] Caching layer
- [ ] TypeScript migration
