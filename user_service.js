/*
 * Allows for the creation, search, and validation of user credentials.  Note that for 
 * this demo, we are storing plain text passwords!  This is a security issue of the
 * highest order. In a real product using something like bcrypt is the secure way to store
 * passwords. Alas, Node does not include bcrypt in its core (at least not of Node 5.x, which this is 
 * written on.)
 */

////////////////// Exported Methods //////////////////

exports.create = create;
exports.findByUsername = findByUsername;
exports.validateCredentials = validateCredentials;

/////////////////// Implementation ///////////////////

function create(user) {
  if (exports.findByUsername(user.name) != null) {
    throw {message: "Username " + user.name + " already exists"};
  }
  
  users[user.name] = user;
  return scrubPassword(user);
}

function findByUsername(name, scrub) {
  if (typeof scrub == 'undefined') {
    scrub = true;
  }

  var user = users[name];
  if (user != null) {
    return scrub ? scrubPassword(user) : user; 
  }   
}

/*
 * Attempt to match up a supplied username/password with a current user.
 */ 
function validateCredentials(name, password) {
  var user = exports.findByUsername(name, false);
  
  if (user == null || user.password != password) {
    throw {message: "Username/password combination not found."};
  } else {
    return scrubPassword(user);
  }  
}

/*
 * Any time a user object is to be returned via the API, clear out the
 * password credentials, there's no reason to return that.
 */
function scrubPassword(user) {
  return {name : user.name, password: "********"}
}

var users = {}