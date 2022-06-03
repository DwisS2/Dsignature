const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const fs = require('fs')
const port = process.env.PORT || 5000
const upload = require('express-fileupload')
const verifyPDF = require('@ninja-labs/verify-pdf')
require('dotenv').config()
const mongoose = require('mongoose')

const flash = require('express-flash')
const session = require('express-session')
const User = require('./models/User')

const Document = require('./models/Document')

const Signature = require('./models/Signature')
const Digital_certificate = require('./models/Certificate')
const bcrypt = require('bcryptjs')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')
const signer = require('node-signpdf')
const p12 = require('p12-pem')

const {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString
} = require('pdf-lib')

const PDFArrayCustom = require('./PDFArrayCustom')

const { body, validationResult, check } = require('express-validator')
const {
  checkAuthenticated,
  checkNotAuthenticated
} = require('./middlewares/auth')
const userSchema = require('./models/User')

const documentSchema = require('./models/Document')
const certificateSchema = require('./models/Certificate')
const signatureSchema = require('./models/Signature')

const app = express()
app.use(morgan('dev'))

app.use(cookieParser())

app.use(
  session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  })
)

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid')
  }
  next()
})

var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/home')
  } else {
    next()
  }
}

app.use(flash())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
)

app.use(
  upload({
    createParentPath: true
  })
)

//setup method override
app.use(methodOverride('_method'))

// third party middleware
app.use(expressLayouts)

// built in moddleware
app.use(express.static('assets'))

//gunakan ejs
app.set('view engine', 'ejs')

app.use(express.urlencoded({ limit: '5mb', extended: true }))

// app.use(getRouter)
app.get('/index', sessionChecker, (req, res) => {
  res.render('index', { layout: 'layouts/main-layout', title: 'Digital Sign', msg: req.flash('msg') })
})

app.get('/signin', sessionChecker, (req, res) => {
  res.render('sign-in', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign',
    msg: req.flash('msg')
  })
})
app.get('/about', sessionChecker, (req, res) => {
  res.render('about', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign',
    msg: req.flash('msg')
  })
})

app.get('/signature', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const signatures = await signatureSchema.find({
      id_user: req.session.user._id
    })
    res.render('signature', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      signatures,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/digitalcertificate', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await certificateSchema.find({
      id_user: req.session.user._id
    })

    if (!certificates) {
      res.render('digitalsignature', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificates,
        msg: req.flash('msg')
      })
    }

    const no = 1
    res.render('digitalsignature', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      certificates,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/digitalcertificate/createcertificate', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render('create_certificate', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign'
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/document/detail/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const document = await Document.findOne({ _id: req.params._id })
    res.render('detaildocument', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      document
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/document', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const documents = await documentSchema
      .find({
        id_user: req.session.user._id
      })
      .sort({ timeCreated: -1 })


    if (documents.length === 0) {
      res.render('dokumen', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        documents,
        msg: req.flash('msg')
      })
    } else {
      const persen =
        Math.floor(100 / (documents.totalsigner / documents.alreadysigned)) +
        '%'

      res.render('dokumen', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        documents,
        persen,
        msg: req.flash('msg')
      })
    }
  } else {
    res.redirect('/signin')
  }
})
app.get('/document/signed_document', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const requests = await requestSchema
      .find({
        email: req.session.user.email,
        status: 'signed'
      })
      .populate('id_document')
      .populate('id_user')

    res.render('signed_document', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      requests,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/document/signature_request', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await certificateSchema.find({
      id_user: req.session.user._id
    })
    const signatures = await signatureSchema.find({
      id_user: req.session.user._id
    })
    const sessionemail = req.session.user.email
    const documents = await documentSchema
      .find({
        'requestsigner.email': req.session.user.email
      })
      .populate('id_user')
      .sort({ timeCreated: -1 })

    if (certificates == 0) {
      req.flash('msg', 'Please create a digital certificate first!')
      res.render('signature_request', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        documents,
        certificatenumber:
          'You dont have a digital certificate. Please create a digital certificate first!',
        sessionemail,
        signatures,
        certificates,
        msg: req.flash('msg')
      })
    } else if (signatures == 0) {
      const certificatenumber = certificates[0].serialnumber
      req.flash('msg', 'Please create a signature first!')
      res.render('signature_request', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        documents,
        certificatenumber,
        sessionemail,
        signatures,
        certificates,
        msg: req.flash('msg')
      })
    } else if (certificates) {
      const certificatenumber = certificates[0].serialnumber
      res.render('signature_request', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        documents,
        certificatenumber,
        sessionemail,
        signatures,
        certificates,
        msg: req.flash('msg')
      })
    }
  } else {
    res.redirect('/signin')
  }
})

