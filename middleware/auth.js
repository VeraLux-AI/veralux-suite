
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = { requireLogin };
