var mongoose = require('mongoose');


var ArticleSchema = new mongoose.Schema({

    title: String,
    slug: {type: String, unique: true},
    description: String,
    cover: Buffer,
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
    type: String,
    article: {
        category: {
            main: String,
            others: [String]
        }
    },
    news:{
        tags: [String],
        story: {type: String, unique: true}
    },
    review: {
        score: Number,
        good: [String],
        bad: [String],
        punchLine: String,
        main: {type: Boolean, default: false}
    },
    graph: {
        games: {
            main: {type: mongoose.Schema.Types.ObjectId, ref: 'Game'},
            others: [{_id: false, type: mongoose.Schema.Types.ObjectId, ref: 'Game'}]
        },
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
module.exports = mongoose.model('Article', ArticleSchema);