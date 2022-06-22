const certificateSchema = require('../models/Certificate')
const signatureSchema = require('../models/Signature')
const Digital_certificate = require('../models/Certificate')
const Document = require('../models/Document')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const uploadpdf = async (req, res) => {
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
                res.redirect('/dsignature/document/upload&sign')
            } else if (user.certificate_password != password) {
                req.flash('msg', 'Password incorrect!')
                res.redirect('/dsignature/document/upload&sign')
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

                res.redirect('/dsignature/document/upload&sign/' + id_doc)
            }
        } catch (error) {
            console.log(error)
            res.redirect('/dsignature/document/upload&sign')
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { index, uploadpdf }