var RoomModel = require('../models/room_model');
var Utils = require('../utils/utility');
var UserModel = require('../models/users_model');
var OnlinePlayerModel = require('../models/online_player_model');
var Q = require('q');
var http = require('http');
var ip = require('ip');
var moment = require('moment');
var FinalFriend = require('../models/final_friend_model.js');
var config = require('../configs/config');

exports.getRoomStatus = function(request, response) {
    var username = request.params.username;
    var requestHost = request.headers.host;

    OnlinePlayerModel.findOne({username: username}, function(err, onlinePlayer) {
        if(!err) {

            if(!onlinePlayer) {
                onlinePlayer = new OnlinePlayerModel({
                    username : username,
                    hostname : requestHost
                });
            }
            onlinePlayer.updateTime = new moment();
            onlinePlayer.save(function(err) {
                if(err) console.error(err);
            });
        }
    });

    FinalFriend.findOne({username:username}, function(err, finalFriendObj) {

        var friendList;
        var onlinePlayersSet = [];
        var myFriendsSet = [];
        var friendsinrooms = [];
        if (err) {
            console.error(err);
        } else if(finalFriendObj) {

            friendList = finalFriendObj.friends
            if(friendList.length > 0){
                OnlinePlayerModel.find({}, function (err, onlinePlayers) {
                    // db error
                    if (err) {console.error(err)};

                    RoomModel.find({}, function (err, rooms) {

                        rooms.forEach(function(room) {
                            friendsinrooms.push.apply(friendsinrooms, room.players);
                        });

                        friendList.forEach(function(myfriend) {
                            myFriendsSet.push(myfriend.username);
                        });

                        onlinePlayers.forEach(function (onlinePlayer) {
                            onlinePlayersSet.push(onlinePlayer.username);
                        });
                        myFriendsSet.filter(function(n) {
                            return onlinePlayers.indexOf(n) !== -1;
                        });
                        friendsinrooms.filter(function(n){
                            return myFriendsSet.indexOf(n) !== -1;
                        });
                        var index = friendsinrooms.indexOf(username);
                        if (index > -1) {
                            friendsinrooms.splice(index, 1);
                        }

                        var message = {};
                        RoomModel.findOne({ players: username },  function(error, room) {
                            if (error) {
                                response.send({status: false, message: "Error during get room status"});
                            } else if(!room) {
                                message["status"] = "no_room";
                                message["online_friends"] = myFriendsSet;
                                message["friends_in_rooms"] = friendsinrooms;
                                response.json(message);
                                return;

                            } else {

                                message["status"] = "in_room";
                                message["online_friends"] = myFriendsSet;
                                message["friends_in_rooms"] = friendsinrooms;
                                message["room_id"] = room.room_id;
                                message["host"] = room.host;
                                message["gameserver_hostname"] = room.gameserver_hostname;
                                message["gameserver_port"] = room.gameserver_port;
                                message["players"] = room.players;
                                response.json(message);
                                return;
                            }
                        });
                    });
                });
            }
        }

        var message = {};
        message["status"] = "no_room";
        message["online_friends"] = myFriendsSet;
        message["friends_in_rooms"] = friendsinrooms;
        //response.json(message);
    });
}

exports.createRoom = function(request, response) {
    console.log("create room coming")
    var hostUsername = request.body.host;

     //host:username,
     // players: player1,player2,...

    if (hostUsername){
        var room_id = new moment().format('x');
        var players = request.body.players;
        var playersArray = players.split(",");

        var roomRequestAPIOptions = {
            host:ip.address(),
            port: '8087',
            path: '/api/0.1/room/create',
            method: 'GET'
        };

        http.request(roomRequestAPIOptions, function(gameServerResponse) {
            gameServerResponse.setEncoding('utf8');
            gameServerResponse.on('data', function(data) {
                var gameServerPort = JSON.parse(data)['portnumber'];
                var gameServerHostname = config.gameServerManagerHostname;

                storePlayerMeta(room_id, playersArray, hostUsername, gameServerHostname, gameServerPort, request, response);
            });
        }).end();
    }
};

function storePlayerMeta(room_id, playersArray, hostUsername, gameServerHostname, gameServerPort, request, response) {
    playersArray.push(hostUsername);
    var roomJson = {
        room_id : room_id,
        host : hostUsername,
        players :playersArray,
        gameserver_hostname : gameServerHostname,
        gameserver_port:gameServerPort
    };

    var room = new RoomModel(roomJson)

    room.save(function(err) {
        if(err) console.error(err);
    });

    response.json(roomJson);
}