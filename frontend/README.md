# InvestIQ Frontend

AI-powered stock research platform frontend built with Next.js, TypeScript, and TailwindCSS.

## Features

- **Market Dashboard**: Real-time market indices, top gainers/losers, trending stocks
- **Stock Search**: Fast autocomplete search with instant results
- **Company Pages**: Detailed stock information with AI-powered insights
- **AI Research Assistant**: Ask questions about stocks and get AI-generated analysis
- **Natural Language Screener**: Screen stocks using plain English queries
- **Watchlist**: Personal stock tracking
- **Authentication**: Secure user authentication

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Market dashboard page
│   ├── stocks/[ticker]/     # Stock detail page
│   ├── screener/            # Stock screener page
│   ├── watchlist/           # Watchlist page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── layout/
│   │   └── Header.tsx
│   ├── SearchBar.tsx
│   ├── StockCard.tsx
│   ├── LoadingSpinner.tsx
│   └── Providers.tsx
├── services/                # API service layer
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── stockService.ts
│   ├── marketService.ts
│   ├── aiService.ts
│   ├── screenerService.ts
│   ├── watchlistService.ts
│   └── earningsService.ts
├── store/                   # State management
│   └── authStore.ts
├── types/                   # TypeScript types
│   └── index.ts
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.mjs
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, update with your backend API URL.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Pages

### Homepage (`/`)
- Landing page with feature highlights
- Call-to-action buttons
- Product overview

### Dashboard (`/dashboard`)
- Market indices (NIFTY, SENSEX)
- Top gainers/losers
- Most active stocks
- Stock search bar

### Stock Detail (`/stocks/[ticker]`)
- Real-time stock quote
- Financial metrics (P/E, EPS, ROE, etc.)
- AI-powered analysis
- Add to watchlist functionality

### Screener (`/screener`)
- Natural language stock screening
- Example queries
- Results table with filtering

### Watchlist (`/watchlist`)
- Personal stock watchlist
- Real-time price updates
- Quick access to stock details

### Authentication (`/login`, `/signup`)
- User login and registration
- JWT token management
- Protected route handling

## Components

### Header
- Navigation menu
- User authentication status
- Logout functionality

### SearchBar
- Autocomplete stock search
- Debounced API calls
- Keyboard navigation

### StockCard
- Reusable stock display component
- Price and change visualization
- Click-through to stock details

### LoadingSpinner
- Loading state indicator
- Multiple sizes

## Services

All API calls are centralized in the services layer:

- **apiClient**: Axios configuration with interceptors
- **authService**: Authentication operations
- **stockService**: Stock data fetching
- **marketService**: Market data operations
- **aiService**: AI analysis requests
- **screenerService**: Stock screening
- **watchlistService**: Watchlist management
- **earningsService**: Earnings transcript operations

## State Management

Using Zustand for global state:

- **authStore**: User authentication state
  - `user`: Current user object
  - `token`: JWT token
  - `isAuthenticated`: Boolean flag
  - `login()`: Login function
  - `signup()`: Signup function
  - `logout()`: Logout function

## Styling

TailwindCSS with custom configuration:

### Custom Colors
- `primary`: Main brand color (blue)
- `success`: Green for positive changes
- `danger`: Red for negative changes

### Custom Components
- `.btn`: Base button styles
- `.btn-primary`: Primary button
- `.btn-secondary`: Secondary button
- `.card`: Card container
- `.input`: Form input
- `.label`: Form label

## API Integration

All API calls use React Query for:
- Automatic caching
- Background refetching
- Loading/error states
- Optimistic updates

Example:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['stock', ticker],
  queryFn: () => stockService.getQuote(ticker),
});
```

## Authentication Flow

1. User enters credentials on `/login` or `/signup`
2. Service calls backend API
3. JWT token stored in localStorage
4. Token attached to subsequent API requests
5. Protected routes check authentication status
6. Automatic redirect to login if unauthenticated

## Protected Routes

Routes that require authentication:
- `/watchlist` - Personal watchlist management
- Watchlist add/remove actions on stock pages

## Error Handling

- Toast notifications for user feedback
- API errors intercepted and displayed
- 401 errors trigger automatic logout
- Graceful fallbacks for loading states

## Performance Optimizations

- React Query caching
- Code splitting with Next.js
- Lazy loading of components
- Debounced search inputs
- Optimized images

## Development Tips

### Adding a New Page
1. Create page file in `app/[page-name]/page.tsx`
2. Add navigation link in `Header.tsx`
3. Create any required services in `services/`

### Adding a New API Endpoint
1. Add method to appropriate service file
2. Define TypeScript types in `types/index.ts`
3. Use React Query in component

### Styling Guidelines
- Use TailwindCSS utility classes
- Follow existing component patterns
- Use custom CSS classes for repeated patterns
- Keep responsive design in mind

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Other Platforms
1. Build the app: `npm run build`
2. Start server: `npm start`
3. Set environment variables
4. Configure custom domain

### Environment Variables
Production environment variables:
```env
NEXT_PUBLIC_API_URL=https://api.investiq.com/api
```

## Troubleshooting

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running
- Check CORS configuration

### Authentication Issues
- Clear localStorage and cookies
- Check JWT token expiration
- Verify backend authentication endpoints

### Build Errors
- Delete `.next` folder and rebuild
- Clear node_modules and reinstall
- Check TypeScript errors

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
