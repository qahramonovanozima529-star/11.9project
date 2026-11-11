const { verifyAccessToken } = require('../utils/tokenUtils');

/**
 * Authentication Middleware
 * Authorization: Bearer <accessToken> headerini tekshiradi
 * Token noto'g'ri yoki muddati o'tgan bo'lsa 401 qaytaradi
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Authorization header mavjudmi?
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header topilmadi. Bearer token talab qilinadi.',
      });
    }

    // Format tekshiruvi: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization format noto\'g\'ri. Format: "Bearer <token>"',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        message: 'Token mavjud emas.',
      });
    }

    // JWT ni tekshirish
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token noto\'g\'ri yoki muddati o\'tgan. /auth/refresh orqali yangilang.',
      });
    }

    // Tekshirilgan user ma'lumotlarini keyingi middleware/controller uchun req ga qo'shamiz
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('authMiddleware xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi (authMiddleware)',
    });
  }
};

module.exports = authMiddleware;

