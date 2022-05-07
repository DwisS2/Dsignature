const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const fs = require('fs')
const port = process.env.PORT || 5000
const upload = require('express-fileupload')
const verifyPDF = require('@ninja-labs/verify-pdf')
require('dotenv').config()
const mongoose = require('mongoose')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const User = require('./models/User')
const Signer = require('./models/Signer')
const Document = require('./models/Document')
const Signature = require('./models/Signature')
const Digital_certificate = require('./models/Certificate')
const bcrypt = require('bcryptjs')
var bodyParser = require('body-parser')
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
const signerSchema = require('./models/Signer')
const documentSchema = require('./models/Document')
const certificateSchema = require('./models/Certificate')
const signatureSchema = require('./models/Signature')

// const blogRouter = require('./routes/blogs')

const app = express()
app.use(morgan('dev'))
app.use(bodyParser.urlencoded({ extended: true }))
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
var sessionCheckerSigner = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/signer/home')
  } else {
    next()
  }
}

const initializePassport = require('./passport-config')
const { Certificate } = require('crypto')
initializePassport(
  passport,
  async email => {
    const userFound = await User.findOne({ email })
    return userFound
  },
  async id => {
    const userFound = await User.findOne({ _id: id })
    return userFound
  }
)

app.use(flash())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
)
app.use(passport.initialize())
app.use(passport.session())

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

app.use(express.urlencoded({ extended: true }))

//gunakan ejs
app.set('view engine', 'ejs')

// app.use(getRouter)
app.get('/index', sessionChecker, (req, res) => {
  res.render('index', { layout: 'layouts/main-layout', title: 'Digital Sign' })
})

app.get('/tes1', (req, res) => {
  res.render('pdfview', {
    layout: 'layouts/teslayout',
    title: 'Digital Sign'
  })
})

app.get('/signin', sessionChecker, (req, res) => {
  res.render('sign-in', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign',
    msg: req.flash('msg')
  })
})

app.get('/signer/signin', sessionCheckerSigner, (req, res) => {
  res.render('signers/sign-in', {
    layout: 'layouts/main-layout-login-signer',
    title: 'Digital Sign',
    msg: req.flash('msg')
  })
})

