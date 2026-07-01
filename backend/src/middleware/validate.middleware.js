const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  throw new ApiError(422, 'Validation failed', errors.array().map((error) => ({
    field: error.path,
    message: error.msg
  })));
}

module.exports = validate;
