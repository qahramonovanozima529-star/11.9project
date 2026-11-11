const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  getShipments,
  createShipment,
  getShipmentById,
  updateShipmentStatus,
} = require('../controllers/shipmentController');

// GET /shipments — Barcha yuklarni ko'rish
// Barcha autentifikatsiya qilingan foydalanuvchilar ruxsatli
router.get('/', authMiddleware, getShipments);

// GET /shipments/:id — Bitta yuk
router.get('/:id', authMiddleware, getShipmentById);

// POST /shipments — Yangi yuk qo'shish
// FAQAT 'dispatcher' va 'admin' rollari
router.post('/', authMiddleware, roleMiddleware('dispatcher', 'admin'), createShipment);

// PATCH /shipments/:id/status — Status o'zgartirish
// FAQAT 'dispatcher' va 'admin' rollari
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware('dispatcher', 'admin'),
  updateShipmentStatus
);

module.exports = router;

