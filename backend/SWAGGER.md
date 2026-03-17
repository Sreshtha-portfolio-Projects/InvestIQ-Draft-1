# InvestIQ API Documentation (Swagger)

## Overview

The InvestIQ backend now includes comprehensive API documentation using Swagger/OpenAPI 3.0. This provides an interactive interface to explore, test, and understand all available API endpoints.

## Access the Documentation

**Local Development:**
```
http://localhost:4000/api-docs
```

**Production:**
```
https://api.investiq.example.com/api-docs
```

## Features

### 📚 Complete API Coverage

The Swagger documentation includes all API endpoints organized into categories:

- **Authentication** - User signup, signin, signout, and profile management
- **Stocks** - Market data, stock search, and detailed stock information
- **Watchlist** - User watchlist management
- **AI** - Research assistant, stock screener, and earnings analysis
- **Health** - API health checks and status

### 🔐 Authentication Testing

- Built-in authorization support for Bearer tokens
- Click the "Authorize" button at the top to add your JWT token
- All protected endpoints will automatically use your token

### 📝 Interactive Testing

- Try out endpoints directly from the documentation
- See example request/response payloads
- View detailed parameter descriptions
- Test with custom values

### 📊 Schema Definitions

Comprehensive schema documentation for:
- Error responses
- User objects
- Stock quotes
- Watchlist items
- AI research responses
- Screener results

## How to Use

### 1. Explore Endpoints

Browse through the categorized endpoints. Each endpoint shows:
- HTTP method (GET, POST, DELETE, etc.)
- Endpoint path
- Description
- Parameters (query, path, body)
- Response codes and schemas
- Example requests and responses

### 2. Test Endpoints

#### For Public Endpoints (No Auth Required):

1. Click on an endpoint to expand it
2. Click "Try it out"
3. Fill in required parameters
4. Click "Execute"
5. View the response

#### For Protected Endpoints (Auth Required):

1. First, sign in via `/api/auth/signin` or use an existing token
2. Click the "Authorize" button at the top
3. Enter your Bearer token in the format: `your-jwt-token-here`
4. Click "Authorize"
5. Now you can test protected endpoints

### 3. Example Workflows

#### Signup and Get Profile

1. Expand `POST /api/auth/signup`
2. Click "Try it out"
3. Modify the example request body with your email/password
4. Click "Execute"
5. Copy the JWT token from the response
6. Click "Authorize" and paste the token
7. Test `GET /api/auth/me` to see your profile

#### Search and Add to Watchlist

1. Authorize with your JWT token
2. Use `GET /api/stocks/search?q=TCS` to search for stocks
3. Note the `companyId` from the response
4. Use `POST /api/watchlist` with the `companyId` to add to watchlist
5. Use `GET /api/watchlist` to view your watchlist

#### AI Stock Screening

1. Expand `POST /api/ai/screen`
2. Click "Try it out"
3. Enter a natural language query like:
   ```json
   {
     "query": "Find technology stocks with PE ratio less than 20 and market cap above 100 billion"
   }
   ```
4. Click "Execute"
5. View the AI-generated screener results

## Implementation Details

### Files Modified/Created

1. **`src/config/swagger.ts`** - Swagger configuration with OpenAPI 3.0 spec
2. **`src/index.ts`** - Added Swagger UI middleware
3. **`src/routes/*.ts`** - Added JSDoc comments for endpoint documentation

### Packages Installed

```json
{
  "dependencies": {
    "swagger-ui-express": "^latest",
    "swagger-jsdoc": "^latest"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^latest",
    "@types/swagger-jsdoc": "^latest"
  }
}
```

### Customizations

- Removed default Swagger topbar for cleaner UI
- Disabled Content Security Policy for Swagger UI
- Custom site title: "InvestIQ API Docs"
- Dark theme for better developer experience

## Rate Limiting

Note that AI endpoints have rate limiting:
- **AI Endpoints**: 10 requests per minute
- **Global**: 200 requests per 15 minutes

The Swagger UI will show the appropriate error messages when rate limits are exceeded.

## Server Selection

Use the server dropdown at the top to switch between:
- Development server (`http://localhost:4000`)
- Production server (`https://api.investiq.example.com`)

All API calls will be sent to the selected server.

## Best Practices

1. **Always test in development first** before moving to production
2. **Use the "Try it out" feature** to validate request payloads
3. **Check response schemas** to understand the data structure
4. **Read parameter descriptions** carefully for validation rules
5. **Handle rate limiting** gracefully in your client applications

## Troubleshooting

### "Unauthorized" Errors

- Ensure you've clicked "Authorize" and entered a valid JWT token
- Tokens expire after a certain period - sign in again to get a new one
- Check that the token doesn't have extra spaces or quotes

### CORS Errors

- The backend is configured to accept requests from `http://localhost:3000`
- If testing from a different origin, you may need to update CORS settings in `src/index.ts`

### Rate Limit Errors

- Wait for the rate limit window to reset
- For AI endpoints, space out your requests
- Consider implementing request queuing in your client

## Future Enhancements

- [ ] Add API key authentication option
- [ ] Include more detailed examples for complex endpoints
- [ ] Add response time metrics
- [ ] Create Postman collection export
- [ ] Add API versioning
- [ ] Include WebSocket documentation (if implemented)

## Support

For issues or questions about the API:
- Check the Swagger documentation first
- Review the response error messages
- Check the backend logs for detailed error information
- Contact the InvestIQ team

---

**Last Updated:** March 17, 2026
**API Version:** 1.0.0
**OpenAPI Version:** 3.0.0
