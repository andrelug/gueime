var mongoose = require('mongoose');


var GameSchema = new mongoose.Schema({

    title: {type: String, unique: true, index: true},
    slug: {type: String, unique: true, index: true},
    about: String,
    cover: {type: String, default: "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/gameBg.jpg) no-repeat center -65px;"},
    gameCover: String,
    release: Date,
    graph: {
        console: [String],
        genre: [String],
        developer: [String],
        publisher: [String],
        esrb: [String],
        views: Number,
        gamers: Number
    },
    status: String,
    facet: {type: [String], index: true}
});

// create the model for users and expose it to app // Game var
module.exports = mongoose.model('Game', GameSchema);