app.get('/document/upload&sign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await certificateSchema.find({
      id_user: req.session.user._id
    })
    const signatures = await signatureSchema.find({
      id_user: req.session.user._id
    })

    if (!certificates[0]) {
      res.render('upload&sign', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificatenumber:
          'You dont have a digital certificate, please create a digital certificate first',
        msg: req.flash('msg'),
        certificates,
        signatures
      })
    } else if (!signatures[0]) {
      const certificatenumber2 = certificates[0].serialnumber
      req.flash('msg', 'Please create a Signature first!')
      res.render('upload&sign', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificatenumber: certificatenumber2,
        msg: req.flash('msg'),
        certificates,
        signatures
      })
    } else if (certificates) {
      const certificatenumber2 = certificates[0].serialnumber
      res.render('upload&sign', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificatenumber: certificatenumber2,
        msg: req.flash('msg'),
        certificates,
        signatures
      })
    }
  } else {
    res.redirect('/signin')
  }
})
app.get('/document/upload', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const users = await userSchema.find()
    res.render('upload', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      msg: req.flash('msg'),
      users
    })
  } else {
    res.redirect('/signin')
  }
})

app.post(
  '/signin',

  async (req, res) => {
    var email = req.body.email,
      password = req.body.password

    try {
      var user = await User.findOne({ email: email }).exec()
      // console.log(user)
      if (!user) {
        req.flash('msg', 'No user with that email!')
        res.redirect('/signin')
      } else if (user.status != 'active') {
        req.flash('msg', 'Your account has not been confirmed by admin')
        res.redirect('/signin')
      } else if (user.password != password) {
        req.flash('msg', 'Password incorrect!')
        res.redirect('/signin')
      }

      req.session.user = user
      res.redirect('/home')
    } catch (error) {
      console.log(error)
    }
  }
)

app.get('/register', sessionChecker, (req, res) => {
  res.render('sign-up', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign',
    msg: req.flash('msg')
  })
})

app.get('/verifikasi2', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render('verifikasi', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})

app.post('/register', async (req, res) => {
  const userFound = await User.findOne({ email: req.body.email })

  if (userFound) {
    req.flash('error', 'User with that email already exists')
    res.redirect('/register')
  } else {
    try {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        status: 'active',
        role: req.body.role,
        password: req.body.password
      })

      await user.save()
      req.flash('msg', 'Account registration has been successful')
      res.redirect('/signin')
    } catch (error) {
      console.log(error)
      res.redirect('/register')
    }
  }
})

