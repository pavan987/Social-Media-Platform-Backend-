//index.js
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    router = express.Router(),
    videoController = require('./controllers/video_controller'),
    passport = require('passport'),
    authController = require('./controllers/auth_controller'),
    clientController = require('./controllers/client_controller'),
    oauthController = require('./controllers/oauth_controller'),
    userController = require('./controllers/users_controller'),
    friendController = require('./controllers/friend_controller'),
    imageController = require('./controllers/image_controller'),
    ip = require('ip');
    schedule = require('node-schedule'),
    moment = require('moment');


var contentUploadController = require('./controllers/content_upload_controller');
var roomController = require('./controllers/room_controller');

var port = 8086;

mongoose.connect('mongodb://localhost:27017/nodeAuth');

//configure app
{
  app.use(express.static('uploads'))
  app.set('views', __dirname + '/views')
  app.set('view_options', {layout : false})

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
  app.use(bodyParser.json())

  // the way to provide static contents
  //app.use("/assets", express.static(__dirname + '/assets'))

  app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        next();
    });

  // all the API's would be pre-fixed with /api/0.1 where 0.1 is its version number
  app.use('/api/0.1', router);

  // initialising the authentication middleware
  app.use(passport.initialize());
}

//app.<REQUEST_METHOD>(<REQUEST_URI>, <CONTROLLER_METHOD>)
// Signup and login requests
router.get('/users/create', userController.signupPage)
router.post('/users/create', userController.createUser)
router.get('/users/login', userController.loginPage)
router.post('/users/login', userController.loginUser)


//endpoint to get user details
router.get('/users/:username',authController.isBearerAuthenticated, userController.getUser);
//endpoint to search by firstname
router.get('/search/:firstname',authController.isBearerAuthenticated, userController.searchByName);
//endpoint to update user details
router.post('/users/:username', authController.isBearerAuthenticated, userController.updateUser);
router.post('/logout/:username', authController.isBearerAuthenticated, userController.logoutUser);

// endpoint for image upload
router.post('/upload', authController.isBearerAuthenticated, imageController.uploadImage);


// endpoint to send friend requestx
router.post('/friendrequest', authController.isBearerAuthenticated, friendController.sendfriendRequest);
// endpoint to get pending requests
router.get('/friendrequest/:username', authController.isBearerAuthenticated, friendController.getFriendRequests);
// endpoint to update pending requests
router.post('/friendrequest/status/:my_username', authController.isBearerAuthenticated, friendController.updatePendingRequest);
// endpoint to get list of friends
router.get('/friends/:username', authController.isBearerAuthenticated, friendController.getFriends);
// endpoint to remove friend
router.post('/friends/:username', authController.isBearerAuthenticated, friendController.removeFriend);


// dummy endpoints to test oauth
router.post('/post_video', authController.isBearerAuthenticated, videoController.postVideo); // posting a new video
router.get('/get_all_videos',authController.isBearerAuthenticated, videoController.getAllVideos); // getting all videos from a user
router.get('/get_video/:title', authController.isBearerAuthenticated, videoController.getVideosByName); // getting videos by name
router.put('/update_video/:title', authController.isBearerAuthenticated, videoController.updateVideoMeta); // updating a video
router.delete('/delete_video/:title', authController.isBearerAuthenticated, videoController.deleteVideo); // deleting a video by name

// endpoints to add and view all clients
// to be accessed only by admins, who can create clients like android, ios, web ....
router.post('/add_new_client', authController.isAuthenticated, clientController.createClient); // adding a new clients
router.get('/get_all_clients', authController.isAuthenticated, clientController.getAllClients); // get all clients

// endpoint to get an oauth/refresh token
router.post('/oauth/token', oauthController.token);

// endpoint to get temp credentials to access S3
router.post('/get_temp_credentials', authController.isBearerAuthenticated, contentUploadController.generateCredentialsBasedOnType);
// endpoint to save key of uploaded content to mongo-db (social network)
router.post('/save_key_catagory', authController.isBearerAuthenticated, contentUploadController.saveKeyByCatagery);
// endpoint to get key of uploaded content in mongo-db (social network)
router.get('/get_key_catagory/:username/:keyCatagory', authController.isBearerAuthenticated, contentUploadController.getKeyByCatagery);
// endpoint to delete key of uploaded content in mongo-db (social network)
router.delete('/delete_key_catagory/:username/:keyCatagory/:key', authController.isBearerAuthenticated, contentUploadController.deleteKeyByCatagery);
// endpoint to save content-metadata to Mongo
router.post('/save_content_meta', authController.isBearerAuthenticated, contentUploadController.saveUploadedContentMetaData);
// endpoint to get all videos
router.get('/get_all_content', authController.isBearerAuthenticated, contentUploadController.getAllSavedVideos);
// endpoint to get username videos
router.get('/get_all_content/:username', authController.isBearerAuthenticated, contentUploadController.getMyVideos);



router.get('/room/:username', authController.isBearerAuthenticated, roomController.getRoomStatus);
// endpoint to create a new room
router.post('/create_room', authController.isBearerAuthenticated, roomController.createRoom);
// endpoint to join an already created room
//router.post('/join_room', authController.isBearerAuthenticated, roomController.joinRoom);
// endpoint to exit a room -> both admins/non-admins
//router.post('/exit_room', authController.isBearerAuthenticated, roomController.exitRoom);
// endpoint to delete a room -> only room admins aka creators
//router.post('/delete_room', authController.isBearerAuthenticated, roomController.deleteRoom);

// Get the online friend list
//router.post('/get_online_friend_list', authController.isBearerAuthenticated, friendController.getOnlineFriends);



app.listen(port);

var j = schedule.scheduleJob('*/2 * * * *', function(){
    var OnlinePlayerModel = require('./models/online_player_model');

    var currenttime = new moment();
    OnlinePlayerModel.find({
        updateTime: {
            $lt: currenttime.subtract(2, 'minutes')
        }
    }).remove().exec();
});

console.log("Base Server started at "  + port);
