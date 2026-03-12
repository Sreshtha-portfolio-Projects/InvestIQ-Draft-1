# InvestIQ Backend

AI-powered stock research platform backend built with Node.js, Express, and TypeScript.

## Features

- **Authentication**: Secure user authentication with Supabase Auth and JWT
- **Stock Data**: Real-time stock quotes and historical data via Alpha Vantage
- **Market Data**: Market indices, top gainers/losers, trending stocks
- **AI Research Assistant**: AI-powered stock analysis using Google Gemini
- **Natural Language Screener**: Screen stocks using natural language queries
- **Earnings Analysis**: AI-powered earnings call transcript analysis
- **Watchlist**: Personal stock watchlist management

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **Market Data**: Alpha Vantage API

## Project Structure

```
backend/
├── src/
│   ├── ai/                    # AI services
│   │   ├── geminiService.ts
│   │   ├── researchAssistant.ts
│   │   ├── screenerInterpreter.ts
│   │   └── earningsAnalyzer.ts
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── db/                    # Database layer
│   │   ├── supabase.ts
│   │   ├── repositories.ts
│   │   └── schema.sql
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utilities
│   ├── config/                # Configuration
│   └── server.ts              # Entry point
├── package.json
└── tsconfig.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_secure_random_jwt_secret

# Alpha Vantage
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `src/db/schema.sql` in the Supabase SQL editor
3. The schema will create all necessary tables and policies

### 4. API Keys Setup

#### Alpha Vantage API Key
1. Visit [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Get a free API key
3. Add to `.env` as `ALPHA_VANTAGE_API_KEY`

#### Google Gemini API Key
1. Visit [ai.google.dev](https://ai.google.dev/)
2. Get an API key
3. Add to `.env` as `GEMINI_API_KEY`

### 5. Run the Server

Development mode with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (protected)

### Market Data
- `GET /api/market/dashboard` - Market overview
- `GET /api/market/indices` - Market indices
- `GET /api/market/gainers` - Top gainers
- `GET /api/market/losers` - Top losers
- `GET /api/market/trending` - Trending stocks

### Stocks
- `GET /api/stocks/search?q=ticker` - Search stocks
- `GET /api/stocks/:ticker/quote` - Get stock quote
- `GET /api/stocks/:ticker/overview` - Get company overview
- `GET /api/stocks/:ticker/chart` - Get chart data

### AI Research
- `POST /api/ai/analyze` - Analyze stock with AI
- `POST /api/ai/compare` - Compare two stocks
- `POST /api/ai/chat` - Chat with AI assistant

### Screener
- `POST /api/screener/screen` - Screen stocks
- `POST /api/screener/interpret` - Interpret natural language query

### Watchlist
- `GET /api/watchlist` - Get watchlist (protected)
- `POST /api/watchlist` - Add to watchlist (protected)
- `DELETE /api/watchlist/:ticker` - Remove from watchlist (protected)
- `GET /api/watchlist/:ticker/check` - Check if in watchlist (protected)

### Earnings
- `GET /api/earnings/:ticker` - Get earnings transcripts
- `POST /api/earnings` - Upload transcript (protected)
- `GET /api/earnings/:id/analyze` - Analyze transcript
- `GET /api/earnings/:id/summary` - Summarize transcript

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

API is rate limited to 100 requests per 15 minutes per IP address.

## Development

### Code Structure Guidelines

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **Middleware**: Request processing (auth, validation, error handling)
- **Types**: TypeScript interfaces and types

### Adding New Features

1. Define types in `src/types/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Define routes in `src/routes/`
5. Add route to `src/routes/index.ts`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure CORS with your frontend domain
4. Set up proper logging and monitoring
5. Use environment variables for all secrets
6. Enable SSL/HTTPS
7. Set up database backups
8. Configure rate limiting appropriately

## License

MIT
