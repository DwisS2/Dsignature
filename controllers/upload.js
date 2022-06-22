const userSchema = require('../models/User')
const Document = require('../models/Document')
const documentSchema = require('../models/Document')

const index = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const users = await userSchema.find()
        res.render('upload', {
            layout: 'layouts/main-layout-login',
            title: 'Digital Sign',
            msg: req.flash('msg'),
            users
        })
    } else {
        res.redirect('/dsignature/signin')
    }
}

const uploaddocument = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        if (req.body.page === undefined) {
            req.flash(
                'msg',
                'Please select the signer first'
            )
            res.redirect('/dsignature/document/upload')
        } else if (req.body.email === 'Choose a signer') {
            req.flash(
                'msg',
                'Please select the signer first'
            )
            res.redirect('/dsignature/document/upload')
        } else {
            try {
                const user_id = req.session.user._id
                const base64document = req.files.document.data.toString('base64')
                const nama_document = req.files.document.name

                if (req.body.page.length == 2) {
                    const document = new Document({
                        id_user: user_id,
                        document: base64document,
                        nm_document: nama_document,
                        totalsigner: req.body.page.length,
                        requestsigner: [
                            {
                                page: req.body.page[0],

                                email: req.body.email[0]
                            },
                            {
                                page: req.body.page[1],

                                email: req.body.email[1]
                            }
                        ]
                    })
                    await document.save()
                } else if (req.body.page.length == 3) {
                    const document = new Document({
                        id_user: user_id,
                        document: base64document,
                        nm_document: nama_document,
                        totalsigner: req.body.page.length,
                        requestsigner: [
                            {
                                page: req.body.page[0],

                                email: req.body.email[0]
                            },
                            {
                                page: req.body.page[1],

                                email: req.body.email[1]
                            },
                            {
                                page: req.body.page[2],

                                email: req.body.email[2]
                            }
                        ]
                    })
                    await document.save()
                } else if (req.body.page.length == 4) {
                    const document = new Document({
                        id_user: user_id,
                        document: base64document,
                        nm_document: nama_document,
                        totalsigner: req.body.page.length,
                        requestsigner: [
                            {
                                page: req.body.page[0],

                                email: req.body.email[0]
                            },
                            {
                                page: req.body.page[1],

                                email: req.body.email[1]
                            },
                            {
                                page: req.body.page[2],

                                email: req.body.email[2]
                            },
                            {
                                page: req.body.page[3],

                                email: req.body.email[3]
                            }
                        ]
                    })
                    await document.save()
                } else if (req.body.page.length == 5) {
                    const document = new Document({
                        id_user: user_id,
                        document: base64document,
                        nm_document: nama_document,
                        totalsigner: req.body.page.length,
                        requestsigner: [
                            {
                                page: req.body.page[0],

                                email: req.body.email[0]
                            },
                            {
                                page: req.body.page[1],

                                email: req.body.email[1]
                            },
                            {
                                page: req.body.page[2],

                                email: req.body.email[2]
                            },
                            {
                                page: req.body.page[3],

                                email: req.body.email[3]
                            },
                            {
                                page: req.body.page[4],

                                email: req.body.email[4]
                            }
                        ]
                    })
                    await document.save()
                } else if (req.body.page.length > 5) {
                    req.flash(
                        'msg',
                        'Signature image added successfullyThe maximum limit for signing is five.'
                    )
                    res.redirect('/dsignature/document/upload')
                } else if (req.body.page.length == 1) {
                    const document = new Document({
                        id_user: user_id,
                        document: base64document,
                        nm_document: nama_document,
                        totalsigner: req.body.page.length,
                        requestsigner: {
                            page: req.body.page,

                            email: req.body.email
                        }
                    })
                    await document.save()
                }
                req.flash(
                    'msg',
                    'The document has been uploaded successfully'
                )
                res.redirect('/dsignature/document')
            } catch (error) {
                console.log(error)
                res.redirect('/dsignature/document/upload')
            }
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { index, uploaddocument }