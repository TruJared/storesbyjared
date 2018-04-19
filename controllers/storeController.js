const mongoose = require('mongoose');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const Store = mongoose.model('Store');

const multerOptions = {
  // save image to memory and push the filtered version to our server
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'Invalid file type' }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render('index', { title: 'Delicious!' });
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if file
  if (!req.file) {
    return next(); // skip to next middleware
  }
  const extension = req.file.mimetype.split('/')[1];
  // make use of uuid to create unique file name
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now resize -- have to pass file path or buffer
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  // write it adn then move on
  await photo.write(`./public/uploads/${req.body.photo}`);
  return next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // await save to assign store a slug then pass it down the chain
  const store = await new Store(req.body).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  /* prettier-ignore */
  const skip = (page * limit) - limit;
  // 1. GET stores
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Store.count();

  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash(
      'info',
      `Sorry, You requested page #${page}. But that doesn't exist, so I moved you to the home page`,
    );
    res.redirect('/');
  } else {
    res.render('stores', {
      title: 'Stores',
      stores,
      page,
      pages,
      count,
    });
  }
};

// function check if user is store creator
const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must be the store creator to edit it');
  }
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. TODO confirm they are the owner of the store
  confirmOwner(store, req.user);
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set location data to be point to avoid override when data is edited
  req.body.location.type = 'Point';

  // 1. find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // returns new store instead of old store
    runValidators: true, // check to make sure initial schema is honored
  }).exec();
  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${
      store.slug
    }">View Store ↪</a>`,
  );
  // 2. redirect and tell user update worked
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  // by adding populate, all author information will be included
  const store = await Store.findOne({ slug: req.params.slug }, req.body).populate('author');
  if (!store) return next();
  return res.render('store', { title: `${store.name}`, store });
};

exports.getStoresByTag = async (req, res) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };
  // getTagsList() is a custom function >>> see Store.js
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  // Promise All is dope!
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', {
    tags,
    title: 'Tags',
    tag,
    stores,
  });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    // find stores that match req query
    .find(
      {
        $text: {
          $search: req.query.q,
        },
        // use meta data to optimize search results
      },
      { score: { $meta: 'textScore' } },
      // use sort to sort the metadata and return top 6
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(6);
  res.json(stores);
};
