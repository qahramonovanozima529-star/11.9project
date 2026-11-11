const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Access Token yaratish (15 daqiqa amal qiladi)
 * @param {Object} payload - { userId, role }
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
    }
  );
};

/**
 * Refresh Token yaratish (7 kun amal qiladi)
 * Xavfsiz, kriptografik random string sifatida generatsiya qilinadi
 * @returns {string} Oddiy (plain) refresh token string
 */
const generateRefreshToken = () => {
  // 64 bayt = 128 xex belgisi — kuchli, kriptografik xavfsiz token
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Refresh tokenni SHA-256 bilan hash qilish
 * Bazada HECH QACHON oddiy token saqlanmasin!
 * @param {string} token - Oddiy refresh token
 * @returns {string} SHA-256 hash (hex)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Refresh Token uchun Cookie sozlamalari
 * httpOnly: true  — JavaScript orqali o'qib bo'lmaydi (XSS himoyasi)
 * sameSite: 'lax' — CSRF himoyasi (lekin same-site navigatsiyaga ruxsat beradi)
 * secure: false   — Development uchun (Production'da true bo'lishi shart!)
 * maxAge: 7 kun   — Cookie muddati millisekundlarda
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 kun, millisekund
  path: '/',
};

/**
 * Access Token'ni tekshirish va decode qilish
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload yoki null
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  COOKIE_OPTIONS,
};

