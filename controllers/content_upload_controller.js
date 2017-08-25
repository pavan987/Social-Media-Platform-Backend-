var aws = require('aws-sdk');
var utils = require('../utils/utility.js');
var user = require("../models/users_model.js");
var MetaData = require('../models/content_upload_model.js');

var sts = new aws.STS({apiVersion: '2011-06-15'});
const privateBucket = "private", publicBucket = "public";
const policyExpirationTime = 3600;

// A dictionary of arrays to save AWS key.
const keyCategorys = {
    a: 'profile_pic',
    b: 'images',
    c: 'videos'
};

// laoding IAM credentials from disk and mapping it to aws sdk
aws.config.loadFromPath('./configs/config.json');
// using the latest signature version which signs the requests sent by
// underlying api to aws services
aws.config.update({
    signatureVersion: 'v4'
});

// initialising sts with IAM credentials
sts.config.loadFromPath('./configs/config.json');
// using global STS endpoint
sts.endpoint = "sts.amazonaws.com";

// creating an parameter object for getFederationToken method
function generateParamsForFederationToken(username, policy) {
    var federationTokenParam = {
        DurationSeconds: policyExpirationTime,
        Name: username,
        Policy: policy
    };
    return federationTokenParam;
}

function validateUserName(username, bucketType, response) {
    user.findOne({'username':username}, function(error, user) {
        if (error) {
            utils.send(response, "error", "internal server error");
        } else if (user === null) {
            utils.db_error(response, "No user found");
        } else {
             // calling sts endpoint to get temp credentials based on body params
            sts.getFederationToken(generateParamsForFederationToken(username, utils.generatePolicyBasedOnType(username, bucketType)), 
                function(error, tempCredentials) {
                if(error) {
                    utils.send(response, "error", "" + error);
                } else {
                    response.send(tempCredentials);
                }
            });
        }
    });
}

exports.generateCredentialsBasedOnType = function(request, response) {
    var username = request.body.username;
    var bucketType = request.body.bucket_type;

    if (!(username && bucketType)) {
        // checking if both params are passed in the body
        utils.send(response, "error" ,"missing parameters");
    } else if (!(bucketType === privateBucket || bucketType === publicBucket || bucketType === "thumbnail")) {
        // checking if the bucket_type is either 0 or 1
        utils.send(response, "error" ,"wrong bucket type");
    } else {
        // check if the username exists in the db
        validateUserName(username, bucketType, response);
    } 
};

// function to save the AWS key of file into mongoDB after user upload a file
exports.saveKeyByCatagery = function (req, res) {
    // keyCatagory from the POST should be a string.
    var username = req.body.username;
    var theKeyCatagory = keyCategorys[req.body.keyCatagory];
    var key = req.body.key;

    // get the exact catagory string
    var doc = {};
    doc[theKeyCatagory] = key;

    user.findOneAndUpdate({'username': username}, {$addToSet:doc}, function (err, user) {
        // db error
        if (err) return utils.db_error(res, err);
        // if user not found
        if (!user) return utils.send(res, "error", "user does not exist");
        utils.send(res, "success", "save the key successfully")
    });
};

exports.getKeyByCatagery = function (req, res) {
    user.findOne({username: req.params.username}, function (err, user) {
        // db error
        if (err) return utils.db_error(res, err);
        // if user not found
        if (!user) return utils.send(res, "error", "user does not exist");

        var theKeyCatagory = keyCategorys[req.params.keyCatagory];

        res.json({'Key': user[theKeyCatagory]});
    });
};

exports.deleteKeyByCatagery = function (req, res) {
    var username = req.params.username;
    var theKeyCatagory = keyCategorys[req.params.keyCatagory];
    var key = req.params.key;

    // get the exact catagory string
    var doc = {};
    doc[theKeyCatagory] = key;

    user.findOneAndUpdate({'username': username}, {$pull:doc}, function (err, user) {
        // db error
        if (err) return utils.db_error(res, err);
        // if user not found
        if (!user) return utils.send(res, "error", "user does not exist");
        utils.send(res, "success", "delete the key successfully")
    });
};

// function to save meta into Mongo
exports.saveUploadedContentMetaData = function(req, res) {
    var meta = new MetaData({
        nameOfFile : req.body.name_of_file,
        nameOfContentUploader: req.body.name_of_uploader,
        price: req.body.price,
        description: req.body.description,
        fileType: req.body.file_type,
        etag: req.body.etag,
        bucket: req.body.bucket,
        key: req.body.key,
        location: req.body.location,
        thumbnailLocation: req.body.thumbnail_location,
        tag: req.body.tag,
        category: req.body.category,
        filmCategory: req.body.film_category,
        wierdTag: req.body.wierd_tag
    });
    meta.save(function (error, data) {
        if (error) {
            return utils.db_error(res, error);
        } else {
            return utils.send(res, "success", "saved meta data of file");
        }
    });
}

// function to get the entire video dump
exports.getAllSavedVideos = function(req, res) {
    MetaData.find({bucket:'publicistarvr'},function(err, data){
        if (err) {
            return utils.db_error(res, err);
        } else {
            res.json({'Data': data});
        }
    });
}


exports.getMyVideos = function(req, res) {
    MetaData.find({nameOfContentUploader:req.params.username},function(err, data){
        if (err) {
            return utils.db_error(res, err);
        } else {
            res.json({'Data': data});
        }
    });

}


