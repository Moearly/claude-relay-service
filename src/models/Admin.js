const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'super_admin']
  },
  email: {
    type: String,
    trim: true
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 更新时间戳
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now()
  next()
})

const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin

