var mongoose = require('mongoose');


var GenreSchema = new mongoose.Schema({

    title: String,
    slug: {type: String},
    genCover: String,
    cover: String,
    about: String,
    status: String,
    graph:{
        views: Number
    }
});

GenreSchema.index({ slug: 1, status: 1 });

// create the model for users and expose it to app // Genre var
module.exports = mongoose.model('Genre', GenreSchema);