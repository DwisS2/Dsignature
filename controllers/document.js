const Document = require('../models/Document')
const documentSchema = require('../models/Document')

const index = async (req, res) => {
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
        res.redirect('/dsignature/signin')
    }
}

const downloaddocument = async (req, res) => {
    const dokumenPdf = await Document.findOne({
        _id: req.params._id
    })
    const bufferDokumen = dokumenPdf.document
    const download = Buffer.from(bufferDokumen, 'base64')
    res.setHeader(
        'Content-disposition',
        'inline; filename="' + dokumenPdf.nm_document + '.pdf"'
    )
    res.send(download)
}

const deletedocument = async (req, res) => {
    Document.deleteOne({ _id: req.body._id }).then(result => {
        req.flash('msg', 'Document deleted successfully!')
        res.redirect('/dsignature/document')
    })
}

const detaildocument = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const document = await Document.findOne({ _id: req.params._id })
        res.render('detaildocument', {
            layout: 'layouts/main-layout-login',
            title: 'Digital Sign',
            document
        })
    } else {
        res.redirect('/dsignature/signin')
    }
}



module.exports = { index, downloaddocument, deletedocument, detaildocument }