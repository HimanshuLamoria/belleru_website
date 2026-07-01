const productService = require('../services/firestore.service');
const ApiError = require('../utils/ApiError');

async function createProduct(req, res) {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
}

async function updateProduct(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({ success: true, data: product });
}

async function deleteProduct(req, res) {
  await productService.deleteProduct(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
}

async function getAllProducts(req, res) {
  const products = await productService.getAllProducts();
  res.json({ success: true, data: products });
}

async function getProductById(req, res) {
  const product = await productService.getProductById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, data: product });
}

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById
};
