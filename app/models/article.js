var mongoose = require('mongoose');


var ArticleSchema = new mongoose.Schema({

    title: String,
    slug: {type: String, unique: true},
    description: String,
    cover: {
        image: String,
        position: String
    },
    subtitle: String,
    text: String,
    authors: {
        main: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        sub: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    },
    update: [{
        _id: false,
        type: Date
    }],
    tags: String,
    type: String,
    article: {
        category: [String],
        serie: String
    },
    news:{
        story: String
    },
    review: {
        score: Number,
        good: String,
        bad: String,
        punchLine: String,
        main: {type: Boolean, default: false}
    },
    video: {
        type: String,
        canal: String,
        url: String
    },
    graph: {
        games: String,
        consoles: String,
        genres: String,
        developers: String,
        publishers: String,
        views: Number
    },
    highlight: {type: Boolean, default: false},
    creating: {type: Boolean, default: false},
    facet: {type: [String], index: true}
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Article', ArticleSchema);