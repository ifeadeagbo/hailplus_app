// Builds the Express app without starting it, so tests can load it directly.
// server.js starts it.
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const helmet = require('helmet');
const { sequelize } = require('./models');
require('./config/passport');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const publicRoutes = require('./routes/public');
const webhookRoutes = require('./routes/webhooks');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const requireAjaxHeader = require('./middleware/csrf');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Behind a load balancer or reverse proxy (most hosts), trust its
// X-Forwarded-* headers so rate limiting and secure cookies see the real client
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// Health check for load balancers and uptime monitors (not rate limited)
app.get('/health', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use(requestLogger);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration (before rate limiting so 429 responses keep CORS headers)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Stripe webhooks need the raw body for signature verification,
// so they must be mounted before the JSON body parser
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// CSRF protection for cookie-authenticated requests
app.use('/api/', requireAjaxHeader);

// Sessions are only used to hold OAuth state during social login redirects.
// Stored in Postgres (table created by migrations) so they survive restarts
// and work across instances.
const sessionStore = new PgSession({
  conObject: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  // Test runs create many short-lived apps; skip the background pruning timer there
  pruneSessionInterval: process.env.NODE_ENV === 'test' ? false : 60 * 15
});
app.locals.sessionStore = sessionStore;

app.use(session({
  store: sessionStore,
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 15 // 15 minutes, long enough to finish a social login
  }
}));

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);

// Unknown API routes get JSON, not Express's HTML page
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
