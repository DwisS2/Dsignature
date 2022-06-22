const index = async (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
        title: 'Digital Sign',
        msg: req.flash('msg')
    })
}

module.exports = { index };