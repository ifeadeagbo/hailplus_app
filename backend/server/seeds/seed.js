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
  const products = [
    // Electronics
    {
      name: 'MacBook Pro 14"',
      description: 'Apple MacBook Pro 14-inch with M2 Pro chip, 16GB RAM, 512GB SSD. Features a stunning Liquid Retina XDR display, incredible battery life, and pro-level performance.',
      price: 1999.99,
      category: 'Electronics',
      stock: 15,
      featured: true,
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&h=500&fit=crop'
    },
    {
      name: 'iPhone 15 Pro',
      description: 'Latest iPhone with A17 Pro chip, 256GB, Titanium design. Features Dynamic Island, 48MP camera system, and USB-C connectivity.',
      price: 1199.99,
      category: 'Electronics',
      stock: 25,
      featured: true,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&h=500&fit=crop'
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Premium noise-canceling wireless headphones with exceptional sound quality and 30-hour battery life.',
      price: 399.99,
      category: 'Electronics',
      stock: 30,
      featured: false,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&h=500&fit=crop'
    },
    {
      name: 'Samsung 65" OLED TV',
      description: '4K Smart TV with HDR and Dolby Atmos. Quantum Dot technology delivers brilliant colors and deep blacks.',
      price: 2499.99,
      category: 'Electronics',
      stock: 8,
      featured: true,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop'
    },
    {
      name: 'iPad Air',
      description: 'Apple iPad Air with M1 chip, 64GB, Wi-Fi. Perfect for creativity, productivity, and entertainment.',
      price: 599.99,
      category: 'Electronics',
      stock: 20,
      featured: false,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop'
    },
    {
      name: 'Canon EOS R6',
      description: 'Full-frame mirrorless camera with 20MP sensor, 4K video, and advanced autofocus system.',
      price: 2499.99,
      category: 'Electronics',
      stock: 10,
      featured: true,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop'
    },
    {
      name: 'Apple Watch Series 9',
      description: 'Advanced health features, fitness tracking, and seamless iPhone integration.',
      price: 429.99,
      category: 'Electronics',
      stock: 35,
      featured: false,
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=500&fit=crop'
    },
    {
      name: 'PlayStation 5',
      description: 'Next-gen gaming console with ultra-high speed SSD and stunning 4K graphics.',
      price: 499.99,
      category: 'Electronics',
      stock: 12,
      featured: true,
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&h=500&fit=crop'
    },
    
    // Clothing
    {
      name: 'Classic White T-Shirt',
      description: '100% organic cotton, comfortable fit. Perfect for casual everyday wear.',
      price: 29.99,
      category: 'Clothing',
      stock: 100,
      featured: false,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop'
    },
    {
      name: 'Denim Jeans',
      description: 'Premium quality denim, slim fit. Classic style with modern comfort.',
      price: 89.99,
      category: 'Clothing',
      stock: 60,
      featured: false,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop'
    },
    {
      name: 'Leather Jacket',
      description: 'Genuine leather biker jacket. Timeless style with premium craftsmanship.',
      price: 299.99,
      category: 'Clothing',
      stock: 15,
      featured: true,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop'
    },
    {
      name: 'Running Shoes',
      description: 'Professional running shoes with advanced cushioning and breathable mesh upper.',
      price: 149.99,
      category: 'Clothing',
      stock: 40,
      featured: false,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'
    },
    {
      name: 'Summer Dress',
      description: 'Elegant floral print summer dress. Light, comfortable, and stylish.',
      price: 79.99,
      category: 'Clothing',
      stock: 30,
      featured: true,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=500&fit=crop'
    },
    {
      name: 'Business Suit',
      description: 'Professional two-piece suit. Tailored fit with premium fabric.',
      price: 499.99,
      category: 'Clothing',
      stock: 20,
      featured: false,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=500&fit=crop'
    },
    
    // Books
    {
      name: 'The Great Gatsby',
      description: 'Classic American novel by F. Scott Fitzgerald. A timeless tale of love, wealth, and the American Dream.',
      price: 14.99,
      category: 'Books',
      stock: 50,
      featured: false,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop'
    },
    {
      name: 'JavaScript: The Good Parts',
      description: 'Essential JavaScript programming guide by Douglas Crockford. Master the best practices of JavaScript.',
      price: 39.99,
      category: 'Books',
      stock: 30,
      featured: true,
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&h=500&fit=crop'
    },
    {
      name: '1984',
      description: 'Dystopian novel by George Orwell. A prophetic masterpiece about surveillance and totalitarianism.',
      price: 15.99,
      category: 'Books',
      stock: 45,
      featured: false,
      image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500&h=500&fit=crop'
    },
    {
      name: 'Clean Code',
      description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin.',
      price: 44.99,
      category: 'Books',
      stock: 25,
      featured: true,
      image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&h=500&fit=crop'
    },
    
    // Home & Garden
    {
      name: 'Smart Home Hub',
      description: 'Control all your smart home devices from one central hub. Compatible with Alexa and Google Home.',
      price: 129.99,
      category: 'Home & Garden',
      stock: 25,
      featured: false,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop'
    },
    {
      name: 'Indoor Plant Set',
      description: 'Set of 3 low-maintenance indoor plants. Includes Snake Plant, Pothos, and ZZ Plant.',
      price: 49.99,
      category: 'Home & Garden',
      stock: 20,
      featured: false,
      image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?w=500&h=500&fit=crop'
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Premium office chair with lumbar support, adjustable height, and breathable mesh back.',
      price: 499.99,
      category: 'Home & Garden',
      stock: 12,
      featured: true,
      image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&h=500&fit=crop'
    },
    {
      name: 'Smart LED Bulbs (4-Pack)',
      description: 'WiFi-enabled LED bulbs with millions of colors and voice control.',
      price: 59.99,
      category: 'Home & Garden',
      stock: 40,
      featured: false,
      image: 'https://images.unsplash.com/photo-1532007271951-c487760934ae?w=500&h=500&fit=crop'
    },
    {
      name: 'Modern Coffee Table',
      description: 'Minimalist glass-top coffee table with wooden legs. Perfect for modern living rooms.',
      price: 299.99,
      category: 'Home & Garden',
      stock: 8,
      featured: true,
      image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500&h=500&fit=crop'
    },
    
    // Sports
    {
      name: 'Yoga Mat',
      description: 'Premium non-slip yoga mat, 6mm thick. Eco-friendly material with excellent grip.',
      price: 39.99,
      category: 'Sports',
      stock: 50,
      featured: false,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop'
    },
    {
      name: 'Adjustable Dumbbell Set',
      description: 'Space-saving adjustable dumbbells, 5-50 lbs per dumbbell. Perfect for home workouts.',
      price: 299.99,
      category: 'Sports',
      stock: 15,
      featured: true,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=500&fit=crop'
    },
    {
      name: 'Tennis Racket',
      description: 'Professional grade tennis racket with carbon fiber frame and optimal string tension.',
      price: 189.99,
      category: 'Sports',
      stock: 20,
      featured: false,
      image: 'https://images.unsplash.com/photo-1617883861744-13b534e3b928?w=500&h=500&fit=crop'
    },
    {
      name: 'Exercise Bike',
      description: 'Indoor cycling bike with adjustable resistance and digital display.',
      price: 899.99,
      category: 'Sports',
      stock: 6,
      featured: true,
      image: 'https://images.unsplash.com/photo-1520877880798-5ee004e3f11e?w=500&h=500&fit=crop'
    },
    {
      name: 'Basketball',
      description: 'Official size and weight basketball with superior grip and durability.',
      price: 34.99,
      category: 'Sports',
      stock: 45,
      featured: false,
      image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500&h=500&fit=crop'
    }
  ];

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