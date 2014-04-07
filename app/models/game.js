var mongoose = require('mongoose');


var GameSchema = new mongoose.Schema({

    title: {type: String, unique: true, index: true},
    slug: {type: String, unique: true, index: true},
    description: String,
    text: String,
    cover: Buffer,
    images: [Buffer],
    release: Date,
    graph: {
        console: [String],
        genre: [String],
        developer: [String],
        publisher: [String],
        ageRange: String,
        views: Number
    },
    facet: {type: [String], index: true}
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Game', GameSchema);