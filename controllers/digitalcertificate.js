const Digital_certificate = require('../models/Certificate')
const certificateSchema = require('../models/Certificate')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const deletecertificate = async (req, res) => {
    Digital_certificate.deleteOne({ _id: req.body._id }).then(result => {
        req.flash('msg', 'Certificate deleted successfully!')
        res.redirect('/digitalcertificate')
    })
}

module.exports = { index, deletecertificate }