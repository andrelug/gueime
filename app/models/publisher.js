var mongoose = require('mongoose');


var DevPubSchema = new mongoose.Schema({

    type: String,
    name: {type: String, unique: true},
    slug: {type: String, unique: true, index: true},
    description: String,
    text: String,
    logo: Buffer,
    startDate: Date

});

// create the model for users and expose it to app // DevPub var
module.exports = mongoose.model('DevPub', DevPubSchema);