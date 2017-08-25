var Mongoose = require('mongoose');

var ContentSchema = new Mongoose.Schema({
    nameOfFile : { type: String, required: true},
    nameOfContentUploader: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    fileType: { type: String, required: true },
    etag: { type: String, required: true },
    bucket: { type: String, required: true },
    key: { type: String, required: true },
    location: { type: String, required: true },
    thumbnailLocation: { type: String},
    tag: {type: String},
    category: { type: String, required: true },
    filmCategory : { type: String },
    wierdTag : { type: String }
});

module.exports = Mongoose.model('ContentSchema', ContentSchema);