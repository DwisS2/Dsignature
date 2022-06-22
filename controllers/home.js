const index = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.render('home-2', {
            layout: 'layouts/main-layout-login',
            title: 'Digital Sign',
            nama: req.session.user.name
        })
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { index }