const router = require('express').Router();
const { body, param } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const requireAdmin = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const productController = require('../controllers/product.controller');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('originalPrice').isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
  body('discountedPrice').isFloat({ min: 0 }).withMessage('Discounted price must be a positive number'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

router.get('/', asyncHandler(productController.getAllProducts));
router.get('/:id', param('id').notEmpty(), validate, asyncHandler(productController.getProductById));
router.post('/', requireAdmin, productValidation, validate, asyncHandler(productController.createProduct));
router.put('/:id', requireAdmin, param('id').notEmpty(), productValidation, validate, asyncHandler(productController.updateProduct));
router.delete('/:id', requireAdmin, param('id').notEmpty(), validate, asyncHandler(productController.deleteProduct));

module.exports = router;
