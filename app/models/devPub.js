var mongoose = require('mongoose');


var DevPubSchema = new mongoose.Schema({

    type: String,
    title: String,
    slug: {type: String, index: true},
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

// create the model for users and expose it to app // DevPub var
module.exports = mongoose.model('DevPub', DevPubSchema);