var mongoose = require('mongoose');

// temporary schema to store the meta-data of videos uploaded by a specific user
var VideoSchema = new mongoose.Schema({
    videoTitle : { type : String, required: true, unique: true },
    videoDescription : { type : String, required: true },
    uploadDate : { type : Date, default : Date.now() },
    videoUrl : { type : String, required : true},
    userId : { type : String, require : true }
});

module.exports = mongoose.model('Video', VideoSchema);