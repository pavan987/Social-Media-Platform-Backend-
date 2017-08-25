var mongoose = require('mongoose');

var OnlinePlayerSchema = new mongoose.Schema({
    username : { type: String, unique: true, required: true },
    hostname : { type: String },
    updateTime : {type: Date }
});

module.exports = mongoose.model('OnlinePlayers', OnlinePlayerSchema);