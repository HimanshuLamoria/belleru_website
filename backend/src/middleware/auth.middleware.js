const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { admin } = require('../config/firebase');
const ApiError = require('../utils/ApiError');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) throw new ApiError(401, 'Admin authentication token is required');

  try {
    req.admin = jwt.verify(token, config.jwt.secret);
    return next();
  } catch (error) {
    return admin.auth().verifyIdToken(token)
      .then((decoded) => {
        if (decoded.email !== config.admin.email) {
          throw new ApiError(403, 'This Firebase user is not allowed as an admin');
        }

        req.admin = { email: decoded.email, role: 'admin', uid: decoded.uid };
        next();
      })
      .catch((firebaseError) => {
        next(firebaseError instanceof ApiError ? firebaseError : new ApiError(401, 'Invalid or expired admin token'));
      });
  }
}

module.exports = requireAdmin;
