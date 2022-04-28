const mongoose = require('mongoose')

const signatureSchema = new mongoose.Schema({
  img: {
    type: String,
    required: true
  },

  timeCreated: {
    type: Date,
    default: () => Date.now()
  },
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
})

const Signature = mongoose.model('signatures', signatureSchema)
module.exports = Signature
