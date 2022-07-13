const p12 = require('p12-pem')
const fs = require('fs')
const Digital_certificate = require('../models/Certificate')

const index = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.render('create_certificate', {
            layout: 'layouts/main-layout-login',
            title: 'Digital Sign'
        })
    } else {
        res.redirect('/dsignature/signin')
    }
}

const createcertificate = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        const validity = req.body.validity
        const password = req.body.password
        const nama = req.session.user.name
        const email = req.session.user.email
        const namap12 = nama + '.p12'
        try {
            var KEYTOOL_COMMAND = 'C:\\Program Files\\Java\\jdk1.8.0_333\\bin\\keytool'
            var ktArgs = [
                '-genkey',
                '-alias',
                'tesss',
                '-keyalg',
                'RSA',
                '-keysize',
                '2048',
                '-storetype',
                'PKCS12',
                '-keystore',
                namap12,
                '-validity',
                validity,
                '-v',
                '-dname',
                'CN=' +
                nama +
                ', OU=SMAN 90 Jakarta Selatan, EMAILADDRESS=' +
                email +
                ', O=SMAN 90 Jakarta Selatan, L=Jakarta Selatan, S=Jakarta Selatan, C=ID',
            ]
            var spawn = require('child_process').spawn
            var cmd = spawn(KEYTOOL_COMMAND, ktArgs)
            cmd.stdout.on('data', function (data) {
                console.log('stdout: ' + data)
            })
            cmd.stderr.setEncoding('utf8')
            cmd.stderr.on('data', function (data) {
                cmd.stdin.write(password + '\n')
            })
            cmd.on('close', function (code) {
                console.log('child process exited with code ' + code)
            })
            setTimeout(() => {
                const {
                    pemKey,
                    pemCertificate,
                    commonName,
                    validPeriod
                } = p12.getPemFromP12(namap12, req.body.password)
                const validity1 = JSON.stringify(commonName.validity.notBefore).slice(
                    1,
                    11
                )
                const validity2 = JSON.stringify(commonName.validity.notAfter).slice(
                    1,
                    11
                )
                const certificate = new Digital_certificate({
                    id_user: req.session.user._id,
                    serialnumber: commonName.serialNumber,
                    validity: validity1 + ' sampai ' + validity2,
                    name: commonName.issuer.attributes[5].value,
                    certificate_buffer: fs.readFileSync(namap12),
                    certificate_password: req.body.password,
                    status: 'active'
                })
                certificate.save()
                fs.unlink(namap12, function (err) {
                    if (err) throw err
                    console.log('File deleted!')
                })
                res.redirect('/dsignature/digitalcertificate')
            }, 10000)
        } catch (error) {
            console.log(error)
            res.redirect('/dsignature/digitalsignature/createcertificate')
        }
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { index, createcertificate }