var userService = require('./user_service');

////////////////// Exported Methods //////////////////

exports.login = login;
exports.logout = logout;
exports.validate = validate;

/////////////////// Implementation ///////////////////
 
/*
 * Attempt to log a user in by their name/password combination. If successful
 * this will create a 'random' authToken for the duration of the session.
 */ 
function login (name, password) {
  var user = userService.validateCredentials(name, password)
  
  //
  // Note: this is not cryptographically secure!
  //
  var authToken = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  
  sessions[authToken] = user;
  return authToken;    
}

/*
 * Clear the user's auth token, if one was present. Note that we never tell the 
 * caller whether the token was valid, but simply remove it if it exists.
 */
function logout (authToken) {
  sessions[authToken] = null; 
}

/*
 * Return a user based on the supplied authToken, or throw an exception
 * if no match can be found. This is our primary method of authenticating calls.
 */ 
function validate(authToken) {
  var user = sessions[authToken];
  if (user == null) {
    throw {message: "Invalid auth token."};
  } else {
    return user;
  }  
}

//
// Map of authToken -> User object
//
var sessions = {}