var mongoose = require('mongoose');

var RefreshToken = new mongoose.Schema({
    refresh_token : { type : String, required : true },
    client_id : { type : String, required : true },
    user_id :  { type :  String, required : true }
});

module.exports = mongoose.model('RToken', RefreshToken);