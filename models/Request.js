const mongoose = require('mongoose')

const requestSchema = new mongoose.Schema({
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  id_document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'documents'
  },

  email: {
    type: String
    // required: true
  },
  sign_number: {
    type: String
    // required: true
  },
  rejected: {
    type: String,
    default: 0
    // required: true
  },
  agree: {
    type: Number,
    default: 0
    // required: true
  },
  order: {
    type: String
    // required: true
  },
  status: {
    type: String
    // required: true
  },
  certificate_number: {
    type: String
    // required: true
  },
  page: {
    // type: String
    // required: true
  },
  request: {
    // type: String
    // required: true
  },
  timeCreated: {
    type: Date,
    default: () => Date.now()
  }
})

const Request = mongoose.model('requests', requestSchema)
module.exports = Request
