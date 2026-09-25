require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize, User, Product } = require('../models');
const { runMigrations } = require('../db/migrate');
const logger = require('../utils/logger');

const seedUsers = async () => {
  const users = [
    {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      name: 'Admin User',
      role: 'admin',
      emailVerified: true
    },
    {
      email: 'john@example.com',
      password: 'password123',
      name: 'John Doe',
      role: 'customer',
      emailVerified: true
    },
    {
      email: 'jane@example.com',
      password: 'password123',
      name: 'Jane Smith',
      role: 'customer',
      emailVerified: true
    }
  ];

  for (const userData of users) {
    await User.create(userData);
  }
  
  logger.info('Users seeded successfully');
};

const seedProducts = async () => {
  const products = require('./sampleProducts');

  for (const productData of products) {
    await Product.create(productData);
  }
  
  logger.info('Products seeded successfully');
};

const seedDatabase = async () => {
  try {
    // Sample data for local development only: this wipes every table
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to seed a production database');
    }
    
    await runMigrations();
    await sequelize.query('TRUNCATE "Carts", "Orders", "Products", "Users", "session" CASCADE');
    logger.info('Database reset');

    // Seed data
    await seedUsers();
    await seedProducts();

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();