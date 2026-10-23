const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    const { username, email, password } = req.body.user;
    let registeredUser;
    try {
        registeredUser = await User.register(new User({ username, email }), password);
    } catch (error) {
        if (error.name === "UserExistsError" || error.code === 11000) {
            req.flash("error", "That username or email is already registered.");
            return res.redirect("/signup");
        }
        throw error;
    }

    req.login(registeredUser, (error) => {
        if (error) {
            return next(error);
        }
        req.flash("success", `Welcome to WanderLust, ${username}!`);
        res.redirect("/listings");
    });
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
    const redirectUrl = req.session.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    req.flash("success", `Welcome back, ${req.user.username}!`);
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }
        req.flash("success", "You have been logged out.");
        res.redirect("/listings");
    });
};
