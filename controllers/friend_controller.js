var User = require('../models/users_model.js');
var Friend = require('../models/friend_model.js');
var Utils = require('../utils/utility.js');
var FinalFriend = require('../models/final_friend_model.js');
var OnlinePlayerModel = require('../models/online_player_model');

// function to send friend request to a friend

exports.sendfriendRequest = function (req,res) {
	// username who is requesting
	var my_username = req.body.my_username
	var query

	// email or phone or username of the friend where request is sent
	if(req.body.email)
		query = {'email':req.body.email}
	else if (req.body.phone)
		query = {'phone':req.body.phone}
	else if (req.body.username)
		query = {'username':req.body.username}

	// find if the friend exists or not
	User.findOne(query, 'username', function(err, friend) {
		// db error
		if(err) return Utils.db_error(res,err)
		// friend not found
		if(!friend) return Utils.send(res, "error", "friend does not exist")
		// if friend exists
		var friend_username = friend.username;
		// get firstname, lastname and id of the user who is requesting
		User.findOne({"username":my_username}, 'firstname lastname username', function(err,myuser) {
			// db error
			if (err) return Utils.db_error(res,err)
			// find if username already present in Friends model
			Friend.findOne({username:friend_username}, function(err,friend) {
			if (err) return Utils.db_error(res,err)

			// if friend is present in model, update it
			if (friend) {
				// get the array of existing requests for the friend
				var requestsArray = friend.requests
				// append myuser to existing array if myuser is not already present else return error
				var myuser_username = myuser.username;


				// check if myuser is already present in array
				var index = requestsArray.map(function(d) {
				    if(d == null) return -1;
					return d['username'];
				}).indexOf(myuser_username)

				// if not present then push to existing list
				if (index == -1 ) {
					requestsArray.push(myuser)
				}
				// if already present, send error
				else {
					return Utils.send(res,"error", "request already sent")
				}

				// update the friend object with new array
				friend.requests = requestsArray

			}
			// if friend not present in model, create it
			else {
				// create friend
				var friend = new Friend({
					username : friend_username,
					requests : [myuser]

				})
			}

			// save the friend object to the db
			friend.save(function(err) {
				if (err) return Utils.db_error(res,err)
				else
					Utils.send(res,"success", "friend request sent")
				})


			})



		})


	})

}

// Function to get list of friend requests requested by user


  exports.getFriendRequests = function(req,res) {

    var username = req.params.username
	var query

    if (req.params.username)
		query = {'username':username}
    else
        Utils.send(res, "error", "user field cannot be empty")


        Friend.findOne({username:username} , function(err, result) {
        if (err) return dbError(res, err)
         // if friend does not exist
        if(!result) return res.json({'list':[]})
		// return list of friend request
         res.json({'list':result.requests})
    })

}


