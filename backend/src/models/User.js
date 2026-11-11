const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ism majburiy'],
      trim: true,
      minlength: [2, 'Ism kamida 2 ta belgi bo\'lishi kerak'],
    },
    email: {
      type: String,
      required: [true, 'Email majburiy'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email formati noto\'g\'ri'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Parol majburiy'],
    },
    role: {
      type: String,
      enum: {
        values: ['dispatcher', 'carrier', 'admin'],
        message: 'Role faqat dispatcher, carrier yoki admin bo\'lishi mumkin',
      },
      default: 'dispatcher',
    },
  },
  {
    timestamps: true,
  }
);

// Parolni solishtirish metodi
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// JSON'ga o'girishda passwordHash ni yashirish
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

