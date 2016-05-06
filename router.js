/*
 * A simplistic router that looks at basic regex matches and provides index
 * based variable substitution. See the 'register' function for details.
 */

url = require('url');

////////////////// Exported Methods //////////////////

exports.register = register;
exports.route = route;

/////////////////// Implementation ///////////////////

/*
 * Register a handler for a path and method.  This is a simple regex based router,
 * and group substitution is supported.  If a particular URL matches
 * multiple routes, it's undefined which route will be chosen.  Routes are case
 * insensitive!  We use strings here rather than raw regexes so we can avoid having to 
 * escape forward slashes.
 *
 * Variable substitution is supported, where a variable should match the entire
 * URL path element. Example: path="/configuration/{}/{}" will match /configuration/example/tom,
 * returning a var array of ['example','tom'] to the handler method. 
 *   
 * method must be one of 'GET', 'POST', 'PUT', 'DELETE', or 'PATCH'
 * 
 * The handler is a function taking three parameters: request, response, and a map of
 * variables to their URL indices.
 * 
 * Example: 
 *   router.register("/configurations/{}/{}", "DELETE", function(req, res, vars) {...})
 */
function register(path, method, handler) {
  
  /*
   * Replace the eye-friendly {} elements with regex wildcards.  If only Javascript supported
   * named groups we could send the handler a map of path variables using names rather
   * than indices!
   */ 
  var placeHolder = "{}";
  while (new RegExp(placeHolder).test(path)) {
    path = path.replace(placeHolder, "([^/]+)") 
  }
      
  getHandlers(method).push({path: path, handler: handler});
}

/*
 * Routes the actual request to the appropriate handler, returning a 404
 * if no match is found.
 */ 
function route function(req, res) {  
  var req_parts = url.parse(req.url, true);  
  var path = req_parts.pathname;
  var query = req_parts.query;
  
  //
  // Remove the trailing slash unless it's also the root slash
  //
  if (path != "/") {
    path = path.replace(/\/$/, "");
  }
  
  var handler = findHandler(path, req.method);
  if (handler != null) {
      handler.handler(req, res, handler.vars, query);
  } else {
    res.writeHead(404, {"Content-Type": "application/json"});
    res.end(JSON.stringify({message: `${path} not found`}));
  }
}

/*
 * Find a particular handler for the given method/path combination.  Returns
 * null if not found.  
 * 
 * If a match is found, we return a match object of the form {handler: handler, vars: vars},
 * where handler is the registered handler object and vars is the array of matched path variables.
 */
function findHandler(path, method) {
  var handlers = getHandlers(method);
  
  for (var handler of handlers) {
    var regex = new RegExp(handler['path'] + "$", "i");
    var result = regex.exec(path);
    if (result != null) {
      return {handler: handler['handler'], vars: result.slice(1)};
    }        
  }
  
  return null;  
}

/*
 * Find or create the handler array for the given method.
 */
function getHandlers(method) {
  var methodHandlers = handlers[method];
  if (methodHandlers == null) {
    methodHandlers = [];
    handlers[method] = methodHandlers;
  }
  
  return methodHandlers;
}

//
// Our Map of method->handler[]. This allows us to narrow our match scope to only those within
// a particular HTTP method (GET, POST, DELETE, PUT,etc).
//
var handlers = {};


