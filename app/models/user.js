var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


var UserSchema = new mongoose.Schema({
    name: {
        first: String,
        parsed: String,
        last: String,
        nickName: String,
        loginName: {type: String, lowercase: true, trim: true, unique: true}
    },
    status: {type: String, default: "user"},
    birthDate: Date,
    email: {type: String},
    gender: String,
    site: String,
    bio: String,
    photo: String,
    cover: {type: String, default: "background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/profileBg.jpg) no-repeat center 0px;"},
    password: {
        main: String
    },
    localization: {
        country: String,
        city: String
    },
    social: {
        facebook: {
            id: String,
            token: {type: String, index: true},
            email: String,
            name: String,
            url: String,
            friends: []
        },
        twitter:{
            id: String,
            token: String,
            displayName: String,
            username: String
        },
        google: {
            id: String,
            token: String,
            email: String,
            name: String,
            url: String
        },
        xboxLive: {
            name: String,
            points: Number
        },
        psn: {
            name: String,
            level: Number
        },
        steam: {
            name: String,
            level: Number
        },
        nintendo: String,
        gameCenter: String,
        alvanista: String
    },
    graph: {
        visits: Number,
        gamesCol: [{ type:  mongoose.Schema.Types.ObjectId, ref: 'Game' }],
        gamesLike: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
        publications: Number,
        searches: Number

    },
    gamification: {
        points: {type: Number, default: 0},
        level: {type: Number, default: 1},
        achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }]
    },
    creating: {type: Boolean, default: false},
    creatingId: {type: String, default: 0},
    follow: [{_id: false, type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    followedBy: [{_id: false, type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    deleted: {type: Boolean, default: false}
});

// methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password.main);
};

// create the model for users and expose it to app // Users var
module.exports = mongoose.model('Users', UserSchema);