const categoryService = require('../services/firestore.service');
const ApiError = require('../utils/ApiError');

async function createCategory(req, res) {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
}

async function updateCategory(req, res) {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: category });
}

async function deleteCategory(req, res) {
  await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
}

async function getAllCategories(req, res) {
  const categories = await categoryService.getAllCategories();
  res.json({ success: true, data: categories });
}

async function getCategoryById(req, res) {
  const category = await categoryService.getCategoryById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, data: category });
}

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById
};
