const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

async function login(req, res) {
  const { email, password } = req.body;

  if (email !== config.admin.email || password !== config.admin.password) {
    throw new ApiError(401, 'Invalid admin credentials');
  }

  const token = jwt.sign({ email, role: 'admin' }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });

  res.json({
    success: true,
    data: {
      token,
      admin: { email, role: 'admin' }
    }
  });
}

module.exports = { login };
