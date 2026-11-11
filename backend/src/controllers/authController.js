const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  COOKIE_OPTIONS,
} = require('../utils/tokenUtils');

// ============================================================
// YORDAMCHI FUNKSIYA: To'liq Auth Jarayoni (token + cookie + session)
// Register va Login uchun umumiy mantiq
// ============================================================
const createAuthSession = async (user, deviceName, ip, res) => {
  // 1. Access Token yaratamiz (15m)
  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role,
  });

  // 2. Refresh Token yaratamiz (plain string — faqat cookie uchun)
  const plainRefreshToken = generateRefreshToken();

  // 3. Refresh tokenni SHA-256 bilan hashlashdb saqlaymiz
  const refreshTokenHash = hashToken(plainRefreshToken);

  // 4. Muddatini hisoblash (7 kun)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 5. RefreshSession collectionida yangi sessiya yaratamiz
  await RefreshSession.create({
    userId: user._id,
    refreshTokenHash,
    deviceName: deviceName || 'Unknown Device',
    ip: ip || null,
    expiresAt,
    revokedAt: null,
    createdAt: new Date(),
  });

  // 6. Refresh tokenni httpOnly cookie ga yozamiz
  res.cookie('refreshToken', plainRefreshToken, COOKIE_OPTIONS);

  return accessToken;
};

// ============================================================
// POST /auth/register — Ro'yxatdan o'tish + Avto-Login
// ============================================================
const register = async (req, res) => {
  try {
    const { name, email, password, role, deviceName } = req.body;

    // Maydonlarni tekshirish
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Ism, email va parol majburiy.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Parol kamida 6 ta belgi bo\'lishi kerak.',
      });
    }

    // Email allaqachon mavjudmi?
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Bu email allaqachon ro\'yxatdan o\'tgan.',
      });
    }

    // Parolni bcrypt bilan hashlash (salt rounds: 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Foydalanuvchini yaratish
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role && ['dispatcher', 'carrier', 'admin'].includes(role) ? role : 'dispatcher',
    });

    // Avto-Login: Access + Refresh token yaratamiz va sessiya ochamiz
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress;
    const accessToken = await createAuthSession(user, deviceName, ip, res);

    return res.status(201).json({
      success: true,
      message: 'Ro\'yxatdan o\'tildi va tizimga kirildi!',
      accessToken,
      user: user.toJSON(), // passwordHash yashirilgan
    });
  } catch (error) {
    console.error('register xatosi:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Bu email allaqachon mavjud.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server xatosi. Qayta urinib ko\'ring.',
    });
  }
};

// ============================================================
// POST /auth/login — Tizimga kirish
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password, deviceName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email va parol majburiy.',
      });
    }

    // Foydalanuvchini topamiz
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri.',
      });
    }

    // Parolni tekshiramiz
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email yoki parol noto\'g\'ri.',
      });
    }

    // Access + Refresh token + Session yaratamiz
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress;
    const accessToken = await createAuthSession(user, deviceName, ip, res);

    return res.status(200).json({
      success: true,
      message: 'Tizimga muvaffaqiyatli kirildi!',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('login xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi. Qayta urinib ko\'ring.',
    });
  }
};

