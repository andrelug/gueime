var mongoose = require('mongoose');


var ArticleSchema = new mongoose.Schema({

    title: String,
    slug: {type: String},
    description: String,
    cover: {
        image: String,
        position: String
    },
    publishDate: Date,
    subtitle: String,
    text: String,
    authors: {
        name: String,
        main: String,
        sub: [String],
        revision: String
    },
    update: [{
        _id: false,
        type: Date
    }],
    tags: [String],
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
        tipo: String,
        canal: String,
        url: String,
        autoral: {type: Boolean, default: false}
    },
    graph: {
        games: [String],
        consoles:[String],
        genres: [String],
        developers: [String],
        publishers: [String],
        views: Number
    },
    totalComments: Number,
    comments: [{
        sectionId: Number,
        comments: [{
            authorAvatarUrl: String,
            authorName: String,
            comment: String
        }]
    }],
    highlight: {type: Boolean, default: false},
    status: {type: String, index: true, default: 'rascunho'},
    facet: {type: [String], index: true}
});

ArticleSchema.index({slug: 1, type: 1});

// create the model for users and expose it to app // Artigo var
module.exports = mongoose.model('Article', ArticleSchema);