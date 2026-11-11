const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: {
      type: String,
      unique: true,
      default: function () {
        // Avtomatik tracking raqam: NUM-XXXXXXXX
        return 'NUM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      },
    },
    origin: {
      type: String,
      required: [true, 'Yuklash joyi majburiy'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Yetkazish joyi majburiy'],
      trim: true,
    },
    cargoType: {
      type: String,
      required: [true, 'Yuk turi majburiy'],
      enum: {
        values: ['General', 'Refrigerated', 'Hazardous', 'Oversized', 'Liquid', 'Electronics'],
        message: 'Yuk turi noto\'g\'ri',
      },
      default: 'General',
    },
    weight: {
      type: Number,
      required: [true, 'Og\'irlik majburiy (kg)'],
      min: [0.1, 'Og\'irlik 0.1 kg dan katta bo\'lishi kerak'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Transit', 'Delivered', 'Cancelled', 'On Hold'],
        message: 'Status noto\'g\'ri',
      },
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Normal', 'High', 'Urgent'],
      default: 'Normal',
    },
    estimatedDelivery: {
      type: Date,
      default: function () {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Izoh 500 belgidan oshmasligi kerak'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;

