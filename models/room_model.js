var mongoose = require('mongoose');

var RoomSchema = new mongoose.Schema({
    room_id : { type: String, unique: true, required: true },
    host: { type: String },
    players : [String],
    gameserver_hostname:{ type: String},
    gameserver_port:{ type: Number}
});

module.exports = mongoose.model('Room', RoomSchema);