const Shipment = require('../models/Shipment');

// ============================================================
// GET /shipments — Barcha yuklarni ko'rish (Protected)
// Barcha autentifikatsiya qilingan foydalanuvchilar ko'ra oladi
// ============================================================
const getShipments = async (req, res) => {
  try {
    // Sahifalash (pagination)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter: status bo'yicha
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Shipment.countDocuments(filter),
    ]);

    // Statistika
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      stats,
    });
  } catch (error) {
    console.error('getShipments xatosi:', error);
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

// ============================================================
// POST /shipments — Yangi yuk qo'shish (Protected + Role: dispatcher | admin)
// ============================================================
const createShipment = async (req, res) => {
  try {
    const { origin, destination, cargoType, weight, priority, estimatedDelivery, notes } = req.body;

    // Majburiy maydonlarni tekshirish
    if (!origin || !destination || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Yuklash joyi, yetkazish joyi va og\'irlik majburiy.',
      });
    }

    const shipment = await Shipment.create({
      origin: origin.trim(),
      destination: destination.trim(),
      cargoType: cargoType || 'General',
      weight: parseFloat(weight),
      priority: priority || 'Normal',
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
      notes: notes?.trim(),
      createdBy: req.user.userId,
    });

    // Populate qilib qaytaramiz
    await shipment.populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Yuk muvaffaqiyatli qo\'shildi!',
      data: shipment,
    });
  } catch (error) {
    console.error('createShipment xatosi:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server xatosi.',
    });
  }
};

// ============================================================
// GET /shipments/:id — Bitta yuk (Protected)
// ============================================================
const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate(
      'createdBy',
      'name email role'
    );

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Yuk topilmadi.',
      });
    }

    return res.status(200).json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error('getShipmentById xatosi:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'ID formati noto\'g\'ri.' });
    }
    return res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

// ============================================================
// PATCH /shipments/:id/status — Status o'zgartirish (Protected + Role: dispatcher | admin)
// ============================================================
const updateShipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'In Transit', 'Delivered', 'Cancelled', 'On Hold'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status noto'g'ri. Ruxsat etilganlar: ${allowedStatuses.join(', ')}`,
      });
    }

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Yuk topilmadi.' });
    }

    return res.status(200).json({
      success: true,
      message: `Status "${status}" ga o'zgartirildi.`,
      data: shipment,
    });
  } catch (error) {
    console.error('updateShipmentStatus xatosi:', error);
    return res.status(500).json({ success: false, message: 'Server xatosi.' });
  }
};

module.exports = {
  getShipments,
  createShipment,
  getShipmentById,
  updateShipmentStatus,
};

