var User = require("./../models/users_model.js")
const privateBucket = "private";

var uid = function(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

/**
 * Return a random int, used by `utils.uid()`
 *
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var db_error = function (res, err) {
      return res.json({status:"error", message:"error during database transaction execution", database_err: err})
}

var send = function (res, status, message) {
	return res.json({status:status, message:message})
}


var isUnique = function (type, value, callback) {
  var query;

  if (type == "email") {
    query = {'email':value}
  }
  if (type == "phone") {
    query = {'phone':value}
  }
  User.findOne(query,  function(err, result) {
    if (err) return callback(err);
    else
    {
    return callback(err,result)
    }
  })

}

// dynamically generated policy for private bucket based on username
function getPrivateBucketPolicy(username) {
    return '{\"Version\":\"2012-10-17\",\"Statement\": [{\"Sid\": \"AllowGroupToSeeBucketListInTheConsole\",\"Action\": [ \"s3:GetBucketLocation\" ],\"Effect\": \"Deny\",\"Resource\": [ \"arn:aws:s3:::*\"  ]},{\"Sid\": \"AllowRootLevelListingOfTheBucket\",\"Action\": [\"s3:ListBucket\"],\"Effect\": \"Deny\",\"Resource\": [\"arn:aws:s3:::istarvr\"],\"Condition\":{ \"StringEquals\":{\"s3:prefix\":[\"\"], \"s3:delimiter\":[\"\/\"]}}},{\"Sid\": \"AllowListBucketOfASpecificUserPrefix\",\"Action\": [\"s3:ListBucket\"],\"Effect\": \"Allow\",\"Resource\": [\"arn:aws:s3:::istarvr\"],\"Condition\":{  \"StringLike\":{\"s3:prefix\":[\"' + username + '\/*\"] }}},{\"Sid\": \"AllowUserSpecificActionsOnlyInTheSpecificUserPrefix\",\"Effect\":\"Allow\",\"Action\":[\"s3:PutObject\",\"s3:GetObject\",\"s3:GetObjectVersion\",\"s3:DeleteObject\",\"s3:DeleteObjectVersion\"],\"Resource\":\"arn:aws:s3:::istarvr\/'+ username +'\/*\"}]}';
}

// dynamically generated policy for public bucket based on username
function getPublicBucketPolicy(username) {
    return "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"AllowUserToSeeBucketListInTheConsole\",\"Action\":[\"s3:ListAllMyBuckets\",\"s3:GetBucketLocation\"],\"Effect\":\"Allow\",\"Resource\":[\"arn:aws:s3:::*\"]},{\"Sid\":\"AllowRootAndHomeListingOfCompanyBucket\",\"Action\":[\"s3:ListBucket\"],\"Effect\":\"Allow\",\"Resource\":[\"arn:aws:s3:::publicistarvr\"],\"Condition\":{\"StringEquals\":{\"s3:prefix\":[\"\",\"" + username +"\/\"],\"s3:delimiter\":[\"\/\"]}}},{\"Sid\":\"AllowListingOfUserFolder\",\"Action\":[\"s3:ListBucket\"],\"Effect\":\"Allow\",\"Resource\":[\"arn:aws:s3:::publicistarvr\"],\"Condition\":{\"StringLike\":{\"s3:prefix\":[\"" + username +"\/*\"]}}},{\"Sid\":\"AllowAllS3ActionsInUserFolder\",\"Effect\":\"Allow\",\"Action\":[\"s3:*\"],\"Resource\":[\"arn:aws:s3:::publicistarvr\/" + username + "\/*\"]},{\"Sid\":\"ReadOnlyAllS3ActionsInUserFolder\",\"Effect\":\"Allow\",\"Action\":[\"s3: GetObject\",\"s3:ListBucket\"],\"NotResource\":[\"arn:aws:s3:::publicistarvr\/" + username + "\/*\"]}]}";
}

function getThumbnailBucketPolicy() {
  return "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"AddPerm\",\"Effect\":\"Allow\",\"Action\":[\"s3:*\"],\"Resource\":[\"arn:aws:s3:::istarvrthumbnails/*\"]}]}";
}

// getting a private/public policy based on the front-end request
var generatePolicyBasedOnType = function(username, typeOfBucket) {
    if (typeOfBucket === privateBucket) {
      return getPrivateBucketPolicy(username);
    } else if (typeOfBucket === "thumbnail") {
      return getThumbnailBucketPolicy();
    } else {
      return getPublicBucketPolicy(username);
    }
}

module.exports.db_error = db_error
module.exports.send = send
module.exports.isUnique = isUnique
module.exports.uid = uid
module.exports.generatePolicyBasedOnType = generatePolicyBasedOnType;
