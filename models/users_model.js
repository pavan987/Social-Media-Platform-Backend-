//user_model.js

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

const saltRounds = 10;


//USER SCHEMA
var userSchema = new Schema({
    username: {type: String, unique: true, required:true},
	  email: {type: String},
    password: {type:String,required:true},
    firstname: String,
    lastname: String,
    phone: String,
    birthday: Date,
    occupation: String,
    introduction: String,
    country: String,
    area: String,
    project: String,
    category: String,
    accountType: String,
    date: {type: Date, default: Date.now},
    // key
    profile_pic: [],
    images: [],
    videos: []
});

// execute before each user save call
userSchema.pre('save', function(next) {
  var user=this;

  //if the password has not changed
  if (!user.isModified("password")) return next();

  // else password has changed, hash it
  bcrypt.hash(user.password, saltRounds, function(err, hash) {
  console.log("entered");
    if (err) return next(err);
    // Store hash in your password DB.
    user.password = hash;
    next();
  });

});

userSchema.methods.verifyPassword = function(password, next) {

bcrypt.compare(password,this.password, function(err,isMatched)
{
  if(err) return next(err);
  next(null, isMatched);
});

}


module.exports = mongoose.model('User', userSchema);
