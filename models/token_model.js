var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
    token : { type : String, required : true, unique : true },
    expirationDate : { type : String, required : true },
    clientId : { type : String, required : true },
    username : { type : String, required : true }
});

module.exports = mongoose.model('Token', TokenSchema);