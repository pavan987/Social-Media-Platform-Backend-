var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var UserModel = require('../models/users_model');
var Client = require('../models/client_model');
var BearerStrategy = require('passport-http-bearer').Strategy;
var TokenModel = require('../models/token_model');

var userModel = new UserModel(); // helper object to access encrypt function

// using the basic strategy from passport which verifies the username and password credentials
passport.use(new BasicStrategy(function(username, password, callback) {

    // Querying the database to find the username, here username is basically emailid
    UserModel.findOne({ username : username }, function(error, user) {

        // indicates some internal error while Querying
        if (error) { return callback(error); }

        // indicated the user is not found, hence return false
        if(!user) { return callback(null, false); }

        // if the user is found, verify his password
        user.verifyPassword(password, function(error, isMatched) {

            // if error, return the error
            if (error) { return callback(error); }

            // if the password is not matched, return false
            if (!isMatched) { return callback(null, false); }

            // if password is matched, return the user
            callback(null, user);

        });
    });
}));

// client basic strategy for verifying client-id and secret
passport.use('client-basic', new BasicStrategy(function(username, password, callback){

    // querying the database to check if the client-id is registered
    Client.findOne({ client_id : username }, function(error, client) {

        // if error, return the error
        if (error) { return callback(error); }

        // if client id is not found, return false
        if (!client) { return callback(null, false); }

        // if the client is not a trusted client, return false
        if (!client.trustedClient) { return callback(null, false); }

        // check if the client-password is correct
        if (client.client_secret !== password) { return callback(null, false); }

        return callback(null, client);
    });
}));

// Bearer strategy to authenticate users based on a access token
passport.use(new BearerStrategy(function(accessToken, done) {

    var currentTime = new Date().getTime();

    TokenModel.findOne( { token : accessToken }, function(err, token) {
        if (err) { return done(err); }
        // if no token found, return false
        if (!token) { return done(null, false); }
        // if the token has expires, return false
        if (currentTime > token.expirationDate) { return done(null, false); }
        // check if the user of the token is present
        UserModel.findOne({ username : token.username }, function(error, user) {
            // if error, return error
            if (error) { return done(error); }
            // if user is not found, return false
            if (!user) { return done(null, false); }
            // if user is present, return the user
            return done(null, user, { scope : "*" });
        });
    });
}));


exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session : false });
exports.isClientAuthenticated = passport.authenticate('client-basic', { session : false });
exports.isBearerAuthenticated = passport.authenticate('bearer', { session : false });
