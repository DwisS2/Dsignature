const verifyPDF = require('@ninja-labs/verify-pdf')


const index = async (req, res) => {
    res.render('index', { layout: 'layouts/main-layout', title: 'Digital Sign', msg: req.flash('msg') })
}

const authentication = async (req, res) => {
    namapdf = req.files.file.name
    bufferpdf = req.files.file.data
    if (req.files.file.mimetype != 'application/pdf') {
        req.flash('msg', 'The selected file must be in PDF format!')
        res.redirect('/index')
    } else {
        const { verified, authenticity, integrity, expired, meta } = verifyPDF(
            bufferpdf
        )
        if (!integrity) {
            hasilpdf = 'The document does not have a digital signature'
        } else if (
            meta.certs[0].issuedTo.organizationName == 'SMAN 90 Jakarta Selatan'
        ) {
            hasilpdf = 'Digital signature on valid document'
        } else if (integrity == false) {
            hasilpdf = 'The document is not valid because it has been changed'
        } else {
            hasilpdf =
                'The digital signature is valid but not issued by the SMAN 90 Jakarta system'
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
            integritas = 'Documents have not changed'
        } else {
            integritas = 'Documents have not changed'
        }

        res.render('hasilverifikasi', {
            layout: 'layouts/main-layout',
            title: 'Digital Sign'
        })
    }
}

module.exports = { index, authentication };