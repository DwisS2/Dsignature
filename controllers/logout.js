const logout = async (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid')
        res.redirect('/dsignature/signin')
    } else {
        res.redirect('/dsignature/signin')
    }
}

module.exports = { logout }