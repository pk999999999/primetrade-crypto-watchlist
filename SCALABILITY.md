# Scalability & Deployment Notes

This document outlines how the PrimeTrade Crypto Watchlist API can be scaled from its current single-server architecture to a production-grade distributed system.

---

## 1. Database: SQLite → PostgreSQL

**Current**: SQLite (single-file, zero-config) for rapid development and portability.

**Production Migration**:
- Migrate to **PostgreSQL** for concurrent read/write support, advanced querying, and full ACID compliance at scale.
- Use an ORM like **Prisma** or **Knex.js** for database-agnostic migrations.
- The current schema is fully compatible with PostgreSQL – no structural changes needed.
- Enable **connection pooling** via `pg-pool` or a managed service like **Supabase** / **AWS RDS**.

```
SQLite (Dev)  →  PostgreSQL (Staging/Prod)
                    ├── Connection pooling (pg-pool)
                    ├── Read replicas for analytics
                    └── Automated backups
```

---

## 2. Caching: Redis

**Implementation Strategy**:
- Add **Redis** as a caching layer for frequently accessed, read-heavy endpoints.
- Cache the watchlist items per user with a TTL (e.g., 60 seconds).
- Invalidate cache on any write operation (POST, PUT, DELETE).

**Candidate Endpoints for Caching**:
| Endpoint | Cache TTL | Invalidation |
|----------|-----------|-------------|
| `GET /watchlist` | 60s | On any watchlist mutation |
| `GET /watchlist/stats` | 120s | On any watchlist mutation |
| `GET /auth/me` | 300s | On profile update |

**Example Implementation**:
```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache middleware
async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.user.id}:${req.originalUrl}`;
  const cached = await redis.get(key);
  if (cached) return res.json(JSON.parse(cached));
  
  res.sendResponse = res.json;
  res.json = (body) => {
    redis.setex(key, 60, JSON.stringify(body));
    res.sendResponse(body);
  };
  next();
}
```

---

## 3. Microservices Architecture

As the platform grows, decompose the monolith into independent services:

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  API Gateway │────▶│  Auth Service     │     │  Watchlist       │
│  (Nginx/Kong)│     │  (JWT, Users)     │     │  Service (CRUD)  │
│              │────▶│                   │     │                  │
└──────────────┘     └──────────────────┘     └──────────────────┘
       │                                              │
       │             ┌──────────────────┐             │
       └────────────▶│  Notification    │◀────────────┘
                     │  Service (Alerts)│
                     └──────────────────┘
```

**Service Boundaries**:
- **Auth Service**: User registration, login, JWT issuance, password management.
- **Watchlist Service**: CRUD operations, user watchlists, admin views.
- **Notification Service**: Price alerts, email notifications, WebSocket push.
- **API Gateway**: Request routing, rate limiting, authentication proxy.

**Communication**: REST for synchronous calls, **RabbitMQ/Kafka** for async events (e.g., "price alert triggered").

---

## 4. Docker Deployment

**Containerization** enables consistent deployments across all environments.

### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src
COPY frontend ../frontend

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### Docker Compose (Full Stack)
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_PATH=/data/database.sqlite
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - db-data:/data
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  db-data:
```

---

## 5. Load Balancing & Horizontal Scaling

```
                  ┌─────────────┐
                  │  Load       │
   Client ──────▶│  Balancer   │
                  │  (Nginx)    │
                  └──────┬──────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
     ┌──────▼──┐  ┌──────▼──┐  ┌─────▼───┐
     │ API #1  │  │ API #2  │  │ API #3  │
     │ :3001   │  │ :3002   │  │ :3003   │
     └─────────┘  └─────────┘  └─────────┘
            │            │            │
            └────────────┼────────────┘
                         │
                  ┌──────▼──────┐
                  │ PostgreSQL  │
                  │ + Redis     │
                  └─────────────┘
```

**Strategies**:
- **Horizontal scaling**: Run multiple API instances behind Nginx or AWS ALB.
- **Session management**: JWT tokens are stateless – no sticky sessions needed.
- **Database connection pooling**: Use `pg-pool` with a max of `N / instances` connections.
- **Health checks**: The `/api/health` endpoint is already implemented for load balancer probes.

---

## 6. Additional Production Considerations

| Area | Recommendation |
|------|---------------|
| **Logging** | Structured logging with Winston/Pino → ELK stack |
| **Monitoring** | Prometheus + Grafana for metrics, uptime, latency |
| **CI/CD** | GitHub Actions for automated testing and deployment |
| **Security** | HTTPS via Let's Encrypt, environment-based secrets, JWT refresh tokens |
| **API Versioning** | Already implemented (`/api/v1/`). Future versions at `/api/v2/` |
| **Testing** | Jest + Supertest for unit/integration tests |
| **Documentation** | Swagger (already implemented) + Postman collection export |

---

## Summary

This project is designed with a **modular, layered architecture** that makes scaling straightforward:

1. ✅ **MVC Pattern** – Clean separation of concerns
2. ✅ **Versioned APIs** – `/api/v1/` ready for future versions
3. ✅ **Stateless Auth** – JWT tokens require no server-side sessions
4. ✅ **Environment Config** – All secrets and config via `.env`
5. ✅ **Health Endpoint** – Ready for load balancer health checks
6. ✅ **Rate Limiting** – Already protecting against abuse
7. ✅ **Consistent Error Format** – Standard JSON error responses

The path from the current setup to a production deployment is incremental and well-defined.
