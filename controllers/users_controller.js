//users_controller.js
var User = require("../models/users_model.js")
var Token = require("../models/token_model.js")

var Utils = require("../utils/utility.js")
bcrypt = require('bcrypt');



const saltRounds = 10;


exports.createUser = function(req, res) {

    var EmailV, phoneV, field, value
  	console.log("lai le")

    // check if email is sent or phone number is sent
    if (req.body.email) {
      emailV = req.body.email
      field = "email"
      value = emailV
    }
    else
      emailV = ""

    if (req.body.phone) {
      phoneV = req.body.phone
      field = "phone"
      value = phoneV
    }
    else
      phoneV = ""

    var user = new User({
    username: req.body.username,
    email:  emailV,
    phone: phoneV,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    });

    Utils.isUnique(field, value, function (err, result) {
      if (err) return Utils.db_error(res);

      if(!result) {

      user.save(function(err) {

      if (err) {
      var duplicateKey = 11000
      if (err.code == duplicateKey){
        return Utils.send(res, "error", "user already exists")
      }

      return Utils.db_error(res,err)
      }
      else
      Utils.send(res,"success", "user created successfully")

      });

      }
      else {
        Utils.send(res,"error", "email/phone already exists")
      }

  })



}



exports.signupPage = function(req,res) {
  res.render("signup.jade", {layout:false});
}

exports.loginPage = function(req,res)
{
  res.render("login.jade", {layout: false});
}

exports.loginUser = function(req, res) {

  var query

    if(req.body.email)
    query = {'email':req.body.email}
    else if (req.body.phone)
    query = {'phone':req.body.phone}
    else if (req.body.username)
    query = {'username':req.body.username}

    if(!query)
      return Utils.send(res,"error", "required fields are empty")

    User.findOne(query, function(err, user) {
      if(err) return res.send(err);
        if(user == null) {
          Utils.send(res,"error", "invalid username/email/phone")

        }
        else {
          auth(user)
        }
    });

    function auth( user ) {
      user.verifyPassword(req.body.password,function(err, isMatched) {
        if(err) return res.send(err)
        if (!isMatched) {
        Utils.send(res,"error","invalid password")
        }
        else {
          res.json({"username":user.username, "status":"success"})
        }
      });
    }


}

// Function to get User details when username is passed
exports.getUser = function(req,res) {
  User.findOne({username:req.params.username} , function(err, user) {
    if (err) return dbError(res, err)
    // removing password field from user object
    if(user)
    {
     user.password=undefined
    }
    res.json(user)
  })
}

//function to update user details when username is passed
exports.updateUser = function(req,res) {
  var query = {username:req.params.username}

  var doc = {
    firstname:req.body.firstname,
    lastname:req.body.lastname,
    phone:req.body.phone,
    email:req.body.email,
    birthday:req.body.birthday,
    occupation:req.body.occupation,
    introduction:req.body.introduction,
    country:req.body.country,
    area:req.body.area,
    project:req.body.project,
    accountType: req.body.accountType,
    category:req.body.category
  };

  if(req.body.password)
  {
   
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      doc['password'] = hash;
      var options = {new:true}

      User.findOneAndUpdate(query, {$set:doc}, options, function(err, user) {

        if(err) return Utils.db_error(res,err)

        return Utils.send(res,"success", "UserProfile updated successfully")



      })

    });

  }
  else {
      var options = {new:true}

      User.findOneAndUpdate(query, {$set:doc}, options, function(err, user) {

        if(err) return Utils.db_error(res,err)

     
        return Utils.send(res,"success", "UserProfile updated successfully")
        


      })
}

}

  exports.searchByName = function(req,res) {
    var firstname = req.params.firstname;
    User.find({firstname: new RegExp("^"+firstname, 'i') }, 'firstname lastname username', function(err, result) {
      if (err) return Utils.db_error(res,err)
      return res.json(result)
    })
  }


  exports.logoutUser = function(req,res) {
    var username = req.params.username

    var tokenname = req.body.token

    Token.findOneAndRemove('{username: username, token:tokenname}', function(err, result){
      if (err) return Utils.db_error(res,err)
      console.log("entered")
      return Utils.send(res,"success", "User Logged successfully")

    })

  }