app.get('/home', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render('home-2', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      nama: req.session.user.name
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/document/upload&sign/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const document = await Document.findOne({ _id: req.params._id })
    const signature = await Signature.findOne({ id_user: req.session.user._id })
    const signer = await User.findOne({ _id: req.session.user._id })

    res.render('viewpdf', {
      title: 'Digital Signature',
      layout: 'layouts/teslayout.ejs',
      document,
      signature,
      signer,
      pdf: 'data:application/pdf;base64,' + document.document
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/document/upload/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const document = await Document.findOne({ _id: req.params._id })
    const signature = await Signature.findOne({ id_user: req.session.user._id })
    const signer = await User.findOne({ _id: req.session.user._id })

    res.render('viewpdfupload', {
      title: 'Digital Signature',
      layout: 'layouts/teslayout.ejs',
      document,
      signature,
      signer,
      pdf: 'data:application/pdf;base64,' + document.document
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/doc/:docid/signer/:signerid', async (req, res) => {
  const document = await Document.findOne({ _id: req.params.docid }).populate(
    'id_user'
  )
  const signer = await User.findOne({ _id: req.params.signerid })
  console.log(signer)
  res.render('detailfromqrcode', {
    title: 'Digital Signature',
    layout: 'layouts/main-layout-qrcode',
    document,
    signer
  })
})

app.put('/savepdfsign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await Digital_certificate.find({
      id_user: req.session.user._id
    })

    const dok = req.body.pdfbase64

    const json = dok.substring(51)
    const pdfBuffer = json

    const p12Buffer = certificates[0].certificate_buffer
    const SIGNATURE_LENGTH = 4322
      ; (async () => {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()
        const firstPage = pages[pages.length - 1]
        const ByteRange = PDFArrayCustom.withContext(pdfDoc.context)
        ByteRange.push(PDFNumber.of(0))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))
        const signatureDict = pdfDoc.context.obj({
          Type: 'Sig',
          Filter: 'Adobe.PPKLite',
          SubFilter: 'adbe.pkcs7.detached',
          ByteRange,
          Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
          Reason: PDFString.of('We need your signature for reasons...'),
          M: PDFString.fromDate(new Date())
        })
        const signatureDictRef = pdfDoc.context.register(signatureDict)
        const widgetDict = pdfDoc.context.obj({
          Type: 'Annot',
          Subtype: 'Widget',
          FT: 'Sig',
          Rect: [0, 0, 0, 0],
          V: signatureDictRef,
          T: PDFString.of('Signature1'),
          F: 4,
          P: pages[0].ref
        })
        const widgetDictRef = pdfDoc.context.register(widgetDict)
        // Add our signature widget to the first page
        pages[0].node.set(
          PDFName.of('Annots'),
          pdfDoc.context.obj([widgetDictRef])
        )
        // Create an AcroForm object containing our signature widget
        pdfDoc.catalog.set(
          PDFName.of('AcroForm'),
          pdfDoc.context.obj({
            SigFlags: 3,
            Fields: [widgetDictRef]
          })
        )
        const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false })
        const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes)
        const signObj = new signer.SignPdf()
        const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, p12Buffer, {
          passphrase: certificates[0].certificate_password
        })
        const pdf = signedPdfBuffer.toString('base64') //PDF WORKS

        try {
          Document.updateOne(
            { _id: req.body._id },
            {
              $set: {
                document: pdf,

                id_signer: req.session.user._id,
                timeSigned: Date.now(),
                sign: [req.session.user.email],
                alreadysigned: 1,
                agree: [req.session.user.email]
              }
            }
          ).then(result => {
            req.flash('msg', 'Document successfully signed!')
            res.redirect('/document')
          })
        } catch (error) {
          console.log(error)
          res.redirect('/document/upload&sign/:_id')
        }
      })()
  } else {
    res.redirect('/signin')
  }
})

