var mongoose = require('mongoose');

var ClientSchema = new mongoose.Schema({
    name : { type: String, unique : true, required: true },
    client_id : { type: String, required: true },
    client_secret : { type: String, required: true},
    userId : { type : String, required : true },
    trustedClient : { type : String, default : false }
});

module.exports = mongoose.model('Client', ClientSchema);