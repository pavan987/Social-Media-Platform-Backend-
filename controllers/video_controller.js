var Video = require('../models/video_model');

exports.postVideo = function(req, res) {
    var video = new Video(); // creating a new video object
    
    // initialising the objects params got from the request body
    video.videoTitle = req.body.video_title;
    video.videoDescription = req.body.video_description;
    video.videoUrl = req.body.video_url;
    video.userId = req.user._id;

    // saving video on to the db
    video.save(function(error) {
        if (error) {
            return res.json({ success : false, status : error }); // every json response will have these 2 fields
        }
        res.json({ success : true, status : video }); // sending video data for response as of now
    });
}

// getting all the videos uploaded by a user
exports.getAllVideos = function(req, res) {
    Video.find({ userId : req.user._id }, function(error, videos) {
        if (error) {
            return res.json({ success : false, status : error });
        }
        res.json({ success : true, status : videos });
    });
};

// getting videos by title
exports.getVideosByName = function(req, res) {

    // the query for book comes as part of the url as a query-string
    Video.find({ videoTitle : req.params.title, userId : req.user._id }, function(error, videos) {
        if (error) {
            return res.json({ success : false, status : error });
        }
        res.json({ success : true, status : videos });
    });
}

// updating the meta-data of an already uploaded video
exports.updateVideoMeta = function(req, res) {

    // querying to check if the video is present, if present update else throw an error
    // the param to find the video comes from the url
    Video.findOneAndUpdate( { videoTitle : req.params.title, userId : req.user._id }, {$set : {videoTitle : req.body.video_title, 
        videoDescription : req.body.video_description, videoUrl : req.body.video_url}}, { new : true }, 
        function (error, video) {
            if (error) {
                return res.json({ success : false, status : error });
            }
            res.json({ success : true, status : "Updated video info successfully!!" });
        });
};

// deleting an uploaded video
exports.deleteVideo = function(req, res){

    // the param to delete the video comes from the url
    Video.findOneAndRemove({ videoTitle : req.params.title, userId : req.user._id }, function(error, removedVideo) {
        if (error) {
            return res.json({ success : false, status : error });
        }
        res.json({ success : true, status : "Successfully deleted the video!!" });
    });
};