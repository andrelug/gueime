var mongoose = require('mongoose');


var SearchSchema = new mongoose.Schema({

    user: String,
    searchStr: [String],
    searches: Number
});

// create the model for users and expose it to app // Genre var
module.exports = mongoose.model('Search', SearchSchema);