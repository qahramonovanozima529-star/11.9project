/**
 * Role-Based Authorization Middleware (RBAC)
 * Faqat ruxsat etilgan rollar ega foydalanuvchilarga kirish imkonini beradi
 *
 * Foydalanish:
 *   router.post('/shipments', authMiddleware, roleMiddleware('dispatcher', 'admin'), createShipment);
 *
 * @param {...string} allowedRoles - Ruxsat etilgan rollar ro'yxati
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware dan keyin ishlaydi, shuning uchun req.user mavjud bo'lishi kerak
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Autentifikatsiya talab qilinadi.',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Ruxsat yo'q. Bu amal uchun kerakli rol: [${allowedRoles.join(', ')}]. Sizning rolingiz: "${userRole}"`,
      });
    }

    // Role mos keldi — davom etamiz
    next();
  };
};

module.exports = roleMiddleware;

