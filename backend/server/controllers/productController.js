const { Product } = require('../models');
const { Op } = require('sequelize');

// Fields an admin may set; anything else in the request body is ignored
const EDITABLE_FIELDS = ['name', 'description', 'price', 'image', 'category', 'stock', 'featured', 'active'];

const pickEditable = (body) =>
  Object.fromEntries(EDITABLE_FIELDS.filter(field => body[field] !== undefined).map(field => [field, body[field]]));

exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, search, sort } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    
    // Build where clause
    const where = { active: true };
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Build order clause
    let order = [['createdAt', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    if (sort === 'price_desc') order = [['price', 'DESC']];
    if (sort === 'name') order = [['name', 'ASC']];
    
    // Pagination
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Product.findAndCountAll({
      where,
      order,
      limit,
      offset
    });
    
    res.json({
      products: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, active: true }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(pickEditable(req.body));
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await product.update(pickEditable(req.body));
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Soft delete
    await product.update({ active: false });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { featured: true, active: true },
      limit: 8
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};