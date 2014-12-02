var mongoose = require('mongoose');


var ConsoleSchema = new mongoose.Schema({

    title: String,
    slug: {type: String},
    genCover: String,
    cover: String,
    about: String,
    startDate: Date,
    status: String,
    graph:{
        views: Number
    }
});

ConsoleSchema.index({ slug: 1, status: 1 });

// create the model for users and expose it to app // Console var
module.exports = mongoose.model('Console', ConsoleSchema);