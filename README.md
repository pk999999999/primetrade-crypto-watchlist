# PrimeTrade.ai – Crypto Watchlist & Signals API

A scalable REST API with JWT authentication, role-based access control, and a fully integrated frontend for managing cryptocurrency watchlists.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-lightblue)
![License](https://img.shields.io/badge/License-ISC-yellow)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/primetrade-crypto-watchlist.git
cd primetrade-crypto-watchlist

# 2. Install dependencies
cd backend
npm install

# 3. Configure environment (optional - defaults work out of the box)
cp .env.example .env

# 4. Start the server
npm start
```

### Access the Application

| Service | URL |
|---------|-----|
| 🌐 **Frontend** | http://localhost:3000 |
| 📚 **API Docs (Swagger)** | http://localhost:3000/api-docs |
| 💚 **Health Check** | http://localhost:3000/api/health |

### Default Admin Credentials
- **Email:** `admin@primetrade.ai`
- **Password:** `Admin@123`

---

## 📐 Architecture

```
primetrade.ai/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entry point
│   │   ├── config/
│   │   │   └── db.js              # SQLite connection & schema
│   │   ├── controllers/
│   │   │   ├── auth.controller.js # Auth business logic
│   │   │   └── watchlist.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── rbac.js            # Role-based access control
│   │   │   ├── validate.js        # Input validation
│   │   │   └── errorHandler.js    # Global error handling
│   │   ├── models/
│   │   │   ├── user.model.js      # User DB operations
│   │   │   └── watchlist.model.js # Watchlist DB operations
│   │   ├── routes/v1/
│   │   │   ├── auth.routes.js     # Auth endpoints
│   │   │   └── watchlist.routes.js# CRUD endpoints
│   │   └── utils/
│   │       └── swagger.js         # OpenAPI config
│   ├── data/                      # SQLite database (auto-created)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── index.html                 # SPA entry
│   ├── css/style.css              # Dark theme styles
│   └── js/
│       ├── api.js                 # API client with JWT
│       ├── app.js                 # Router
│       ├── auth.js                # Auth UI logic
│       └── dashboard.js           # CRUD dashboard
├── README.md
└── SCALABILITY.md
```

---

## 🔌 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ❌ | Create new user account |
| `POST` | `/login` | ❌ | Login & receive JWT token |
| `GET` | `/me` | 🔒 | Get current user profile |
| `GET` | `/users` | 🔒 Admin | List all users |

### Watchlist (`/api/v1/watchlist`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | 🔒 | List watchlist items |
| `GET` | `/stats` | 🔒 | Get watchlist statistics |
| `GET` | `/:id` | 🔒 | Get single item |
| `POST` | `/` | 🔒 | Add item to watchlist |
| `PUT` | `/:id` | 🔒 | Update watchlist item |
| `DELETE` | `/:id` | 🔒 | Remove from watchlist |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api-docs` | Swagger UI |
| `GET` | `/api-docs.json` | OpenAPI JSON spec |

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 12 salt rounds |
| **JWT Authentication** | Tokens with configurable expiry |
| **Role-Based Access** | `user` and `admin` roles with middleware |
| **Input Validation** | express-validator on all inputs |
| **Input Sanitization** | HTML escaping, email normalization |
| **Rate Limiting** | 100 req/15min general, 20 req/15min auth |
| **Security Headers** | Helmet.js (XSS, HSTS, etc.) |
| **CORS** | Configurable cross-origin policy |
| **Body Size Limit** | 10KB max JSON payload |

---

## 🗃️ Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist Items Table
CREATE TABLE watchlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  target_price REAL,
  notes TEXT DEFAULT '',
  alert_type TEXT DEFAULT 'above' CHECK(alert_type IN ('above', 'below')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🧪 Testing the API

### Using Swagger UI
Visit `http://localhost:3000/api-docs` for interactive API documentation. You can test all endpoints directly from the browser.

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@primetrade.ai","password":"Admin@123"}'

# Add to watchlist (replace TOKEN)
curl -X POST http://localhost:3000/api/v1/watchlist \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"symbol":"BTC","name":"Bitcoin","targetPrice":100000,"alertType":"above"}'
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | (set in .env) | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiry duration |
| `DB_PATH` | `./data/database.sqlite` | SQLite database path |
| `ADMIN_EMAIL` | `admin@primetrade.ai` | Default admin email |
| `ADMIN_PASSWORD` | `Admin@123` | Default admin password |

---

## 📖 Further Reading

See [SCALABILITY.md](./SCALABILITY.md) for notes on scaling this application for production including:
- PostgreSQL migration
- Redis caching
- Microservices architecture
- Docker deployment
- Load balancing strategies
