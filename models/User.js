const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

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
  // this.password = bcrypt.hashSync(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function (plaintext, callback) {
  return callback(null, bcrypt.compareSync(plaintext, this.password))
}

const User = mongoose.model('users', userSchema)
module.exports = User
