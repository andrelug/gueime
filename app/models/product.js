var mongoose = require('mongoose');


var ProductSchema = new mongoose.Schema({

    title: String,
    slug: String,
    cover: {type: String, default: '/images/gift_gueime.jpg'},
    many: Number,
    about: String,
    status: String,
    much: Number,
    graph:{
        views: Number,
        users: [String]
    }
});

ProductSchema.index({ slug: 1, status: 1 });

// create the model for users and expose it to app // Genre var
module.exports = mongoose.model('Product', ProductSchema);