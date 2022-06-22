const ControllerIndex = require("../controllers/index");
const ControllerAbout = require("../controllers/about");
const ControllerHome = require("../controllers/home");
const ControllerSignin = require("../controllers/signin");
const ControllerSignup = require("../controllers/signup");
const ControllerLogout = require("../controllers/logout");
const ControllerAuthentication = require("../controllers/authentication");
const ControllerSignature = require("../controllers/signature");
const ControllerDigitalcertificate = require("../controllers/digitalcertificate");
const ControllerCreatecertificate = require("../controllers/createcertificate");
const ControllerDocument = require("../controllers/document");
const ControllerSignaturerequest = require("../controllers/signaturerequest");
const ControllerUpload = require("../controllers/upload");
const ControllerSigndocument = require("../controllers/signdocument");
const ControllerUploadsign = require("../controllers/upload&sign");
const ControllerSigndocumentalone = require("../controllers/signdocumentalone");
const ControllerQrcode = require("../controllers/qrcode");

const express = require("express");
const router = express.Router();
const session = require('express-session')
const app = express()

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
        res.redirect('/dsignature/home')
    } else {
        next()
    }
}

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
)

router.get("/index", sessionChecker, ControllerIndex.index);
router.post("/authentication", sessionChecker, ControllerIndex.authentication);

router.get("/about", sessionChecker, ControllerAbout.index);

router.get("/home", ControllerHome.index);

router.get("/signin", sessionChecker, ControllerSignin.index);
router.post("/signin", ControllerSignin.signin);

router.get("/logout", ControllerLogout.logout);

router.get("/signup", sessionChecker, ControllerSignup.index);
router.post("/signup", ControllerSignup.signup);

router.get("/authentication", ControllerAuthentication.index);
router.post("/authenticationresult", ControllerAuthentication.authentication);

router.get("/signature", ControllerSignature.index);
router.post("/uploadsignature", ControllerSignature.uploadsignature);
router.post("/drawsignature", ControllerSignature.drawsignature);
router.delete("/deletesignature", ControllerSignature.deletesignature);

router.get("/digitalcertificate", ControllerDigitalcertificate.index);
router.delete("/deletecertificate", ControllerDigitalcertificate.deletecertificate);

router.get("/digitalcertificate/createcertificate", ControllerCreatecertificate.index);
router.post("/digitalcertificate/createcertificate", ControllerCreatecertificate.createcertificate);

router.get("/document", ControllerDocument.index);
router.post("/document/download/:_id", ControllerDocument.downloaddocument);
router.get("/document/detail/:_id", ControllerDocument.detaildocument);
router.delete("/document/delete", ControllerDocument.deletedocument);

router.get("/document/signature_request", ControllerSignaturerequest.index);
router.get("/document/signature_request/detail/:_id", ControllerSignaturerequest.detaildocument);
router.post("/document/signature_request/download/:_id", ControllerSignaturerequest.downloaddocument);
router.post("/document/signature_request/detail/:_id", ControllerSignaturerequest.viewdocument);
router.post("/document/signature_request/agree/:_id", ControllerSignaturerequest.agreedocument);
router.post("/document/signature_request/reject/:_id", ControllerSignaturerequest.rejectdocument);
router.post("/document/signature_request/sign", ControllerSignaturerequest.signdocument);

router.get("/document/upload", ControllerUpload.index);
router.post("/document/upload", ControllerUpload.uploaddocument);

router.get("/document/sign/:_id", ControllerSigndocument.index);
router.put("/document/sign/savepdf", ControllerSigndocument.savepdf);


router.get("/document/upload&sign", ControllerUploadsign.index);
router.post("/document/upload&sign", ControllerUploadsign.uploadpdf);

router.get("/document/upload&sign/:_id", ControllerSigndocumentalone.index);
router.put("/document/sign/savepdfsignalone", ControllerSigndocumentalone.savepdf);

router.get("/doc/:docid/signer/:signerid", ControllerQrcode.index);

module.exports = router;