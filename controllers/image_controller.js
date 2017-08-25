var multer = require('multer');


exports.uploadImage = function(req,res) {
          var storage = multer.diskStorage({ //multers disk storage settings
          destination: function (req, file, cb) {
            cb(null, 'uploads/images/');
          },
          filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, req.user.username);
          }
          });

          var upload = multer({ //multer settings
                    storage: storage
                }).single('file');

    
          upload(req,res,function(err){
              if(err){
                res.json({error_code:1,err_desc:err});
                 return;
              }
              res.json({error_code:0,err_desc:null});
          });
    }