const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

const User = mongoose.model('User');

// use passport strategy
exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: "Login Successful 🍲 Let's Talk Food 🍲",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out 🚪');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  // more awesome Passport methods
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'Sorry, you must be logged in to do that');
  return res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // exists?
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'An account with that password does not exist');
    return res.redirect('/login');
  }
  // set reset tokens and expire date
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3.6e6;
  await user.save();
  // send email
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Rest',
    resetURL,
    // this connects this email to pug
    filename: 'password-reset',
  });
  req.flash('success', 'You have been emailed a password reset link:');
  // redirect to login page
  return res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    // $gt is built into Mongo... $gt === greater than
    resetPasswordExpires: { $gt: Date.now() },
  });
  console.log(user);

  if (!user) {
    req.flash('error', 'Password reset token does not exist or is expired');
    return res.redirect('/login');
  } // if user exists and token not expired
  return res.render('reset', { title: 'Reset your password' });
};

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    return next();
  }
  req.flash('error', 'Passwords do not match');
  return res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    // $gt is built into Mongo... $gt === greater than
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash('error', 'Password reset token does not exist or is expired');
    return res.redirect('/login');
  } // setPassword is a method made available in User.js
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('Success', 'Your password has been reset');
  return res.redirect('/');
};
