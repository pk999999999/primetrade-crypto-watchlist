import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import database initialization
import { initializeDatabase } from './config/db.js';

// Import routes
import authRoutes from './routes/v1/auth.routes.js';
import watchlistRoutes from './routes/v1/watchlist.routes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import swagger config
import swaggerSpec from './utils/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════
// Security Middleware
// ═══════════════════════════════════════
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for Swagger UI
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit for auth endpoints
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

app.use('/api/', limiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// ═══════════════════════════════════════
// Body Parsing & Logging
// ═══════════════════════════════════════
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ═══════════════════════════════════════
// Static Files (Frontend)
// ═══════════════════════════════════════
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// ═══════════════════════════════════════
// API Documentation (Swagger)
// ═══════════════════════════════════════
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PrimeTrade API Docs',
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Serve swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ═══════════════════════════════════════
// API Routes (Versioned)
// ═══════════════════════════════════════
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);

// ═══════════════════════════════════════
// Health Check
// ═══════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PrimeTrade Crypto Watchlist API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      docs: '/api-docs',
      auth: '/api/v1/auth',
      watchlist: '/api/v1/watchlist'
    }
  });
});

// ═══════════════════════════════════════
// Frontend Fallback (SPA)
// ═══════════════════════════════════════
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ═══════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════
// Start Server
// ═══════════════════════════════════════
try {
  initializeDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🚀 PrimeTrade Crypto Watchlist API          ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Server:    http://localhost:${PORT}               ║`);
    console.log(`║  API Docs:  http://localhost:${PORT}/api-docs      ║`);
    console.log(`║  Health:    http://localhost:${PORT}/api/health     ║`);
    console.log(`║  Frontend:  http://localhost:${PORT}               ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║  Admin:     admin@primetrade.ai / Admin@123     ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

export default app;