// function to update pending request to accept/ignore
// pending implementation for status - ignore

   exports.updatePendingRequest = function(req,res) {

        var my_username = req.params.my_username
	    var friendname = req.body.username
        var status = req.body.status

				if(status == "ignore") {
					Friend.findOneAndRemove({username:my_username}, function(err, result) {
						 if (err) return dbError(res, err)
						 res.json(result);
				})
			}
        else if(status == "accept") {

               // find the user in the pending requests i.e. Friend table
               Friend.findOne({username:my_username}, function(err, result) {
                     if (err) return dbError(res, err)
                     // update the request array by deleting the pending request
                     if (result == null) return; else {var friendList = result.requests}
                     var usernameList = friendList.map(function(d) {
								if(d == null) return -1;
					              return d['username']
				                  })
                      var index = usernameList.indexOf(friendname)

                      if(index>-1) {
                              friendList.splice(index,1)
                          }
                     result.requests = friendList

                     result.save(function(err) {
    				     if (err) return Utils.db_error(res,err)

                         else {
                             // add the friend "friendname" to finalfriends table of my_username
                             FinalFriend.findOne({username:my_username}, function(err, finalFriendObj) {

                                if (err) {
                                    return Utils.db_error(res,err)
                                    }
                                // get details of friend
                                User.findOne({'username':friendname}, 'firstname lastname username', function(err,friendDetails) {
                                    if (err) {
                                        noerror = false
                                        return Utils.db_error(res,err)
                                        }
                                    // insert friendDetails in to friends list of my_username
                                    if(finalFriendObj) {

                                         var friendList = finalFriendObj.friends
                                         var usernameList = friendList.map(function(d) {
                                                      return d['username']
                                                      })
                                          var index = usernameList.indexOf(friendname)

                                          if(index>-1) {
                                                return Utils.send(res,"error", "already friend")
                                            }
                                          else {
                                            finalFriendObj['friends'].push(friendDetails)
                                            finalFriendObj.save(function(err) {
                                                if(err) {
                                                    return Utils.db_error(res,err)
                                                }
                                            })
                                           }
                                    }

                                    else {

                                     var friend = new FinalFriend({
                                         username : my_username,
        					             friends : [friendDetails]
                                        })
                                     friend.save(function(err) {
                                         if(err) {
                                            return Utils.db_error(res,err)
                                           }
                                     })

                                    }

                                    FinalFriend.findOne({username:friendname}, function(err, finalFriendObj) {

                                        if (err) return Utils.db_error(res,err)

                                        User.findOne({'username':my_username}, 'firstname lastname username', function(err,friendDetails) {
                                            if (err) return Utils.db_error(res,err)

                                            if(finalFriendObj) {
                                                 var friendList = finalFriendObj.friends
                                                 var usernameList = friendList.map(function(d) {
                                                              return d['username']
                                                              })
                                                  var index = usernameList.indexOf(friendname)

                                                  if(index>-1) {
                                                        return Utils.send(res,"error", "already friend")
                                                    }
                                                  else {

                                                    finalFriendObj['friends'].push(friendDetails)
                                                    finalFriendObj.save(function(err) {
                                                        if(err) return Utils.db_error(res,err)
                                                        return Utils.send(res,"success", "friend request accepted")
                                                     })
                                                   }
                                            }

                                            else {
                                             var friend = new FinalFriend({
                                                 username : friendname,
                                                 friends : [friendDetails]
                                                })
                                             friend.save(function(err) {
                                                 if(err) return Utils.db_error(res,err)
                                                 return Utils.send(res,"success", "friend request accepted")
                                                })
                                            }

                                        })

                                    })

                                })

                            })

                         // end of else
                        }
                    })
                })
            }
        }


// function to get friends list of username

exports.getFriends = function (req, res) {

    var username = req.params.username
    var query

    if (req.params.username)
        query = {'username': username}
    else
        return Utils.send(res, "error", "user field cannot be empty")


    FinalFriend.findOne({username: username}, function (err, result) {
        if (err) return dbError(res, err)
        // if friend does not exist
        if (!result) return res.json({'list': []})
        // return list of friend request
        res.json({'list': result.friends})
    })

};

// function to remove friend

exports.removeFriend = function (req, res) {

    var myusername = req.params.username
		var friend_username = req.body.username
    var query

    if (req.params.username)
        query = {'username': myusername}
    else
        return Utils.send(res, "error", "user field cannot be empty")

			if (req.body.username)
		        query = {'username': friend_username}
		    else
		        return Utils.send(res, "error", "user field cannot be empty")


    FinalFriend.findOne({username:myusername}, function (err, result) {
        if (err) return dbError(res, err)
				var friendList = result.friends;
				var usernameList = friendList.map(function(d) {
				if(d == null) return -1;
					 return d['username']
				})
				 var index = usernameList.indexOf(friend_username)

				 if(index>-1) {
								 friendList.splice(index,1)
						 }
				result.friends = friendList

				result.save(function(err){
					if (err)
						return Utils.send(res,"error", "error in removing friend")
					else {

						FinalFriend.findOne({username:friend_username}, function (err, result) {
								if (err) return dbError(res, err)

								var friendList = result.friends;
								var usernameList = friendList.map(function(d) {
								if(d == null) return -1;
									 return d['username']
								})
								 var index = usernameList.indexOf(myusername)

								 if(index>-1) {
												 friendList.splice(index,1)
										 }
								result.friends = friendList

								result.save(function(err){
										if(err)
										{
										return Utils.send(res,"error", "error in removing friend")
										}
										else {
										return Utils.send(res,"success", "friend removed successfully")

										}
								});
				})

			}
	});

})
}

exports.getOnlineFriends = function (req, res) {
    FinalFriend.findOne({username: req.body.username}, function (err, result) {
        if (err) return dbError(res, err)
        // if friend does not exist
        if (!result) return Utils.send(res, "error", "There is nobody in the friendList")
        // return list of friend request
        var friendList = result.friends;
        // the friend list will only have those online friend
        friendList.filter(function (friend) {
            var online = false;
            OnlinePlayerModel.findOne({username: friend}, function (err, result) {
                if (err) return Utils.db_error(err, res);
                if (result) online = true;
            });
            if(online) {
                return friend;
            }
        });
        // return the online friend list
        res.json({'onlineFriendList': friendList});
    })

};