app.put('/savepdfsign2', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await Digital_certificate.find({
      id_user: req.session.user._id
    })

    const documents = await documentSchema
      .find({
        _id: req.body._id
      })
      .populate('id_user')

    const cert = certificates[0].serialnumber

    const dok = req.body.pdfbase64
    const json = dok.substring(51)
    const pdfBuffer = json
    const p12Buffer = certificates[0].certificate_buffer

    const SIGNATURE_LENGTH = 4322

      ; (async () => {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()
        const firstPage = pages[pages.length - 1]

        const ByteRange = PDFArrayCustom.withContext(pdfDoc.context)
        ByteRange.push(PDFNumber.of(0))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))
        ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER))

        const signatureDict = pdfDoc.context.obj({
          Type: 'Sig',
          Filter: 'Adobe.PPKLite',
          SubFilter: 'adbe.pkcs7.detached',
          ByteRange,
          Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
          Reason: PDFString.of('We need your signature for reasons...'),
          M: PDFString.fromDate(new Date())
        })

        const signatureDictRef = pdfDoc.context.register(signatureDict)

        const widgetDict = pdfDoc.context.obj({
          Type: 'Annot',
          Subtype: 'Widget',
          FT: 'Sig',
          Rect: [0, 0, 0, 0],

          V: signatureDictRef,
          T: PDFString.of('Signature1'),
          F: 4,
          P: pages[0].ref
        })
        const widgetDictRef = pdfDoc.context.register(widgetDict)

        // Add our signature widget to the first page
        pages[0].node.set(
          PDFName.of('Annots'),
          pdfDoc.context.obj([widgetDictRef])
        )

        // Create an AcroForm object containing our signature widget
        pdfDoc.catalog.set(
          PDFName.of('AcroForm'),
          pdfDoc.context.obj({
            SigFlags: 3,
            Fields: [widgetDictRef]
          })
        )

        const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false })
        const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes)

        const signObj = new signer.SignPdf()
        const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, p12Buffer, {
          passphrase: certificates[0].certificate_password
        })
        const pdf = signedPdfBuffer.toString('base64') //PDF WORKS
        try {
          const emailsign = documents[0].sign[0]
          const emailsign1 = documents[0].sign[1]
          const emailsign2 = documents[0].sign[2]
          const emailsign3 = documents[0].sign[3]
          const emailsign4 = documents[0].sign[4]
          const emailsign5 = documents[0].sign[5]
          const signuser = documents[0].alreadysigned
          if (!emailsign) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,

                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [req.session.user.email],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          } else if (!emailsign1) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,
                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [emailsign, req.session.user.email],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          } else if (!emailsign2) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,
                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [emailsign, emailsign1, req.session.user.email],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          } else if (!emailsign3) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,
                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [
                    emailsign,
                    emailsign1,
                    emailsign2,
                    req.session.user.email
                  ],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          } else if (!emailsign4) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,
                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [
                    emailsign,
                    emailsign1,
                    emailsign2,
                    emailsign3,
                    req.session.user.email
                  ],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          } else if (!emailsign5) {
            Document.updateOne(
              { _id: req.body._id },
              {
                $set: {
                  document: pdf,
                  id_signer: req.session.user._id,
                  timeSigned: Date.now(),
                  sign: [
                    emailsign,
                    emailsign1,
                    emailsign2,
                    emailsign3,
                    emailsign4,
                    req.session.user.email
                  ],
                  alreadysigned: signuser + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Document has been signed successfully')
              res.redirect('/document/signature_request')
            })
          }
        } catch (error) {
          console.log(error)
          res.redirect('/document/signature_request')
        }
      })()
  } else {
    res.redirect('/signin')
  }
})

app.post('/document/upload&sign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    var number = req.body.serialnumber,
      password = req.body.certificate_password

    try {
      var user = await Digital_certificate.findOne({
        id_user: req.session.user._id
      }).exec()
      if (!user) {
        req.flash(
          'msg',
          'You dont have a digital certificate. Please make a digital certificate first!'
        )
        res.redirect('/document/upload&sign')
      } else if (user.certificate_password != password) {
        req.flash('msg', 'Password incorrect!')
        res.redirect('/document/upload&sign')
      } else {
        const user_id = req.session.user._id
        const base64document = req.files.document.data.toString('base64')
        const nama_document = req.files.document.name
        const document = new Document({
          id_user: user_id,
          document: base64document,
          nm_document: nama_document,
          totalsigner: 1,
          certificate_number: number,
          timeSigned: '',
          requestsigner: {
            page: '',
            email: ''
          }
        })
        await document.save()
        const id_doc = document._id

        res.redirect('/document/upload&sign/' + id_doc)
      }
    } catch (error) {
      console.log(error)
      res.redirect('/document/upload&sign')
    }
  } else {
    res.redirect('/signin')
  }
})

