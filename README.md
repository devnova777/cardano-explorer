# Cardano Block Explorer

A lightweight block explorer for the Cardano blockchain using the Blockfrost API.

## Features

- Real-time block information display
- Auto-refresh functionality
- Rate limiting and security features
- Error handling and logging
- Clean, responsive UI

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Blockfrost API key ([Get one here](https://blockfrost.io))

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cardano-block-explorer.git
cd cardano-block-explorer
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
BLOCKFROST_API_KEY=your_api_key_here
NODE_ENV=development
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Project Structure

```
├── server/
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── asyncHandler.js
│   ├── utils/
│   │   └── APIError.js
│   └── server.js
├── js/
│   ├── api.js
│   ├── ui.js
│   └── main.js
├── css/
│   └── styles.css
├── docs/
│   ├── ARCHITECTURE.md
│   └── API.md
├── index.html
├── package.json
└── README.md
```

## Security Features

- Rate limiting (100 requests per 15 minutes)
- HTTP security headers (Helmet)
- CORS protection
- API key validation
- Error handling middleware

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Architecture Overview

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture information.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.
