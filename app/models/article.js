var mongoose = require('mongoose');


var ArticleSchema = new mongoose.Schema({

    title: String,
    slug: {type: String},
    description: String,
    cover: {
        image: String,
        position: String
    },
    subtitle: String,
    text: String,
    authors: {
        name: String,
        main: String,
        sub: [String]
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
    status: {type: String, default: 'rascunho'},
    facet: {type: [String], index: true},
    date: { type: Date, default: Date.now }
});

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Article', ArticleSchema);