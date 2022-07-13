const Document = require('../models/Document')
const Signature = require('../models/Signature')
const User = require('../models/User')
const Digital_certificate = require('../models/Certificate')
const documentSchema = require('../models/Document')
const {
    PDFDocument,
    PDFName,
    PDFNumber,
    PDFHexString,
    PDFString
} = require('pdf-lib')
const PDFArrayCustom = require('../PDFArrayCustom')
const signer = require('node-signpdf')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const savepdf = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const certificates = await Digital_certificate.find({
            id_user: req.session.user._id
        })

        const documents = await documentSchema
            .find({
                _id: req.body._id
            })
            .populate('id_user')

        const dok = req.body.pdfbase64
        const json = dok.substring(51)
        const pdfBuffer = json
        const p12Buffer = certificates[0].certificate_buffer

        const SIGNATURE_LENGTH = 4322
            ; (async () => {
                const pdfDoc = await PDFDocument.load(pdfBuffer)
                const pages = pdfDoc.getPages()

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

                pages[0].node.set(
                    PDFName.of('Annots'),
                    pdfDoc.context.obj([widgetDictRef])
                )

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
                const pdf = signedPdfBuffer.toString('base64')
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
                            res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/disignature/document/signature_request')
                        })
                    }
                } catch (error) {
                    console.log(error)
                    res.redirect('/dsignature/document/signature_request')
                }
            })()
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { index, savepdf }