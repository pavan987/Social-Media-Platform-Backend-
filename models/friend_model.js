var mongoose = require('mongoose'),
    Schema = mongoose.Schema

var friendSchema = new Schema({
    username: String,
    requests: [],

});   

module.exports = mongoose.model('Friend', friendSchema);