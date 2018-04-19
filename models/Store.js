const mongoose = require('mongoose');
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name', // sets required True and adds a handy error message.
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String], // will be passed an array of strings
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [
      {
        type: Number,
        required: 'You must supply coordinates', // sets required True and adds error
      },
    ],
    address: {
      type: String,
      required: 'You must supply an address', // sets required True and adds error
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
});

// define our indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

// before save >>> manipulate Slug
storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    return next(); // skips and stops function from running
  }
  this.slug = slug(this.name);
  // find other stores with same slug and add 1
  // regex❓
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  // constructor creates Store before Store is created 🤕
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  return next();
});

storeSchema.statics.getTagsList = function () {
  // aggregate is like a cross between find and array.prototype.reduce()
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model('Store', storeSchema);
