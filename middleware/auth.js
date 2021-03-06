const jwt = require('jsonwebtoken');
const config = require('config');
require('dotenv').config();

// const jwtSecret = config.get('jwtSecret')
const jwtSecret = process.env.JWT_SECRET;
/**
 * Middleware to authenticate user, if token exists then contiue with request
 */

module.exports = async function (req, res, next) {
  const authToken = req.header('x-auth-token');

  if (!authToken) {
    return res.status(401).json({ msg: 'Please Login' });
  }

  try {
    let decoded = jwt.verify(authToken, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Error: ' + err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
