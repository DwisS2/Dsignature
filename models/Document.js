const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  id_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
    // required: true
  },
  id_signer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  requestsigner: {
    type: Array
    // ref: 'requests'
  },
  document: {
    type: String
    // required: true
  },

  nm_document: {
    type: String
    // required: true
  },
  certificate_number: {
    type: String
    // required: true
  },
  status: {
    type: String
    // required: true
  },
  sign_number: {
    type: String
    // required: true
  },
  reject: {
    type: Array
    // required: true
  },
  agree: {
    type: Array
    // required: true
  },
  sign: {
    type: Array
    // required: true
  },
  totalsigner: {
    type: Number
    // required: true
  },
  totalreject: {
    type: Number,
    default: 0
    // required: true
  },
  alreadysigned: {
    type: Number,
    default: 0
    // required: true
  },
  isorder: {
    type: String
    // required: true
  },
  qrcode: {
    type: String
    // required: true
  },

  timeCreated: {
    type: Date,
    default: () => Date.now()
  },
  timeSigned: {
    type: Date
    // default: () => Date.now()
  }
})

const Document = mongoose.model('documents', documentSchema)
module.exports = Document