app.post('/document/upload', async (req, res) => {

  if (req.session.user && req.cookies.user_sid) {
    if (req.body.page === undefined) {
      req.flash(
        'msg',
        'Please select the signer first'
      )
      res.redirect('/document/upload')
    } else if (req.body.email === 'Choose a signer') {
      req.flash(
        'msg',
        'Please select the signer first'
      )
      res.redirect('/document/upload')
    } else {
      try {
        const user_id = req.session.user._id
        const base64document = req.files.document.data.toString('base64')
        const nama_document = req.files.document.name

        if (req.body.page.length == 2) {
          const document = new Document({
            id_user: user_id,
            document: base64document,
            nm_document: nama_document,
            totalsigner: req.body.page.length,
            requestsigner: [
              {
                page: req.body.page[0],

                email: req.body.email[0]
              },
              {
                page: req.body.page[1],

                email: req.body.email[1]
              }
            ]
          })
          await document.save()
        } else if (req.body.page.length == 3) {
          const document = new Document({
            id_user: user_id,
            document: base64document,
            nm_document: nama_document,
            totalsigner: req.body.page.length,
            requestsigner: [
              {
                page: req.body.page[0],

                email: req.body.email[0]
              },
              {
                page: req.body.page[1],

                email: req.body.email[1]
              },
              {
                page: req.body.page[2],

                email: req.body.email[2]
              }
            ]
          })
          await document.save()
        } else if (req.body.page.length == 4) {
          const document = new Document({
            id_user: user_id,
            document: base64document,
            nm_document: nama_document,
            totalsigner: req.body.page.length,
            requestsigner: [
              {
                page: req.body.page[0],

                email: req.body.email[0]
              },
              {
                page: req.body.page[1],

                email: req.body.email[1]
              },
              {
                page: req.body.page[2],

                email: req.body.email[2]
              },
              {
                page: req.body.page[3],

                email: req.body.email[3]
              }
            ]
          })
          await document.save()
        } else if (req.body.page.length == 5) {
          const document = new Document({
            id_user: user_id,
            document: base64document,
            nm_document: nama_document,
            totalsigner: req.body.page.length,
            requestsigner: [
              {
                page: req.body.page[0],

                email: req.body.email[0]
              },
              {
                page: req.body.page[1],

                email: req.body.email[1]
              },
              {
                page: req.body.page[2],

                email: req.body.email[2]
              },
              {
                page: req.body.page[3],

                email: req.body.email[3]
              },
              {
                page: req.body.page[4],

                email: req.body.email[4]
              }
            ]
          })
          await document.save()
        } else if (req.body.page.length > 5) {
          req.flash(
            'msg',
            'Signature image added successfullyThe maximum limit for signing is five.'
          )
          res.redirect('/document/upload')
        } else if (req.body.page.length == 1) {
          const document = new Document({
            id_user: user_id,
            document: base64document,
            nm_document: nama_document,
            totalsigner: req.body.page.length,
            requestsigner: {
              page: req.body.page,

              email: req.body.email
            }
          })
          await document.save()
        }
        req.flash(
          'msg',
          'The document has been uploaded successfully'
        )
        res.redirect('/document')
      } catch (error) {
        console.log(error)
        res.redirect('/document/upload')
      }
    }
  } else {
    res.redirect('/signin')
  }
})

app.post('/signature', async (req, res) => {

  if (req.session.user && req.cookies.user_sid) {

    const user_id = req.session.user._id
    if (!req.files) {
      req.flash('msg', 'The signature is still empty')
      res.redirect('/signature')
    } else if (req.files.file.mimetype != 'image/png') {
      req.flash('msg', 'File format must be PNG')
      res.redirect('/signature')
    } else {
      const dataImagePrefix = 'data:image/png;base64,'
      const signaturetype = req.files.file.data
      const base64 = dataImagePrefix + signaturetype.toString('base64')

      try {
        const signature = new Signature({
          id_user: user_id,
          img: base64
        })
        await signature.save()
        req.flash('msg', 'Signature image added successfully!')
        res.redirect('/signature')
      } catch (error) {
        console.log(error)
        res.redirect('/signature')
      }
    }
  } else {
    res.redirect('/signin')
  }
})
app.post('/signature2', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const signaturebase64 = req.body.signature2

    const user_id = req.session.user._id
    try {
      const signature = new Signature({
        id_user: user_id,
        img: signaturebase64
      })
      await signature.save()
      req.flash('msg', 'Signature image added successfully!')
      res.redirect('/signature')
    } catch (error) {
      console.log(error)
      res.redirect('/signature')
    }
  } else {
    res.redirect('/signin')
  }
})

