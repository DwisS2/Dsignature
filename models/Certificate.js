const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const certificateSchema = new mongoose.Schema({
  certificate_password: {
    type: String,
    required: true
  },
  serialnumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  validity: {
    type: String,
    required: true
  },
  certificate_buffer: {
    type: Buffer,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  timeCreated: {
    type: Date,
    default: () => Date.now()
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
    // required: true
  }
})

certificateSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  this.password = bcrypt.hashSync(this.password, 10)
  next()
})

certificateSchema.methods.comparePassword = function (plaintext, callback) {
  return callback(
    null,
    bcrypt.compareSync(plaintext, this.certificate_password)
  )
}

const Digital_certificate = mongoose.model('certificates', certificateSchema)
module.exports = Digital_certificate
