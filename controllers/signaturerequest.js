const Digital_certificate = require('../models/Certificate')
const certificateSchema = require('../models/Certificate')
const signatureSchema = require('../models/Signature')
const documentSchema = require('../models/Document')
const Document = require('../models/Document')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const downloaddocument = async (req, res) => {
    const documents = await Document.findOne({
        _id: req.params._id
    })

    const bufferDokumen = documents.document
    const download = Buffer.from(bufferDokumen, 'base64')
    res.setHeader(
        'Content-disposition',
        'inline; filename="' + documents.nm_document + '.pdf"'
    )
    res.send(download)
}

const viewdocument = async (req, res) => {
    const documents = await Document.findOne({
        _id: req.params._id
    })

    const bufferDokumen = documents.document
    const download = Buffer.from(bufferDokumen, 'base64')
    res.setHeader(
        'Content-disposition',
        'inline; filename="' + documents.nm_document + '.pdf"'
    )
    res.end(download)
}

const signdocument = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
            password = req.body.password

        try {
            var user = await Digital_certificate.findOne({
                id_user: req.session.user._id
            }).exec()
            if (!user) {
                req.flash('msg', 'You dont have a digital certificate. ')
                res.redirect('/dsignature/document/signature_request')
            } else if (user.certificate_password != password) {
                req.flash('msg', 'Password incorrect!')
                res.redirect('/dsignature/document/signature_request')
            } else {
                const id_doc = req.body.id
                res.redirect('/dsignature/document/sign/' + id_doc)
            }
        } catch (error) {
            console.log(error)
            res.redirect('/dsignature/document/signature_request')
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

const agreedocument = async (req, res) => {
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
                    }
                }
            }
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

const rejectdocument = async (req, res) => {
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
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
                            res.redirect('/dsignature/document/signature_request')
                        })
                    } catch (error) {
                        console.log(error)
                        res.redirect('/dsignature/document/signature_request')
                    }
                }
            }
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

const detaildocument = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const document = await Document.findOne({ _id: req.params._id })
        res.render('detaildoc_signreq', {
            layout: 'layouts/main-layout-login',
            title: 'Digital Sign',
            document
        })
    } else {
        res.redirect('/dsignature/signin')
    }
}



module.exports = { index, downloaddocument, signdocument, agreedocument, rejectdocument, detaildocument, viewdocument }