app.post('/digitalsignature/createcertificate', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const validity = req.body.validity
    const password = req.body.password
    const nama = req.session.user.name
    const email = req.session.user.email
    const namap12 = nama + '.p12'

    try {
      var KEYTOOL_COMMAND = './assets/file/keytool.exe'
      var ktArgs = [
        '-genkey',
        '-v',
        '-keystore',
        namap12,
        '-alias',
        'test',
        '-dname',
        'CN=' +
        nama +
        ', OU=SMAN 90 Jakarta Selatan, EMAILADDRESS=' +
        email +
        ', O=SMAN 90 Jakarta Selatan, L=Jakarta Selatan, S=Jakarta Selatan, C=ID',
        '-keyalg',
        'RSA',
        '-keysize',
        '2048',
        '-validity',
        validity
      ]

      var spawn = require('child_process').spawn

      var cmd = spawn(KEYTOOL_COMMAND, ktArgs)
      cmd.stdout.on('data', function (data) {
        console.log('stdout: ' + data)
      })

      cmd.stderr.setEncoding('utf8')
      cmd.stderr.on('data', function (data) {
        cmd.stdin.write(password + '\n')
      })

      cmd.on('close', function (code) {
        console.log('child process exited with code ' + code)
      })

      setTimeout(() => {
        const {
          pemKey,
          pemCertificate,
          commonName,
          validPeriod
        } = p12.getPemFromP12(namap12, req.body.password)

        const validity1 = JSON.stringify(commonName.validity.notBefore).slice(
          1,
          10
        )
        const validity2 = JSON.stringify(commonName.validity.notAfter).slice(
          1,
          10
        )

        const certificate = new Digital_certificate({
          id_user: req.session.user._id,
          serialnumber: commonName.serialNumber,
          validity: validity1 + ' sampai ' + validity2,
          name: commonName.issuer.attributes[5].value,
          certificate_buffer: fs.readFileSync(namap12),
          certificate_password: req.body.password,
          status: 'active'
        })

        certificate.save()
        fs.unlink(namap12, function (err) {
          if (err) throw err
          // if no error, file has been deleted successfully
          console.log('File deleted!')
        })
        res.redirect('/digitalcertificate')
      }, 10000)
    } catch (error) {
      console.log(error)
      res.redirect('/digitalsignature/createcertificate')
    }
  } else {
    res.redirect('/signin')
  }
})

