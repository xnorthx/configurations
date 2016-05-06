var http = require('http');
var userService = require('./user_service');
var sessionService = require('./session_service');
var configService = require('./configuration_service'); 
var router = require('./router');

var server = http.createServer(router.route);


///////////////////////////////////////////////////////////////
// Our registered handlers (controllers).
///////////////////////////////////////////////////////////////

//
// Register a new user on the system.
//
router.register("/users", "POST", function(req, res, urlurlVars){
    toJson(req, function(user){
      try {
        user = userService.create(user);
        respond(res, 200, user);        
      } catch (e) {
        respond(res, 400, {message: e.message});              
      }      
    });    
});

//
// Login that user and assign a session ID.
//
router.register("/login", "POST", function(req, res, urlVars){
    toJson(req, function(login){
      try {
        authToken = sessionService.login(login.name, login.password);
        respond(res, 200, {"authToken" : authToken});        
      } catch (e) {
        respond(res, 400, {message: e.message});              
      }      
    });    
});

//
// Log a user out.  Give no indication if the session was a valid one.
//
router.register("/logout", "GET", function(req, res, urlVars){
  try {
    sessionService.logout(authToken);
    respond(res, 204);        
  } catch (e) {
    respond(res, 400, {message: e.message});              
  }      
});    

router.register("/configurations/{}", "GET", function(req, res, urlVars, query){
      try {
        var user = sessionService.validate(req.headers["auth-token"]);
        validateOrThrow(urlVars[0], user);
        respond(res, 200, configService.get(user.name, query.sort, parseInt(query.offset), parseInt(query.limit)));        
      } catch (e) {
        respond(res, 404, {message: e.message});              
      }  
});

router.register("/configurations/{}/{}", "GET", function(req, res, urlVars){
      try {
        var user = sessionService.validate(req.headers["auth-token"]);
        validateOrThrow(urlVars[0], user);        
        respond(res, 200, configService.getByName(user.name, urlVars[1]));        
      } catch (e) {
        respond(res, 404, {message: e.message});              
      }  
});

router.register("/configurations/{}/{}", "DELETE", function(req, res, urlVars){
      try {
        var user = sessionService.validate(req.headers["auth-token"]);
        validateOrThrow(urlVars[0], user);                
        respond(res, 200, configService.del(user.name, urlVars[1]));        
      } catch (e) {
        respond(res, 400, {message: e.message});              
      }  
});

router.register("/configurations/{}", "POST", function(req, res, urlVars){
    toJson(req, function(config){
      try {
        var user = sessionService.validate(req.headers["auth-token"]);
        validateOrThrow(urlVars[0], user);
        
        //
        // Let's fail fast if the port isn't an int.
        //        
        config.port = parseInt(config.port);        
        configService.create(user.name, config);
        respond(res, 200, {message: "Config created"});        
      } catch (e) {
        respond(res, 400, {message: e.message});              
      }      
    });  
});

router.register("/configurations/{}", "PUT", function(req, res, urlVars){
    toJson(req, function(config){
      try {
        var user = sessionService.validate(req.headers["auth-token"]);
        validateOrThrow(urlVars[0], user);                
        configService.update(user.name, config);        
        respond(res, 200, {message: "Config updated"});        
      } catch (e) {
        respond(res, 400, {message: e.message});              
      }      
    });  
});


server.listen(8000);

console.log("Server running at http://127.0.0.1:8000/");


function validateOrThrow(userName, user) {
  if (userName != user.name) {
    throw {message: `${user.name} does not have access to resources belonging to ${userName}`}; 
  }
}

function respond(res, status, obj) {
  res.writeHead(status, {"Content-Type": "application/json"});
  res.end(JSON.stringify(obj, null, 2));  
}

function toJson(req, callback) {
  var json = '';

  req.on('data', function (data) {
    json += data;
  });

  req.on('end', function () {
    callback(JSON.parse(json));
  });  
}