app.get('/staff', async (req, res) => {
  const users = await userSchema.find()
  const no = 1
  if (req.session.user && req.cookies.user_sid) {
    res.render('staff', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      users,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/signature', async (req, res) => {
  // const users = await userSchema.find()
  // const no = 1
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

    // const {
    //   pemKey,
    //   pemCertificate,
    //   commonName,
    //   validPeriod
    // } = p12.getPemFromP12(certificates[0].certificate, '12345678')

    // const validity1 = JSON.stringify(commonName.validity.notBefore).slice(1, 10)
    // const validity2 = JSON.stringify(commonName.validity.notAfter).slice(1, 10)

    const no = 1
    res.render('digitalsignature', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      certificates,
      // serialnumber: commonName.serialNumber,
      // validity3: validity1 + ' sampai ' + validity2,
      // nama: commonName.issuer.attributes[5].value,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/digitalcertificate/createcertificate', async (req, res) => {
  // const users = await userSchema.find()
  // const no = 1
  if (req.session.user && req.cookies.user_sid) {
    res.render('create_certificate', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign'
      // users,
      // msg: req.flash('msg')
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
      .populate('id_user')

    const no = 1
    res.render('dokumen', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      documents,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})
app.get('/document/signed_document', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const documents = await documentSchema
      .find({
        id_signer: req.session.user._id
      })
      .find({ status: 'signed' })
      .populate('id_signer')
      .populate('id_user')

    const no = 1
    res.render('signed_document', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      documents,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signin')
  }
})

app.get('/document/upload&sign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const certificates = await certificateSchema.find({
      id_user: req.session.user._id
    })

    if (!certificates[0]) {
      res.render('upload&sign', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificatenumber:
          'You dont have a digital certificate, please create a digital certificate first',
        msg: req.flash('msg'),
        certificates
      })
    } else if (certificates) {
      const certificatenumber2 = certificates[0].serialnumber
      res.render('upload&sign', {
        layout: 'layouts/main-layout-login',
        title: 'Digital Sign',
        certificatenumber: certificatenumber2,
        msg: req.flash('msg'),
        certificates
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

app.get('/signer', async (req, res, value) => {
  const signers = await signerSchema.find()
  const no = 1
  if (req.session.user && req.cookies.user_sid) {
    res.render('signer', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign',
      signers,
      msg: req.flash('msg')
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
      }
      user.comparePassword(password, (error, match) => {
        if (!match) {
          req.flash('msg', 'Password incorrect!')
          res.redirect('/signin')
        }
      })
      req.session.user = user
      res.redirect('/home')
    } catch (error) {
      console.log(error)
    }
  }
)

app.post(
  '/signer/signin',

  async (req, res) => {
    var email = req.body.email,
      password = req.body.password

    try {
      var user = await Signer.findOne({ email: email }).exec()
      // console.log(user)
      if (!user) {
        req.flash('msg', 'No user with that email!')
        res.redirect('/signer/signin')
      } else if (user.status != 'active') {
        req.flash('msg', 'Your account has not been confirmed by admin')
        res.redirect('/signer/signin')
      }
      user.comparePassword(password, (error, match) => {
        if (!match) {
          req.flash('msg', 'Password incorrect!')
          res.redirect('/signer/signin')
        }
      })
      req.session.user = user
      res.redirect('/signer/home')
    } catch (error) {
      console.log(error)
    }
  }
)

app.get('/register', sessionChecker, (req, res) => {
  res.render('sign-up', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign'
  })
})

app.get('/registersigner', sessionChecker, (req, res) => {
  res.render('register-signer', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign'
  })
})
// app.get('/editsigner', checkNotAuthenticated, (req, res) => {
//   res.render('editsigner', {
//     layout: 'layouts/main-layout-login',
//     title: 'Digital Sign'
//   })
// })
app.get('/verifikasi2', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render('verifikasi', {
      layout: 'layouts/main-layout-login',
      title: 'Digital Sign'
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
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        status: 'active',
        role: req.body.role,
        password: hashedPassword
      })

      await user.save()
      res.redirect('/signin')
    } catch (error) {
      console.log(error)
      res.redirect('/register')
    }
  }
})

app.post('/registersigner', async (req, res) => {
  // console.log(req.files)
  const userFound = await Signer.findOne({ email: req.body.email })

  if (userFound) {
    req.flash('error', 'User with that email already exists')
    res.redirect('/registersigner')
  } else {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      const signer = new Signer({
        name: req.body.name,
        email: req.body.email,
        nohp: req.body.nohp,
        password: hashedPassword,
        certificate: req.files.file.data,

        status: 'inactive'
      })

      await signer.save()
      res.redirect('/signin')
    } catch (error) {
      console.log(error)
      res.redirect('/registersigner')
    }
  }
})

// app.put('/signer', async (req, res) => {
//   console.log(req.files)
// })

app.put(
  '/signer',
  [
    body('certificate').custom(async (value, { req }) => {
      if (!req.files) {
        throw new Error('certificate digital wajib diisi')
      }
      return true
      // throw new Error('certificate digital wajib diisi asdasd')
    })
  ],
  async (req, res) => {
    // console.log(req.files)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.render('editsigner', {
        title: 'Form Ubah Data Contact',
        layout: 'layouts/main-layout-login',
        errors: errors.array(),
        signer: req.body
      })
    } else {
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        Signer.updateOne(
          { _id: req.body._id },
          {
            $set: {
              name: req.body.name,
              email: req.body.email,
              nohp: req.body.nohp,
              password: hashedPassword,
              certificate: req.files.certificate.data,
              status: req.body.status
            }
          }
        ).then(result => {
          req.flash('msg', 'Data Signer Berhasil Diubah!')
          res.redirect('/signer')
        })
      } catch (error) {
        console.log(error)
        res.redirect('/signer')
      }
    }
  }
)

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

