const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  getSessions,
  revokeSession,
} = require('../controllers/authController');

// ===== Public Routes (Himoyasiz) =====
// POST /auth/register — Ro'yxatdan o'tish + Avto-Login
router.post('/register', register);

// POST /auth/login — Tizimga kirish
router.post('/login', login);

// POST /auth/refresh — Token Rotation (cookie orqali)
router.post('/refresh', refresh);

// POST /auth/logout — Chiqish (cookie tozalanadi)
router.post('/logout', logout);

// ===== Protected Routes (authMiddleware kerak) =====
// GET /auth/me — Joriy foydalanuvchi profili
router.get('/me', authMiddleware, getMe);

// GET /auth/sessions — Barcha qurilma/sessiyalar ro'yxati
router.get('/sessions', authMiddleware, getSessions);

// DELETE /auth/sessions/:id — Qurilmani chiqarib yuborish
router.delete('/sessions/:id', authMiddleware, revokeSession);

module.exports = router;

