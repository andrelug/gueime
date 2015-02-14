var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mandrill = require('mandrill-api/mandrill'),
    mandrill_client = new mandrill.Mandrill('9OnGzepS5J_rDmLYVSjWnQ');

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


                            // Email para Contato
                            var newMessage = {
                                "html": "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head><meta content='text/html; charset=utf-8' http-equiv='Content-Type' /><title></title><style type='text/css'>@media only screen and (max-width:480px){body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:none !important}body{width:100% !important;min-width:100% !important}td[id=bodyCell]{padding:10px !important}table.kmMobileHide{display:none !important}table[class=kmTextContentContainer]{width:100% !important}table[class=kmBoxedTextContentContainer]{width:100% !important}td[class=kmImageContent]{padding-left:0 !important;padding-right:0 !important}img[class=kmImage]{width:100% !important}table[class=kmSplitContentLeftContentContainer],table[class=kmSplitContentRightContentContainer],table[class=kmColumnContainer],td[class=kmVerticalButtonBarContentOuter] table[class=kmButtonBarContent],td[class=kmVerticalButtonCollectionContentOuter] table[class=kmButtonCollectionContent],table[class=kmVerticalButton],table[class=kmVerticalButtonContent]{width:100% !important}td[class=kmButtonCollectionInner]{padding-left:9px !important;padding-right:9px !important;padding-top:9px !important;padding-bottom:0 !important;background-color:transparent !important}td[class=kmVerticalButtonIconContent],td[class=kmVerticalButtonTextContent],td[class=kmVerticalButtonContentOuter]{padding-left:0 !important;padding-right:0 !important;padding-bottom:9px !important}table[class=kmSplitContentLeftContentContainer] td[class=kmTextContent],table[class=kmSplitContentRightContentContainer] td[class=kmTextContent],table[class=kmColumnContainer] td[class=kmTextContent],table[class=kmSplitContentLeftContentContainer] td[class=kmImageContent],table[class=kmSplitContentRightContentContainer] td[class=kmImageContent]{padding-top:9px !important}td[class='rowContainer kmFloatLeft'],td[class='rowContainer kmFloatLeft firstColumn'],td[class='rowContainer kmFloatLeft lastColumn']{float:left;clear:both;width:100% !important}table[id=templateContainer],table[class=templateRow]{max-width:600px !important;width:100% !important}h1{font-size:24px !important;line-height:130% !important}h2{font-size:20px !important;line-height:130% !important}h3{font-size:18px !important;line-height:130% !important}h4{font-size:16px !important;line-height:130% !important}td[class=kmTextContent]{font-size:14px !important;line-height:130% !important}td[class=kmTextBlockInner] td[class=kmTextContent]{padding-right:18px !important;padding-left:18px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner]{padding-left:9px !important;padding-right:9px !important}table[class='kmTableBlock kmTableMobile'] td[class=kmTableBlockInner] [class=kmTextContent]{font-size:14px !important;line-height:130% !important;padding-left:4px !important;padding-right:4px !important}}</style></head><body style='margin:0;padding:0;background-color:#c7c7c7'><center><table align='center' border='0' cellpadding='0' cellspacing='0' id='bodyTable' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;background-color:#c7c7c7;height:100%;margin:0;width:100%'><tbody><tr><td align='center' id='bodyCell' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding-top:50px;padding-left:20px;padding-bottom:20px;padding-right:20px;border-top:0;height:100%;margin:0;width:100%'><table border='0' cellpadding='0' cellspacing='0' id='templateContainer' width='600' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;border:1px solid #aaa;background-color:#f4f4f4;border-radius:0'><tbody><tr><td id='templateContainerInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0'><table border='0' cellpadding='0' cellspacing='0' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmImageBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmImageBlockOuter'><tr><td class='kmImageBlockInner' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:9px;' valign='top'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmImageContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmImageContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;padding:0;padding-top:0px;padding-bottom:0;padding-left:9px;padding-right:9px;'><img align='left' alt='' class='kmImage' src='https://d3k81ch9hvuctc.cloudfront.net/company%2Fb674Zj%2Fimages%2Fheader_email.jpg' width='564' style='border:0;height:auto;line-height:100%;outline:none;text-decoration:none;padding-bottom:0;display:inline;vertical-align:bottom;margin-right:0;max-width:800px;' /></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td align='center' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='templateRow' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='rowContainer kmFloatLeft' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><table border='0' cellpadding='0' cellspacing='0' class='kmTextBlock' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody class='kmTextBlockOuter'><tr><td class='kmTextBlockInner' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;'><table align='left' border='0' cellpadding='0' cellspacing='0' class='kmTextContentContainer' width='100%' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0'><tbody><tr><td class='kmTextContent' valign='top' style='border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;color:#505050;font-family:Helvetica, Arial;font-size:14px;line-height:150%;text-align:left;padding-top:9px;padding-bottom:9px;padding-left:18px;padding-right:18px;'><h1 style='color:#222;display:block;font-family:Helvetica, Arial;font-size:26px;font-style:normal;font-weight:bold;line-height:110%;letter-spacing:normal;margin:0;margin-bottom:9px;text-align:left'>Bem Vindo(a)!</h1><p style='margin:0;padding-bottom:1em'> </p><p style='margin:0;padding-bottom:1em'>Olá " + profile.name.givenName + "! Ficamos muito felizes com seu registro em nosso site. Esperamos que tenha uma excelente experiência e aproveitamos para lhe pedir feedback sempre que achar algum problema no site, tiver uma sugestão ou qualquer outro comentário.</p><p style='margin:0;padding-bottom:1em'>Conduzimos um programa de parceiros para aqueles usuários que quiserem escrever aqui no Gueime.com.br. Se este for seu caso, saiba mais em <a href='http://www.gueime.com.br/parceiros'>nossa página de parceiros</a>.</p><p style='margin:0;padding-bottom:1em'>Um abraço</p><p style='margin:0;padding-bottom:1em'>Equipe Gueime</p></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></center></body></html>",
                                "text": "Olá " + profile.name.givenName + "! Ficamos muito felizes com seu registro em nosso site. Esperamos que tenha uma excelente experiência e aproveitamos para lhe pedir feedback sempre que achar algum problema no site, tiver uma sugestão ou qualquer outro comentário.</p><p style='margin:0;padding-bottom:1em'>Conduzimos um programa de parceiros para aqueles usuários que quiserem escrever aqui no Gueime.com.br. Se este for seu caso, saiba mais em <a href='http://www.gueime.com.br/parceiros'>nossa página de parceiros",
                                "subject": "Gueime - Bem Vindo(a)",
                                "from_email": "parceiros@gueime.com.br",
                                "from_name": "Gueime - Parceiros",
                                "to": [{
                                        "email": profile.emails[0].value,
                                        "name": profile.name.givenName,
                                        "type": "to"
                                    },
                                    {
                                        "email": "parceiros@gueime.com.br",
                                        "name": "Parceiros",
                                        "type": "bcc"
                                    }],
                                "headers": {
                                    "Reply-To": "parceiros@gueime.com.br"
                                },
                                "important": false,
                                "track_opens": true,
                                "track_clicks": true,
                                "auto_text": null,
                                "auto_html": true,
                                "inline_css": null,
                                "url_strip_qs": null,
                                "preserve_recipients": null,
                                "view_content_link": null,
                                "return_path_domain": null,
                                "tags": [
                                    "conMessage"
                                ]
                            };
                            var async = false;
                            var ip_pool = "Main Pool";
                            // Evio de Email
                            mandrill_client.messages.send({"message": newMessage, "async": async, "ip_pool": ip_pool}, function(result) {
                                console.log(result);
                                // save our user to the database
                                newUser.save(function (err) {
                                    if (err)
                                        throw err;

                                    // if successful, return the new user
                                    return done(null, newUser);
                                });
                            }, function(e) {
                                console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                                // save our user to the database
                                newUser.save(function (err) {
                                    if (err)
                                        throw err;

                                    // if successful, return the new user
                                    return done(null, newUser);
                                });
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