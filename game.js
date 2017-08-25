// print process.argv
var PORT = 8000;
process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
    if(index == 2) PORT = val;
});

var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function getPosition(string, subString, index) {
   return string.split(subString, index).join(subString).length;
}

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length+1);
}

server.on('listening', function(){
    var address = server.address();
    console.log("listening on :" + address.address + ":" + address.port);
});
server.bind(PORT);

var playerActionMap = {};
var playerSocketMap = {};

server.on('message', function (message, remote) {

    var m = message.toString('ascii')
    var json = JSON.parse(m);
    var username = json["username"];
    playerActionMap[username] = json;
    var endpoint = {};
    endpoint["address"] = remote.address;
    endpoint["port"] = remote.port;
    playerSocketMap[username] = endpoint;
    var arr = Object.keys(playerActionMap).map(function (key) { return playerActionMap[key]; });
    var socketsArr = Object.keys(playerSocketMap).map(function (key) { return playerSocketMap[key]; });
    var outM = {};
    if(json["type"].indexOf("ActionEnvelope") > -1){
        outM["packets"] = arr;
        //console.log(outM);
        server.send(JSON.stringify(outM), remote.port, remote.address);
    } else {
        socketsArr.forEach(function(item){
            var fakeArray = [];
            fakeArray.push(json);
            outM["packets"] = fakeArray;
            //console.log(outM);
            //console.log(item);
            server.send(JSON.stringify(outM), item.port, item.address);
        });
    }

});
console.log("game server started at port " + PORT);
//console.log(remote.port);
//console.log(remote.address);
//console.log(json["room_id"]);