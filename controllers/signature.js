const signatureSchema = require('../models/Signature')
const Signature = require('../models/Signature')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const uploadsignature = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const user_id = req.session.user._id
        if (!req.files) {
            req.flash('msg', 'The signature is still empty')
            res.redirect('/dsignature/signature')
        } else if (req.files.file.mimetype != 'image/png') {
            req.flash('msg', 'File format must be PNG')
            res.redirect('/dsignature/signature')
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
                res.redirect('/dsignature/signature')
            } catch (error) {
                console.log(error)
                res.redirect('/dsignature/signature')
            }
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

const drawsignature = async (req, res) => {
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
            res.redirect('/dsignature/signature')
        } catch (error) {
            console.log(error)
            res.redirect('/dsignature/signature')
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

const deletesignature = async (req, res) => {
    Signature.deleteOne({ _id: req.body._id }).then(result => {
        req.flash('msg', 'Signature deleted successfully!')
        res.redirect('/dsignature/signature')
    })
}

module.exports = { index, uploadsignature, drawsignature, deletesignature }