const User = require('../models/User')

const index = async (req, res) => {
    res.render('sign-in', {
        layout: 'layouts/main-layout',
        title: 'Digital Sign',
        msg: req.flash('msg')
    })
}

const signin = async (req, res) => {
    var email = req.body.email,
        password = req.body.password

    try {
        var user = await User.findOne({ email: email }).exec()
        if (!user) {
            req.flash('msg', 'No user with that email!')
            res.redirect('/dsignature/signin')
        } else if (user.status != 'active') {
            req.flash('msg', 'Your account has not been confirmed by admin')
            res.redirect('/dsignature/signin')
        } else if (user.password != password) {
            req.flash('msg', 'Password incorrect!')
            res.redirect('/dsignature/signin')
        }

        req.session.user = user
        res.redirect('/dsignature/home')
    } catch (error) {
        console.log(error)
    }
}

module.exports = { index, signin }