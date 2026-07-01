function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 ? 'Internal server error' : error.message
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    payload.error = error.message;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
