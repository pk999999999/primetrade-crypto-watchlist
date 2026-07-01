import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrimeTrade Crypto Watchlist API',
      version: '1.0.0',
      description: `
## Overview
A scalable REST API for managing crypto watchlists with JWT authentication and role-based access control.

### Features
- 🔐 **JWT Authentication** - Secure token-based auth with bcrypt password hashing
- 👥 **Role-Based Access** - User and Admin roles with granular permissions
- 📋 **CRUD Operations** - Full watchlist management (Create, Read, Update, Delete)
- ✅ **Input Validation** - Comprehensive request validation and sanitization
- 📊 **API Versioning** - Versioned endpoints under /api/v1/

### Default Admin Credentials
- **Email:** admin@primetrade.ai
- **Password:** Admin@123

### Authentication
All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`
      `,
      contact: {
        name: 'PrimeTrade.ai',
        url: 'https://primetrade.ai'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User registration, login, and profile management'
      },
      {
        name: 'Watchlist',
        description: 'Crypto watchlist CRUD operations'
      }
    ]
  },
  apis: ['./src/routes/v1/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
