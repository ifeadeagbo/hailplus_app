require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

// Certificates are always verified. Supabase signs with its own
// certificate authority: put its CA certificate (PEM text) in DB_SSL_CA.
const sslOptions = {
  rejectUnauthorized: true,
  ...(process.env.DB_SSL_CA && { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') })
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    // Hosted databases (Supabase, Neon) require SSL
    ...(process.env.DB_SSL === 'true' && {
      dialectOptions: { ssl: { require: true, ...sslOptions } }
    }),
    // Set DB_LOGGING=true to print every SQL query while debugging
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
module.exports.sslOptions = sslOptions;