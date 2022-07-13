const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const methodOverride = require('method-override')
const port = process.env.PORT || 5000
const upload = require('express-fileupload')
require('dotenv').config()
const mongoose = require('mongoose')
const flash = require('express-flash')
const session = require('express-session')
var cookieParser = require('cookie-parser')
var morgan = require('morgan')
const getRouter = require("./routers/router");
const database = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digitalsignature'
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

app.use(flash())

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

app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.use("/dsignature", getRouter);

const p12 = require('p12-pem')
app.post('/tes1', async (req, res) => {
  const {
    pemKey,
    pemCertificate,
    commonName,
    validPeriod
} = p12.getPemFromP12('./cert11.p12', '12345678')
res.send(pemCertificate)
})

mongoose
  .connect(database, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  })
