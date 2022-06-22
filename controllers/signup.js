const User = require('../models/User')

const index = async (req, res) => {
    res.render('sign-up', {
        layout: 'layouts/main-layout',
        title: 'Digital Sign',
        msg: req.flash('msg')
    })
}

const signup = async (req, res) => {
    const userFound = await User.findOne({ email: req.body.email })
    if (userFound) {
        req.flash('error', 'User with that email already exists')
        res.redirect('/dsignature/signup')
    } else {
        try {
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                status: 'active',
                role: req.body.role,
                password: req.body.password
            })

            await user.save()
            req.flash('msg', 'Account registration has been successful')
            res.redirect('/dsignature/signin')
        } catch (error) {
            console.log(error)
            res.redirect('/dsignature/signup')
        }
    }
}

module.exports = { index, signup }