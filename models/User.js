const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  timeCreated: {
    type: Date,
    default: () => Date.now()
  }
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  next()
})

const User = mongoose.model('users', userSchema)
module.exports = User
