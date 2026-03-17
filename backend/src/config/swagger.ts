import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InvestIQ API Documentation',
      version: '1.0.0',
      description: 'AI-powered stock research platform API with intelligent screening, research assistant, and earnings analysis',
      contact: {
        name: 'InvestIQ Team',
        url: 'https://investiq.example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.investiq.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Supabase JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'An error occurred',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            fullName: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        StockQuote: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
              example: 'NSE:TCS',
            },
            name: {
              type: 'string',
              example: 'Tata Consultancy Services',
            },
            price: {
              type: 'number',
              example: 3450.50,
            },
            change: {
              type: 'number',
              example: 25.30,
            },
            changePercent: {
              type: 'number',
              example: 0.74,
            },
            volume: {
              type: 'number',
              example: 1234567,
            },
            marketCap: {
              type: 'number',
              example: 12500000000,
            },
          },
        },
        WatchlistItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            companyId: {
              type: 'string',
              format: 'uuid',
            },
            ticker: {
              type: 'string',
              example: 'NSE:INFY',
            },
            companyName: {
              type: 'string',
              example: 'Infosys Limited',
            },
            addedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AIResearchResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            data: {
              type: 'object',
              properties: {
                answer: {
                  type: 'string',
                },
                sources: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                confidence: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1,
                },
              },
            },
          },
        },
        ScreenerResult: {
          type: 'object',
          properties: {
            ticker: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            sector: {
              type: 'string',
            },
            marketCap: {
              type: 'number',
            },
            pe: {
              type: 'number',
            },
            dividend: {
              type: 'number',
            },
            score: {
              type: 'number',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Stocks',
        description: 'Stock market data and company information',
      },
      {
        name: 'Watchlist',
        description: 'User watchlist management',
      },
      {
        name: 'AI',
        description: 'AI-powered research, screening, and analysis',
      },
      {
        name: 'Health',
        description: 'API health and status endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
