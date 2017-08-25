var mongoose = require('mongoose'),
    Schema = mongoose.Schema


var finalFriendSchema = new Schema({
    username: String,
    friends: [],

});   

module.exports = mongoose.model('FinalFriend', finalFriendSchema);