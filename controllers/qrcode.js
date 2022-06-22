const Document = require('../models/Document')
const User = require('../models/User')


const index = async (req, res) => {
    const document = await Document.findOne({ _id: req.params.docid }).populate(
        'id_user'
    )
    const signer = await User.findOne({ _id: req.params.signerid })
    res.render('detailfromqrcode', {
        title: 'Digital Signature',
        layout: 'layouts/main-layout-qrcode',
        document,
        signer
    })
}

module.exports = { index }