const router = require('express').Router();
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const uploadRoutes = require('./upload.routes');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Belleru backend is healthy' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
