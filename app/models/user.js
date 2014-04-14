var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


var UserSchema = new mongoose.Schema({
    name: {
        first: String,
        parsed: String,
        middle: String,
        last: String,
        nickName: String,
        loginName: {type: String, lowercase: true, trim: true, unique: true}
    },
    status: {type: String, default: "user"},
    birthDate: Date,
    email: {type: String, required: true, unique: true, index: true},
    gender: String,
    sites: [String],
    bio: String,
    photo: String,
    password: {
        main: String
    },
    localization: {
        country: String,
        state: String,
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
        }
    },
    creating: {type: Boolean, default: false},
    creatingId: String,
    follow: [{_id: false, type: mongoose.Schema.Types.ObjectId}],
    followedBy: [{_id: false, type: mongoose.Schema.Types.ObjectId}],
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