app.get('/signer/home', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const documents = await documentSchema
      .find({ id_signer: req.session.user._id })
      .populate('id_user')
      .populate('id_signer')

    const no = 1
    res.render('signers/home', {
      layout: 'layouts/main-layout-signer',
      title: 'Digital Sign',
      documents,
      msg: req.flash('msg')
    })
  } else {
    res.redirect('/signer/signin')
  }
})
app.get('/document/upload&sign/:_id', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const document = await Document.findOne({ _id: req.params._id })
    const signature = await Signature.findOne({ id_user: req.session.user._id })

    res.render('viewpdf', {
      title: 'Digital Signature',
      layout: 'layouts/teslayout.ejs',
      document,
      signature,
      pdf: 'data:application/pdf;base64,' + document.document
    })
  } else {
    res.redirect('/signin')
  }
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

    const SIGNATURE_LENGTH = 4352

    ;(async () => {
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
        Rect: [57.64, 534.945, 480, 270],
        // Rect: [image.width,image.height, 0, 0],
        V: signatureDictRef,
        T: PDFString.of('Signature1'),
        F: 4,
        P: pages[0].ref
        // P: pages[pages.length - 1].ref, //lastPage
        // AP: pdfDoc.context.obj({N: signatureAppearanceStreamRef})
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
              status: 'signed',
              id_signer: req.session.user._id,
              timeSigned: Date.now()
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

app.post('/document/upload&sign', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    var number = req.body.serialnumber,
      password = req.body.certificate_password

    try {
      var user = await Digital_certificate.findOne({
        id_user: req.session.user._id
      }).exec()

      if (user.certificate_password != password) {
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
          status: 'in progress sign',
          certificate_number: number,
          timeSigned: ''
        })
        await document.save()
        const id_doc = document._id

        res.redirect('/document/upload&sign/' + id_doc)
      }
    } catch (error) {
      console.log(error)
      res.redirect('/document/upload&sign')
    }

    // const nama_document = req.files.file.name
    // const buffer_document = req.files.file.data
    // const status_document = 'in progress sign'
    // const user_id = req.session.user._id
    // const signer_id = signerEmail._id
    // try {
    //   const document = new Document({
    //     id_user: user_id,
    //     id_signer: signer_id,
    //     document: buffer_document,
    //     nm_document: nama_document,
    //     status: status_document
    //   })
    //   await document.save()
    //   res.redirect('/document')
    // } catch (error) {
    //   console.log(error)
    //   res.redirect('/document/upload&sign')
    // }
  } else {
    res.redirect('/signin')
  }
})
app.post('/signature', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const dataImagePrefix = 'data:image/png;base64,'
    const signaturetype = req.files.file.data
    const base64 = dataImagePrefix + signaturetype.toString('base64')

    const user_id = req.session.user._id
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
      }, 10000)
      res.redirect('/digitalcertificate')
    } catch (error) {
      console.log(error)
      res.redirect('/digitalsignature/createcertificate')
    }
  } else {
    res.redirect('/signin')
    // console.log(req.files.file.data)
  }
})

app.post('/hasilverifikasi', (req, res) => {
  // signedpdf = req.files
  namapdf = req.files.file.name
  bufferpdf = req.files.file.data

  const { verified, authenticity, integrity, expired, meta } = verifyPDF(
    bufferpdf
  )
  // console.log(expired)
  if (!integrity) {
    hasilpdf = 'Dokumen tidak memiliki tanda tangan digital'
  } else if (
    meta.certs[0].issuedTo.organizationName == 'SMAN 90 Jakarta Selatan'
  ) {
    hasilpdf = 'Tanda tangan digital pada dokumen valid'
  } else if (integrity == false) {
    hasilpdf = 'Dokumen tidak valid karna telah mengalami perubahan'
  } else {
    hasilpdf =
      'Tanda tangan digital valid namun bukan dikeluarkan oleh sistem SMAN 90 Jakarta'
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
    integritas = 'Dokumen tidak mengalami perubahan'
  } else {
    integritas = 'Dokumen telah mengalami perubahan'
  }

  res.render('hasilverifikasi', {
    layout: 'layouts/main-layout',
    title: 'Digital Sign'
  })

  // console.log(namapdf)
})
app.post('/hasilverifikasi2', (req, res) => {
  // signedpdf = req.files
  namapdf = req.files.file.name
  bufferpdf = req.files.file.data

  const { verified, authenticity, integrity, expired, meta } = verifyPDF(
    bufferpdf
  )
  // console.log(expired)
  if (!integrity) {
    hasilpdf = 'Dokumen tidak memiliki tanda tangan digital'
  } else if (
    meta.certs[0].issuedTo.organizationName == 'SMAN 90 Jakarta Selatan'
  ) {
    hasilpdf = 'Tanda tangan digital pada dokumen valid'
  } else if (integrity == false) {
    hasilpdf = 'Dokumen tidak valid karna telah mengalami perubahan'
  } else {
    hasilpdf =
      'Tanda tangan digital valid namun bukan dikeluarkan oleh sistem SMAN 90 Jakarta'
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
    integritas = 'Dokumen tidak mengalami perubahan'
  } else {
    integritas = 'Dokumen telah mengalami perubahan'
  }

  res.render('hasilverifikasi', {
    layout: 'layouts/main-layout-login',
    title: 'Digital Sign'
  })

  // console.log(namapdf)
})

