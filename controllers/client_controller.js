var Client = require('../models/client_model');
var utility = require('../utils/utility');

exports.createClient = function(req, res) {
    var client = new Client();

    // setting params to the new client object
    client.name = req.body.name;
    client.client_id = utility.uid(16);
    client.client_secret = utility.uid(24);
    client.userId = req.user._id;
    client.trustedClient = req.body.is_trusted;

    client.save(function(error) {
        if (error) {
            return res.json({ success : false, status : error });
        }
        res.json({ success : true, status : "Saved client successfully!!" });
    });
};

exports.getAllClients = function(req, res) {

    Client.find({ userId : req.user._id }, function(error, clients) {
        if (error) {
            return res.json({ success : false, status : error });
        }
        res.json({ success : true, status : clients });
    });
};