// ============================================================
// POST /auth/refresh — Token Rotation
// ============================================================
const refresh = async (req, res) => {
  try {
    // Cookie'dan refresh tokenni olamiz
    const plainRefreshToken = req.cookies?.refreshToken;

    if (!plainRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token topilmadi. Qayta login qiling.',
      });
    }

    // Tokenni hash qilamiz va bazadan qidiramiz
    const refreshTokenHash = hashToken(plainRefreshToken);

    const session = await RefreshSession.findOne({
      refreshTokenHash,
      revokedAt: null, // Faqat aktiv sessiyalar
    });

    if (!session) {
      // Sessiya topilmadi yoki allaqachon bekor qilingan
      // Cookie'ni tozalaymiz — xavfsizlik uchun
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Sessiya topilmadi yoki muddati o\'tgan. Qayta login qiling.',
      });
    }

    // Muddati o'tganmi? (qo'shimcha tekshiruv)
    if (session.expiresAt < new Date()) {
      session.revokedAt = new Date();
      await session.save();
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Sessiya muddati tugagan. Qayta login qiling.',
      });
    }

    // Foydalanuvchini topamiz
    const user = await User.findById(session.userId);
    if (!user) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi topilmadi.',
      });
    }

    // ===== TOKEN ROTATION =====
    // 1. Eski sessiyani bekor qilamiz (revokedAt = hozirgi vaqt)
    session.revokedAt = new Date();
    await session.save();

    // 2. Yangi refresh token yaratamiz
    const newPlainRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newPlainRefreshToken);

    // 3. Yangi muddatni hisoblash
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 4. Yangi sessiya yaratamiz
    await RefreshSession.create({
      userId: user._id,
      refreshTokenHash: newRefreshTokenHash,
      deviceName: session.deviceName, // Qurilma nomini saqlashtiramiz
      ip: req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress,
      expiresAt: newExpiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });

    // 5. Yangi refresh tokenni cookie'ga yozamiz
    res.cookie('refreshToken', newPlainRefreshToken, COOKIE_OPTIONS);

    // 6. Yangi access token yaratamiz va qaytaramiz
    const newAccessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Token muvaffaqiyatli yangilandi.',
      accessToken: newAccessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('refresh xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi. Qayta urinib ko\'ring.',
    });
  }
};

// ============================================================
// POST /auth/logout — Chiqish
// ============================================================
const logout = async (req, res) => {
  try {
    const plainRefreshToken = req.cookies?.refreshToken;

    if (plainRefreshToken) {
      // Tokenni hash qilib sessiyani topamiz
      const refreshTokenHash = hashToken(plainRefreshToken);
      const session = await RefreshSession.findOne({
        refreshTokenHash,
        revokedAt: null,
      });

      if (session) {
        // Sessiyani bekor qilamiz
        session.revokedAt = new Date();
        await session.save();
      }
    }

    // Cookie'ni tozalaymiz
    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Tizimdan muvaffaqiyatli chiqildi.',
    });
  } catch (error) {
    console.error('logout xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

// ============================================================
// GET /me — Joriy foydalanuvchi profili (Protected)
// ============================================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi.',
      });
    }

    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('getMe xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

// ============================================================
// GET /sessions — Foydalanuvchining barcha sessiyalari (Protected)
// ============================================================
const getSessions = async (req, res) => {
  try {
    const sessions = await RefreshSession.find(
      { userId: req.user.userId },
      { _id: 1, deviceName: 1, ip: 1, createdAt: 1, revokedAt: 1, expiresAt: 1 }
    ).sort({ createdAt: -1 }); // Eng yangi sessiyalar birinchi

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('getSessions xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

// ============================================================
// DELETE /sessions/:id — Qurilmani chiqarib yuborish (Protected)
// ============================================================
const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Sessiya topamiz (faqat shu userga tegishli bo'lishi kerak!)
    const session = await RefreshSession.findOne({
      _id: id,
      userId: req.user.userId, // Boshqa userning sessiyasini o'chira olmasin
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessiya topilmadi yoki sizga tegishli emas.',
      });
    }

    if (session.revokedAt !== null) {
      return res.status(400).json({
        success: false,
        message: 'Bu sessiya allaqachon bekor qilingan.',
      });
    }

    // Sessiyani bekor qilamiz
    session.revokedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: `"${session.deviceName}" qurilmasi muvaffaqiyatli chiqarib yuborildi.`,
      sessionId: id,
    });
  } catch (error) {
    console.error('revokeSession xatosi:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Session ID formati noto\'g\'ri.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  getSessions,
  revokeSession,
};