// app.get('/hasilverifikasi', (req, res) => {
//   res.render('hasilverifikasi', {
//     layout: 'layouts/main-layout',
//     title: 'Digital Sign'
//   })
// })

// app.listen(port, () => {
//   console.log(`Digital Sign | listening at http://localhost:${port}`)
// })

app.get('/signer/edit/:name', async (req, res) => {
  const signer = await Signer.findOne({ name: req.params.name })
  if (req.session.user && req.cookies.user_sid) {
    res.render('editsigner', {
      title: 'Digital Signature',
      layout: 'layouts/main-layout-login',
      signer
    })
  } else {
    res.redirect('/signin')
  }
})

// app.delete('/logout', (req, res) => {
//   req.logOut()
//   res.redirect('/index')
// })

app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie('user_sid')
    res.redirect('/signin')
  } else {
    res.redirect('/signin')
  }
})

app.get('/signer/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie('user_sid')
    res.redirect('/signer/signin')
  } else {
    res.redirect('/signer/signin')
  }
})

app.delete('/signer', (req, res) => {
  Signer.deleteOne({ email: req.body.email }).then(result => {
    req.flash('msg', 'Data signer berhasil dihapus!')
    res.redirect('/signer')
  })
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

app.post('/signer/home/:_id', async (req, res) => {
  const dokumenPdf = await Document.findOne({
    _id: req.params._id
  }).populate('id_signer')
  const pdfBuffer = dokumenPdf.document
  const p12Buffer = dokumenPdf.id_signer.certificate

  const SIGNATURE_LENGTH = 3322

  ;(async () => {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pages = pdfDoc.getPages()
    const firstPage = pages[pages.length - 1]

    const pngImageBytes = fs.readFileSync('./signature1.png')
    const pngImage = await pdfDoc.embedPng(pngImageBytes)
    const pngDims = pngImage.scale(0.5)

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
      Rect: [57.64, 534.945, 480, 270],
      // Rect: [image.width,image.height, 0, 0],
      V: signatureDictRef,
      T: PDFString.of('Signature1'),
      F: 4,
      P: pages[0].ref
      // P: pages[pages.length - 1].ref, //lastPage
      // AP: pdfDoc.context.obj({N: signatureAppearanceStreamRef})
    })
    const widgetDictRef = pdfDoc.context.register(widgetDict)

    // Add our signature widget to the first page
    pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]))

    // Create an AcroForm object containing our signature widget
    pdfDoc.catalog.set(
      PDFName.of('AcroForm'),
      pdfDoc.context.obj({
        SigFlags: 3,
        Fields: [widgetDictRef]
      })
    )

    firstPage.drawImage(pngImage, {
      x: firstPage.getWidth() / 2 - pngDims.width / 2 + 75,
      y: firstPage.getHeight() / 2 - pngDims.height,
      width: pngDims.width,
      height: pngDims.height
    })

    const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false })
    const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes)

    const signObj = new signer.SignPdf()
    const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, p12Buffer, {
      passphrase: '123'
    })

    // Write the signed file
    // fs.writeFileSync('./signed6.pdf', signedPdfBuffer)
    // console.log(modifiedPdfBuffer)
    try {
      Document.updateOne(
        { _id: req.body._id },
        {
          $set: {
            document: signedPdfBuffer
          }
        }
      ).then(result => {
        req.flash('msg', 'Dokumen Berhasil Ditanda Tangan!')
        res.redirect('/signer/home')
      })
    } catch (error) {
      console.log(error)
      res.redirect('/signer/home')
    }
  })()

  // console.log(dokumenPdf.id_signer)
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
