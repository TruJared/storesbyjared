// configures Passport
const passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');

// method accessible through User.js
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
