const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const signerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  nohp: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  certificate: {
    type: Buffer
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

signerSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  this.password = bcrypt.hashSync(this.password, 10)
  next()
})

signerSchema.methods.comparePassword = function (plaintext, callback) {
  return callback(null, bcrypt.compareSync(plaintext, this.password))
}

const Signer = mongoose.model('signers', signerSchema)
module.exports = Signer
