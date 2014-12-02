var mongoose = require('mongoose');


var DevPubSchema = new mongoose.Schema({

    type: {type: String},
    title: String,
    slug: {type: String},
    about: String,
    website: String,
    devCover: String,
    cover: String,
    startDate: Date,
    status: String,
    graph:{
        views: Number
    }

});

DevPubSchema.index({slug: 1, type: 1, status: 1});

// create the model for users and expose it to app // DevPub var
module.exports = mongoose.model('DevPub', DevPubSchema);