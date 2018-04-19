const mongoose = require('mongoose');

const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => res.render('login', { title: 'Login' });

exports.registerForm = (req, res) => res.render('register', { title: 'Register' });

// middleware to validate user login and registration data
exports.validateRegister = (req, res, next) => {
  // these methods were loaded in at app.js using express-validator
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name').notEmpty();
  req.checkBody('email', 'That Email is not valid').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
  req.checkBody('password-confirm', 'Confirm password Cannot be Blank!').notEmpty();
  req
    .checkBody('password-confirm', '💩 Uh-Oh, Your passwords do not match')
    .equals(req.body.password);

  // create the method that will actually check all the above requirements
  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    // IMPORTANT!!! this will pass the form data and the flash messages forward.
    // Huge UX improvement!!
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return; // stop
  }
  next(); // pass to register
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, name: req.body.name });
  // .register will create password hash using passport-local-mongoose
  // as defined and plugged in via user Schema
  // promisify creates a promise using the promisify library ---
  // may not be something I will use on a regular basis.... TODO read the docs
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (req, res) => res.render('account', { title: 'Edit your account' });

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findOneAndUpdate(
    // query
    { _id: req.user._id },
    // update
    { $set: updates },
    // options
    { new: true, runValidators: true, context: 'query' },
  );
  req.flash('success', 'Profile Updated');
  res.redirect('back');
};
