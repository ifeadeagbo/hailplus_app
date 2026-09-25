require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
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
const requireAjaxHeader = require('./middleware/csrf');
const { apiLimiter } = require('./middleware/rateLimiter');
const { expireStaleOrders } = require('./utils/orderLifecycle');

// Refuse to start without the settings the app can't work without
const REQUIRED_ENV = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'SESSION_SECRET', 'CLIENT_URL', 'STRIPE_SECRET_KEY'];
const missingEnv = REQUIRED_ENV.filter(name => !process.env[name] || process.env[name].startsWith('your_'));
if (missingEnv.length > 0) {
  console.error(`Missing or placeholder environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5050;

// Behind a load balancer or reverse proxy (most hosts), trust its
// X-Forwarded-* headers so rate limiting and secure cookies see the real client
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// Security middleware
app.use(helmet());

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
// Stored in Postgres so they survive restarts and work across instances.
app.use(session({
  store: new PgSession({
    conObject: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    createTableIfMissing: true
  }),
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

// Error handling middleware
app.use(errorHandler);

// Database sync and server start
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synchronized');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Release stock held by checkouts that were never paid
  setInterval(() => {
    expireStaleOrders().catch(err => console.error('Stale order sweep failed:', err));
  }, 5 * 60 * 1000);
}).catch(err => {
  console.error('Unable to connect to database:', err);
  process.exit(1);
});