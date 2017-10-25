var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var User       = require('../app/models/user');

var configAuth = require('./auth');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with userID
            usernameField: 'userID',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, userID, password, done) {
            if (userID)
                userID = userID.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                User.findOne({'local.userID': userID}, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'Wrong Information.'));

                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Wrong Information.'));

                    // all is well, return user
                    else
                        return done(null, user);
                });
            });

        }));

    passport.use('local-signup', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with userID
            usernameField: 'userID',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, userID, password, done) {

            process.nextTick(function () {
                // if the user is not already logged in:
                if (!req.user) {
                    User.findOne({'local.userID': userID}, function (err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That userID is already taken.'));
                        } else {

                        if(password.length < 8 || password.length >120)
                            return done(null, false, req.flash('signupMessage', 'Password is to short, Mínimo 8.'));
                        var countMAY = false;
                        var countMIN = false;
                        var countCHA = false;
                        var countNUM = false;
                        for(i=0; i<password.length; i++){
                            console.log(password.charCodeAt(i));
                            if(password.charCodeAt(i) >= 33 && password.charCodeAt(i) <= 47){
                                countCHA = true;
                                continue;
                            }
                            if(password.charCodeAt(i) >= 48 && password.charCodeAt(i) <= 57){
                                countNUM = true;
                                continue;
                            }
                            if(password.charCodeAt(i) >= 65 && password.charCodeAt(i) <= 90){
                                countMAY = true;
                                continue;
                            }
                            if(password.charCodeAt(i) >= 97 && password.charCodeAt(i) <= 122){
                                countMIN = true;
                                continue;
                            }

                        }
                            if(countMIN,countNUM,countMAY == true){
                                var newUser = new User();
                                newUser.local.userID = userID;
                                newUser.local.password = newUser.generateHash(password);

                                newUser.save(function (err) {
                                    if (err)
                                        return done(err);

                                    return done(null, newUser);
                                });
                            }
                            else{
                                console.log(countMIN,countNUM,countMAY);
                                return done(null, false, req.flash('signupMessage', 'Put a better password, using letters, numbers and capital.'));
                            }

                        }

                    });

                } else if (!req.user.local.userID) {

                    User.findOne({'local.userID': userID}, function (err, user) {
                        if (err)
                            return done(err);

                        if (user) {
                            return done(null, false, req.flash('loginMessage', 'That userID is already taken.'));

                        } else {
                            var user = req.user;
                            user.local.userID = userID;
                            user.local.password = user.generateHash(password);
                            user.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }
                    });
                } else {
                    return done(null, req.user);
                }

            });

        }));


    passport.use('local-pswchange', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with userID
            usernameField: 'userID',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
        },
        function (req, userID, password, done) {
            if (userID)
                userID = userID.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

            // asynchronous
            process.nextTick(function () {
                User.findOne({'local.userID': userID}, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'Wrong Information.'));
                    // all is well, return user
                    else{
                        user.local.password = user.generateHash(password);

                        user.save(function (err) {
                            if (err)
                                return done(err);

                            return done(null, user);
                        });
                    }


                });
            });

        }));





    console.log(configAuth.facebookAuth+"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    var fbStrategy = configAuth.facebookAuth;
    fbStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    passport.use(new FacebookStrategy(fbStrategy,
        function(req, token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function() {

                // check if the user is already logged in
                if (!req.user) {

                    User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.facebook.token) {
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }

                            return done(null, user); // user found, return that user
                        } else {
                            // if there is no user, create them
                            var newUser            = new User();

                            newUser.facebook.id    = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user            = req.user; // pull the user out of the session

                    user.facebook.id    = profile.id;
                    user.facebook.token = token;
                    user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = (profile.emails[0].value || '').toLowerCase();

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });

                }
            });

        }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

            clientID        : configAuth.googleAuth.clientID,
            clientSecret    : configAuth.googleAuth.clientSecret,
            callbackURL     : configAuth.googleAuth.callbackURL,
            passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

        },
        function(req, token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function() {

                if (!req.user) {

                    User.findOne({ 'google.id' : profile.id }, function(err, user) {
                        if (err)
                            return done(err);

                        if (user) {

                            if (!user.google.token) {
                                user.google.token = token;
                                user.google.name  = profile.displayName;
                                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user);
                                });
                            }

                            return done(null, user);
                        } else {
                            var newUser          = new User();

                            newUser.google.id    = profile.id;
                            newUser.google.token = token;
                            newUser.google.name  = profile.displayName;
                            newUser.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            newUser.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });
                        }
                    });

                } else {
                    // user already exists and is logged in, we have to link accounts
                    var user               = req.user; // pull the user out of the session

                    user.google.id    = profile.id;
                    user.google.token = token;
                    user.google.name  = profile.displayName;
                    user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user);
                    });

                }

            });

        }));




};