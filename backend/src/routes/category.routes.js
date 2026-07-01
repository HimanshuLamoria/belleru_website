const router = require('express').Router();
const { body, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const requireAdmin = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const categoryController = require('../controllers/category.controller');

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer'),
  body('image').optional().isString().withMessage('Image must be a URL string')
];

router.get('/', asyncHandler(categoryController.getAllCategories));
router.get('/:id', param('id').notEmpty(), validate, asyncHandler(categoryController.getCategoryById));
router.post('/', requireAdmin, categoryValidation, validate, asyncHandler(categoryController.createCategory));
router.put('/:id', requireAdmin, param('id').notEmpty(), categoryValidation, validate, asyncHandler(categoryController.updateCategory));
router.delete('/:id', requireAdmin, param('id').notEmpty(), validate, asyncHandler(categoryController.deleteCategory));

module.exports = router;
