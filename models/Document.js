const mongoose = require('mongoose')

const requestSchema = new mongoose.Schema({
  email: {
    // type: String
    // required: true
  },
  sign_number: {
    // type: String
    // required: true
  },
  rejected: {
    // type: String
    // required: true
  },
  order: {
    // type: String
    // required: true
  },
  page: {
    // type: String
    // required: true
  }
})

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
  rejected: {
    type: String
    // required: true
  },
  totalsigner: {
    type: Number
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
  timeCreated: {
    type: Date,
    default: () => Date.now()
  },
  timeSigned: {
    type: Date,
    default: () => Date.now()
  }
})

const Document = mongoose.model('documents', documentSchema)
module.exports = Document
