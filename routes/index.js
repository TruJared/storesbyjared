const express = require('express');
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
// composition >> wrapping a function in a function
// this creates an error handler function for our function
// this is very useful for Async Await which require try catch
const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

// gets
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/add', authController.isLoggedIn, storeController.addStore);

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.get('/account/reset/:token', catchErrors(authController.reset));

// posts
router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore),
);
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore),
);

router.post(
  '/register',
  // validate data
  userController.validateRegister,
  // register the user
  userController.register,
  // log them in
  authController.login,
);
router.post('/login', authController.login);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.post(
  '/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update),
);

// //////////////////// //
// ////// API ///////// //
// //////////////////// //

router.get('/api/search', catchErrors(storeController.searchStores));

// comment in for scratchpad
// const playgroundController = require('../controllers/playgroundController');
// router.get('/playground/:game', playgroundController.playground);

module.exports = router;
