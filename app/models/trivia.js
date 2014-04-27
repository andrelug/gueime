var mongoose = require('mongoose');


var GenreSchema = new mongoose.Schema({

    pergunta: String,
    slug: {type: String, index: true},
    genCover: String,
    cover: String,
    about: String,
    status: String,
    graph:{
        views: Number
    }
});

// create the model for users and expose it to app // Genre var
module.exports = mongoose.model('Genre', GenreSchema);