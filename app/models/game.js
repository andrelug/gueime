var mongoose = require('mongoose');


var GameSchema = new mongoose.Schema({

    title: String,
    slug: {type: String, unique: true, index: true},
    description: String,
    text: String,
    cover: Buffer,
    images: [Buffer],
    release: Date,
    graph: {
        console:{
            main: String,
            others: [String]
        },
        genre: {
            main: String,
            others: [String]
        },
        developer: {
            main: String,
            others: [String]
        },
        publisher: {
            main: String,
            others: [String]
        },
        ageRange: String,
        views: Number
    },
    facet: {type: [String], index: true}
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Game', GameSchema);