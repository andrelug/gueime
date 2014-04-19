var mongoose = require('mongoose');


var GenreSchema = new mongoose.Schema({

    name: {type: String, unique: true},
    slug: {type: String, unique: true, index: true},
    description: String,
    text: String,
});

// create the model for users and expose it to app // Genre var
module.exports = mongoose.model('Genre', GenreSchema);