app.post('/hasilverifikasi', sessionChecker, (req, res) => {
  namapdf = req.files.file.name
  bufferpdf = req.files.file.data
  if (req.files.file.mimetype != 'application/pdf') {
    req.flash('msg', 'The selected file must be in PDF format!')
    res.redirect('/index')
  } else {
    const { verified, authenticity, integrity, expired, meta } = verifyPDF(
      bufferpdf
    )
    if (!integrity) {
      hasilpdf = 'The document does not have a digital signature'
    } else if (
      meta.certs[0].issuedTo.organizationName == 'SMAN 90 Jakarta Selatan'
    ) {
      hasilpdf = 'Digital signature on valid document'
    } else if (integrity == false) {
      hasilpdf = 'The document is not valid because it has been changed'
    } else {
      hasilpdf =
        'The digital signature is valid but not issued by the SMAN 90 Jakarta system'
    }
    if (!integrity) {
      namapenandatangan = ' '
    } else {
      namapenandatangan = meta.certs[0].issuedTo.commonName
    }
    if (!integrity) {
      emailpenandatangan = ' '
    } else {
      emailpenandatangan = meta.certs[0].issuedTo.emailAddress
    }
    if (!integrity) {
      lokasi = ' '
    } else {
      lokasi = meta.certs[0].issuedTo.localityName
    }
    if (!integrity) {
      organisasi = ' '
    } else {
      organisasi = meta.certs[0].issuedTo.organizationName
    }
    if (!integrity) {
      integritas = ' '
    } else if (integrity == true) {
      integritas = 'Documents have not changed'
    } else {
      integritas = 'Documents have not changed'
    }

    res.render('hasilverifikasi', {
      layout: 'layouts/main-layout',
      title: 'Digital Sign'
    })
  }
})
app.post('/hasilverifikasi2', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    namapdf = req.files.file.name
    bufferpdf = req.files.file.data

    if (req.files.file.mimetype != 'application/pdf') {
      req.flash('msg', 'The selected file must be in PDF format!')
      res.redirect('/verifikasi2')
    } else {

      const { verified, authenticity, integrity, expired, meta } = verifyPDF(
        bufferpdf
      )
      if (!integrity) {
        hasilpdf = 'The document does not have a digital signature'
      } else if (
        meta.certs[0].issuedTo.organizationName == 'SMAN 90 Jakarta Selatan'
      ) {
        hasilpdf = 'Digital signature on valid document'
      } else if (integrity == false) {
        hasilpdf = 'The document is not valid because it has been changed'
      } else {
        hasilpdf =
          'The digital signature is valid but not issued by the SMAN 90 Jakarta system'
      }
      if (!integrity) {
        namapenandatangan = ' '
      } else {
        namapenandatangan = meta.certs[0].issuedTo.commonName
      }
      if (!integrity) {
        emailpenandatangan = ' '
      } else {
        emailpenandatangan = meta.certs[0].issuedTo.emailAddress
      }
      if (!integrity) {
        lokasi = ' '
      } else {
        lokasi = meta.certs[0].issuedTo.localityName
      }
      if (!integrity) {
        organisasi = ' '
      } else {
        organisasi = meta.certs[0].issuedTo.organizationName
      }
      if (!integrity) {
        integritas = ' '
      } else if (integrity == true) {
        integritas = 'Documents have not changed'
      } else {
        integritas = 'Documents have not changed'
      }

      res.render('hasilverifikasi', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign'
      })
    }
  } else {
    res.redirect('/signin')
  }
})

app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie('user_sid')
    res.redirect('/signin')
  } else {
    res.redirect('/signin')
  }
})

app.delete('/document', (req, res) => {

  Document.deleteOne({ _id: req.body._id }).then(result => {
    req.flash('msg', 'Document deleted successfully!')
    res.redirect('/document')
  })
})
app.delete('/certificate', (req, res) => {
  Digital_certificate.deleteOne({ _id: req.body._id }).then(result => {
    req.flash('msg', 'Certificate deleted successfully!')
    res.redirect('/digitalcertificate')
  })
})
app.delete('/signature', (req, res) => {
  Signature.deleteOne({ _id: req.body._id }).then(result => {
    req.flash('msg', 'Signature deleted successfully!')
    res.redirect('/signature')
  })
})

app.post('/document/download/:_id', async (req, res) => {
  const dokumenPdf = await Document.findOne({
    _id: req.params._id
  })
  const bufferDokumen = dokumenPdf.document
  const download = Buffer.from(bufferDokumen, 'base64')
  res.setHeader(
    'Content-disposition',
    'inline; filename="' + dokumenPdf.nm_document + '.pdf"'
  )
  res.setHeader('Content-type', 'application/pdf')
  res.end(download)
})
app.post('/document/detail/view/:_id', async (req, res) => {
  const dokumenPdf = await Document.findOne({
    _id: req.params._id
  })
  const bufferDokumen = dokumenPdf.document
  const download = Buffer.from(bufferDokumen, 'base64')
  res.setHeader(
    'Content-disposition',
    'inline; filename="' + dokumenPdf.nm_document + '.pdf"'
  )
  res.setHeader('Content-type', 'application/pdf')
  res.end(download)
})

