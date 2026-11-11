const mongoose = require('mongoose');

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId majburiy'],
      index: true,
    },
    // Refresh token HECH QACHON oddiy (plain) saqlanmaydi
    // SHA-256 bilan hash qilinib saqlanadi
    refreshTokenHash: {
      type: String,
      required: [true, 'Refresh token hash majburiy'],
    },
    deviceName: {
      type: String,
      required: [true, 'Qurilma nomi majburiy'],
      trim: true,
      default: 'Unknown Device',
    },
    ip: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Muddati majburiy'],
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — muddati o'tgach o'chiradi
    },
    // null = sessiya AKTIV, Date = sessiya BEKOR QILINGAN
    revokedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // createdAt manualda boshqarilganligi uchun timestamps ni o'chiramiz
    timestamps: false,
  }
);

// Aktiv sessiyalarni tez topish uchun indeks
refreshSessionSchema.index({ refreshTokenHash: 1, revokedAt: 1 });
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

module.exports = RefreshSession;

