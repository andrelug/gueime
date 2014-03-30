var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// load up helper functions
var func = require('./functions');

// load up the user model
var Users = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        Users.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) {

        // asynchronous
        process.nextTick(function () {

            if (!req.user) {
                // Get the other parameters

                var gender = req.body.gender,
                    loginName = req.body.loginName,
                    firstName = req.body.firstName;

                if (!loginName) {
                    return done(null, false, req.flash('signupMessage', 'You must specify a login name.'));
                }
                if (!password) {
                    return done(null, false, req.flash('signupMessage', 'You must specify a password.'));
                }
                if(!email){
                    return done(null, false, req.flash('signupMessage', 'You must specify an email.'))
                }


                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                Users.findOne({ 'email': email }, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        Users.findOne({ 'name.loginName': func.string_to_slug(loginName) }, function (err, login) {
                            if (err)
                                return done(err);

                            if (login) {
                                return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                            } else {
                                // if there is no user with that email or username
                                // create the user
                                var newUser = new Users();

                                // set the user's local credentials
                                newUser.name.loginName = func.string_to_slug(loginName);
                                newUser.email = email;
                                newUser.password.main = newUser.generateHash(password);
                                newUser.name.first = firstName;
                                newUser.gender = gender;
                                newUser.name.parsed = func.string_to_slug(firstName);

                                // save the user
                                newUser.save(function (err) {
                                    if (err)
                                        throw err;
                                    return done(null, newUser);
                                });

                            }

                        });

                    }

                });
            } else {
                var user = req.user;

                user.email = email;
                user.password.main = user.generateHash(password);
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) { // callback with email and password from our form


        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        Users.findOne({ 'email': email }, function (err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            
            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            if (!user.password.main)
                return done(null, false, req.flash('loginMessage', 'You didn\'t set your password yet. Pleas login with your social account.'));

            // all is well, return successful user
            return done(null, user);
        });

    }));



    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        passReqToCallback: true
    },

    // facebook will send back the token and profile
    function (req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function () {

            // check if the user is already logged in
            if (!req.user) {

                // find the user in the database based on their facebook id
                Users.findOne({ 'social.facebook.id': profile.id }, function (err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        // just add our token and profile information
                        if (!user.social.facebook.token) {
                            user.social.facebook.token = token;

                            user.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        var newUser = new Users();
                        Users.find({ 'name.loginName': profile.username }, function (err, login) {
                            if (err)
                                throw err;

                            // Verify the uniqueness of the loginName and tries to give the original that came from the social network
                            if (login.length === 0) {
                                newUser.name.loginName = profile.username;
                            } else {
                                newUser.name.loginName = func.randomString();
                            }

                            // Generate a new loginName
                            // set all of the facebook information in our user model
                            newUser.social.facebook.id = profile.id; // set the users facebook id	                
                            newUser.social.facebook.token = token; // we will save the token that facebook provides to the user	                
                            newUser.social.facebook.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                            newUser.social.facebook.url = profile.profileUrl;
                            newUser.social.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                            // General profile related
                            newUser.name.first = profile.name.givenName;
                            newUser.name.last = profile.name.familyName;
                            newUser.email = profile.emails[0].value;
                            newUser.gender = profile.gender;
                            newUser.name.parsed = func.string_to_slug(profile.name.givenName);
                            newUser.photo = "http://graph.facebook.com/" + profile.username + "/picture?type=large";

                            // save our user to the database
                            newUser.save(function (err) {
                                if (err)
                                    throw err;

                                // if successful, return the new user
                                return done(null, newUser);
                            });
                        });
                    }
                });
            } else {

                // user already exists and is logged in, we have to link accounts
                var user = req.user; // pull the user out of the session

                // update the current users facebook credentials
                user.social.facebook.id = profile.id;
                user.social.facebook.token = token;
                user.social.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                user.social.facebook.email = profile.emails[0].value;
                user.social.facebook.url = profile.profileUrl;

                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));


    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

        consumerKey: configAuth.twitterAuth.consumerKey,
        consumerSecret: configAuth.twitterAuth.consumerSecret,
        callbackURL: configAuth.twitterAuth.callbackURL,
        passReqToCallback: true

    },
    function (req, token, tokenSecret, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Twitter
        process.nextTick(function () {

            // check if the user is already logged in
            if (!req.user) {
                Users.findOne({ 'social.twitter.id': profile.id }, function (err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found then log them in
                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        // just add our token and profile information
                        if (!user.social.twitter.token) {
                            user.social.twitter.token = token;

                            user.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser = new Users();
                        Users.find({ 'name.loginName': profile.username }, function (err, login) {
                            if (err)
                                throw err;

                            // Verify the uniqueness of the loginName and tries to give the original that came from the social network
                            if (login.length == 0) {
                                newUser.name.loginName = profile.username;
                            } else {
                                newUser.name.loginName = func.randomString();
                            }

                            // set all of the user data that we need
                            newUser.social.twitter.id = profile.id;
                            newUser.social.twitter.token = token;
                            newUser.social.twitter.displayName = profile.displayName;
                            newUser.social.twitter.username = profile.username;
                            // basic profile
                            newUser.email = "Needed" + profile.username;
                            newUser.name.first = profile.displayName;
                            newUser.photo = profile.photos[0].value.replace('_normal', '');
                            newUser.localization.city = profile._json.location;
                            newUser.bio = profile._json.description;
                            newUser.name.parsed = func.string_to_slug(profile.displayName);



                            // save our user into the database
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        });
                    }
                });
            } else {
                var user = req.user; // pull the user out of the session

                // update the current users facebook credentials
                user.social.twitter.id = profile.id;
                user.social.twitter.token = token;
                user.social.twitter.displayName = profile.displayName;
                user.social.twitter.username = profile.username;


                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });

    }));


    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true
    },
    function (req, token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function () {

            // check if the user is already logged in
            if (!req.user) {

                // try to find the user based on their google id
                Users.findOne({ 'social.google.id': profile.id }, function (err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        if (!user.social.google.token) {
                            user.social.google.token = token;

                            user.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        // if a user is found, log them in
                        return done(null, user);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser = new Users();
                        var googlename = func.string_to_slug(profile.name.givenName + profile.name.familyName);

                        Users.find({ 'name.loginName': googlename }, function (err, login) {
                            if (err)
                                throw err;

                            // Verify the uniqueness of the loginName and tries to give the original that came from the social network
                            if (login.length == 0) {
                                newUser.name.loginName = googlename;
                            } else {
                                newUser.name.loginName = func.randomString();
                            }

                            // set all of the relevant information
                            newUser.social.google.id = profile.id;
                            newUser.social.google.token = token;
                            newUser.social.google.name = profile.displayName;
                            newUser.social.google.email = profile.emails[0].value; // pull the first email
                            newUser.social.google.url = profile._json.link;

                            // Basic Profile
                            newUser.email = profile.emails[0].value;
                            newUser.name.first = profile.name.givenName;
                            newUser.name.last = profile.name.familyName;
                            newUser.gender = profile._json.gender;
                            newUser.photo = profile._json.picture;
                            newUser.name.parsed = func.string_to_slug(profile.name.givenName);

                            // save the user
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        });
                    }
                });
            } else {
                var user = req.user; // pull the user out of the session

                // update the current users facebook credentials
                user.social.google.id = profile.id;
                user.social.google.token = token;
                user.social.google.name = profile.displayName;
                user.social.google.email = profile.emails[0].value; // pull the first email

                // save the user
                user.save(function (err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });

    }));


};