app.post('/document/signature_request/download/:_id', async (req, res) => {
  const documents = await Document.findOne({
    _id: req.params._id
  })

  const bufferDokumen = documents.document
  const download = Buffer.from(bufferDokumen, 'base64')
  res.setHeader(
    'Content-disposition',
    'inline; filename="' + documents.nm_document + '.pdf"'
  )
  res.setHeader('Content-type', 'application/pdf')
  res.end(download)
})

app.post('/document/signature_request/sign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    var number = req.body.serialnumber,
      password = req.body.password

    try {
      var user = await Digital_certificate.findOne({
        id_user: req.session.user._id
      }).exec()
      if (!user) {
        req.flash('msg', 'You dont have a digital certificate. ')
        res.redirect('/document/signature_request')
      } else if (user.certificate_password != password) {
        req.flash('msg', 'Password incorrect!')
        res.redirect('/document/signature_request')
      } else {
        const id_doc = req.body.id
        res.redirect('/document/upload/' + id_doc)
      }
    } catch (error) {
      console.log(error)
      res.redirect('/document/signature_request')
    }
  } else {
    res.redirect('/signin')
  }
})

app.post('/document/signature_request/agree/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const documents = await Document.findOne({
      _id: req.params._id
    })

    for (let i = 0; i < documents.totalsigner; i++) {
      if (documents.requestsigner[i].email == req.session.user.email) {
        const emailagree = documents.agree[0]
        const emailagree2 = documents.agree[1]
        const emailagree3 = documents.agree[2]
        const emailagree4 = documents.agree[3]
        const emailagree5 = documents.agree[4]
        if (documents.agree == 0) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
        else if (documents.agree.length == 1) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [emailagree, req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
        else if (documents.agree.length == 2) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [emailagree, emailagree2, req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
        else if (documents.agree.length == 3) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [emailagree, emailagree2, emailagree3, req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
        else if (documents.agree.length == 4) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [emailagree, emailagree2, emailagree3, emailagree4, req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
        else if (documents.agree.length == 5) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  agree: [emailagree, emailagree2, emailagree3, emailagree4, emailagree5, req.session.user.email]
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been approved')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
      }
    }
  } else {
    res.redirect('/signin')
  }
})
app.post('/document/signature_request/reject/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const documents = await Document.findOne({
      _id: req.params._id
    })

    for (let i = 0; i < documents.totalsigner; i++) {
      if (documents.requestsigner[i].email == req.session.user.email) {

        const emailreject = documents.reject[0]
        const emailreject2 = documents.reject[1]
        const emailreject3 = documents.reject[2]
        const emailreject4 = documents.reject[3]
        const emailreject5 = documents.reject[4]

        console.log(documents.reject.length)
        const ttlreject = documents.totalreject
        if (documents.reject == 0) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        } else if (documents.reject.length == 1) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [emailreject, req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        } else if (documents.reject.length == 2) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [emailreject, emailreject2, req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        } else if (documents.reject.length == 3) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [emailreject, emailreject2, emailreject3, req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        } else if (documents.reject.length == 4) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [emailreject, emailreject2, emailreject3, emailreject4, req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        } else if (documents.reject.length == 5) {
          try {
            Document.updateOne(
              { _id: req.params._id },
              {
                $set: {
                  reject: [emailreject, emailreject2, emailreject3, emailreject4, emailreject5, req.session.user.email],
                  totalreject: ttlreject + 1
                }
              }
            ).then(result => {
              req.flash('msg', 'Request has been rejected')
              res.redirect('/document/signature_request')
            })
          } catch (error) {
            console.log(error)
            res.redirect('/document/signature_request')
          }
        }
      }
    }
  } else {
    res.redirect('/signin')
  }
})

mongoose
  .connect('mongodb://localhost:27017/dsignature', {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  })
