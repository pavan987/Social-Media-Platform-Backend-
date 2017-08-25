var mongoose = require('mongoose');
var Token = require('../models/token_model');
var oauth2orize = require('oauth2orize');
var Client = require('../models/client_model');
var User = require('../models/users_model');
var Utils = require('../utils/utility');
var RefreshToken = require('../models/refresh_token_model');
var authController = require('../controllers/auth_controller');

var userModel = new User(); // helper object to access encrypt function

var server = oauth2orize.createServer();

server.serializeClient(function(client, callback) {
    callback(null, client.client_id);
});

server.deserializeClient(function(id, callback) {
    Client.findOne( {client_id : id}, function(err, client){
        if (err) {
            return callback(err);
        }
        callback(null, client);
    });
});

// exchange username and pasword of user for access token
server.exchange(oauth2orize.exchange.password(function(client, username, password, done) {

    User.findOne( { username : username }, function(error, user) {
        // if error, return callback with error
        if (error) { return done(error); }
        // if the user is not present, return callback with false
        if (!user) { return done(null, false); }
        // verifying the password of user
        user.verifyPassword(password, function(err, isMatched) {
            if (err) { return done(err); }
            // if password is not matched, return false
            if (!isMatched) { return done(null, false); }
            // if password is present, return the token to the user
            if (isMatched) {

                // remove all existing tokens if already present
                Token.remove({username : username}, function(error) {
                    if (error) {
                        console.log(error);
                        return done(error);
                    }
                });


                var token = new Token();
                var expiryTime = new Date().getTime() + (3600 * 1000);

                token.token = Utils.uid(256);
                token.expirationDate = expiryTime;
                token.clientId = client.client_id;
                token.username = username;

                token.save(function(error) {
                    if (error) { return done(error); }

                    // if no error, proceed with the generation of a refresh token
                    var rToken = new RefreshToken();

                    rToken.refresh_token = Utils.uid(256);
                    rToken.client_id = client.client_id;
                    rToken.user_id = username;

                    rToken.save(function(err) {
                        if (err) { return done(err); }

                        done(null, token.token, rToken.refresh_token, {expires_in : expiryTime});
                    });
                });
            }
        });
    });
}));

// exchange the refresh token after the expiry for a new access token
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {

    RefreshToken.findOne({ refresh_token : refreshToken }, function(error, refreshTokenFromDB) {
        var expiryTime = new Date().getTime() + (3600 * 1000);

        if (error) { return done(error); }
        // if refresh token is not found, return false
        if (!refreshTokenFromDB) { return done(null, false); }
        // if client is not the same, return false
        if (client.client_id !== refreshTokenFromDB.client_id) { return done(null, false); }

        // create a new access token, return it to the user and update in db

        var token = Utils.uid(256);

        Token.findOneAndUpdate({ username : refreshTokenFromDB.user_id }, { $set : { token : token,
             expirationDate : expiryTime, clientId : refreshTokenFromDB.client_id, username  : refreshTokenFromDB.user_id}},
             function(error) {
                 if (error) { return done(error); }

                 done(null, token, refreshToken, {expires_in : expiryTime});
             });
    });
}));




// exporting methods
exports.token = [
    authController.isClientAuthenticated,
    server.token(),
    server.errorHandler()
];
