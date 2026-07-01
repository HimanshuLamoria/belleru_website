const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate.middleware');
const authController = require('../controllers/auth.controller');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isString().notEmpty().withMessage('Password is required')
  ],
  validate,
  asyncHandler(authController.login)
);

module.exports = router;
