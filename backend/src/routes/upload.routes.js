const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireAdmin = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');

router.post(
  '/product-images',
  requireAdmin,
  upload.array('images', 8),
  asyncHandler(uploadController.uploadProductImages)
);

router.post(
  '/category-image',
  requireAdmin,
  upload.single('image'),
  asyncHandler(uploadController.uploadCategoryImage)
);

module.exports = router;
