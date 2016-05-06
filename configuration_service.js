/*
 * 
 * A Configuration is the 4-tuple of {
 *   name,
 *   hostname,
 *   port, 
 *   username
 * }
 *
 * Where 'name' uniquely identifies the configuration within the context
 * of a single user.
 * 
 */ 

var fs = require('fs');

////////////////// Exported Methods //////////////////

exports.get = get;
exports.del = del;
exports.create = create;
exports.getByName = getByName;
exports.update = update;

/////////////////// Implementation ///////////////////

/*
 * Get a user's configurations, with paging enabled.  If
 * needed this will initialize a random configuration to 
 * get started.
 *
 * Note that this function does not check for the existence
 * of a  user from the user_service, it assumes that
 * user validation has already been done.  
 */
function get(userName, sort, offset, limit) {
  
  var configs = getByUser(userName);
  
  //
  // These are reasonable defaults.
  //
  var offset = offset || 0;
  var limit = limit || 20;
  
  return paginate(sortConfigs(sort, configs), offset, limit);
}

/*
 * Delete a specific configuration from a user.  Throws an exception
 * if no such configuration exists for the supplied user.
 */
function del(userName, configurationName) {
  var configs = configurations[userName];
  if (!configs) {
    throw {message : `Cannot delete configuration ${configurationName}, it couldn't be found.`}
  }
  for (var i = 0; i < configs.length; i++) {
    var config = configs[i];
    if (config.name === configurationName) {
      configs.splice(i, 1);
      break;
    }
  }
}

/*
 * Updates a specific configuration in place.  Note that this does not allow for the
 * modification of a configuration name, as the configuration name is used as the primary
 * key for our schema.
 */
function update(userName, config) {  
  var configs = configurations[userName];
  if (configs == null) {
    throw {message: `No configurations found for ${userName}, try creating some.`};  
  }
  
  for (var i = 0; i < configs.length; i++) {
    var existingConfig = configs[i];
    if (existingConfig.name === config.name) {
      configs[i] = config;
      return;
    }
  }  
  
  throw {message: `Could not update configuration ${config.name}, it doesn't exist.`};    
}

/*
 * Create new configuration for the given user.  This does not allow duplicates names. 
 */
function create(userName, config) {
  
  //
  // Ensure configs already exist for this user.
  //
  var configs = getByUser(userName);
  
  if (getByName(userName, config.name) != null) {
    throw {message: `Could not create configuration ${config.name}, it already exists.`};    
  }
   
  configs.push(config);
}


function getByUser(userName) {
  var configs = configurations[userName];
        
  if (configs == null) {
    configs = inventConfigurations();
    configurations[userName] = configs;
  }  
  
  return configs;
}

function getByName(userName, configName) {
  var configs = configurations[userName];
  if (configs == null) {
    throw {message: `${userName} has no configurations! Try creating some first.`};
  }
  
  for (var i = 0; i < configs.length; i++) {
    var config = configs[i];
    if (config.name === configName) {
      return config;
    }
  }  
  
  throw {message: `Configuration ${configName} not found.`};
}

//
// Map of user name -> configuration[]
//
var configurations = {}

//
// This is fun stuff...thanks to Docker for the idea of adjective-noun names.
//

var names = split(fs.readFileSync('resources/names.txt')); 
var nouns = split(fs.readFileSync('resources/nouns.txt'));
var adjectives = split(fs.readFileSync('resources/adjectives.txt'));

function split(input) {
  return input.toString().match(/[^\r\n]+/g);
}

function inventConfigurations() {
  
  //
  // Let's say 30 configurations
  //
  var configs = []
  for (var i = 0; i < 30; i++) {
   configs.push(invent());
  }
  
  return configs;
} 

function invent() {
  var name = randomFrom(names);
  var noun = randomFrom(nouns);
  var adjective = randomFrom(adjectives);
  
  return { name: noun, hostname: `${adjective}-${noun}.example.com`, username: `${name}`, port: Math.floor(Math.random() * 100 + 1)}
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}


/////////////////// Sorting Methods //////////////////

function sortConfigs(sortParameter, configs) {
  
  if (sortParameter == undefined) {
    return configs;
  } 
  
  //
  // Break our sortParameter into an array of sort directives, which
  // will be applied in order.  We reverse the order here because
  // we'll be treating the directives as a stack, where the first off 
  // is given the least precedence.
  //
  var sortDirectives = sortParameter.split(",").reverse();
  
  //
  // Make a copy of the array (we don't want to sort our stored data) and perform a sort.
  //
  var sortFunction = createSortFunctions(sortDirectives);
  return configs.slice(0).sort(sortFunction);
}

//
// Generates the sort function based on the field name
// and direction.  This function only works for numeric and
// string types.
//
function createSortFunctions(sortDirectives) {  
  
  //
  // Our shortcut function which is used when there's 
  // nothing nothing to sort.
  //
  if (sortDirectives.length === 0) {
    return function(a,b) {return 0;}
  }
    
  //
  // Our most recently created sort function. These are created
  // from low-high precedence, so the last one created is used
  // for for each sort.
  //  
  var sortFunction = null;
  
  for (var i = 0; i < sortDirectives.length; i++) {
    var directive = sortDirectives[i];
    sortFunction = createSortFunction(directive, sortFunction);    
  }  
  
  return sortFunction;     
}

function createSortFunction(directive, nextFunction) {
  return function(configA, configB) {
    
    var direction = /^\^.+/.test(directive) ? 1 : -1;   
    field = directive.replace(/^\^/, "");
        
    if (!configA.hasOwnProperty(field)) {
      throw {message: `Configurations have no field ${field}`};
    }    
                
    var a = configA[field];
    var b = configB[field];      
    
    var val;  
    if (Number.isInteger(a)) {
      val =  a > b ? 1 : (a < b ? -1 : 0);
    } else {
      val = a.localeCompare(b);
    }    
    
    if (val != 0) {
      return direction * val;
    } else if (nextFunction) {
      return nextFunction(configA, configB);
    } else {
      return val;      
    }    
  }
}

function paginate(configs, offset, limit) {
  
  var all = configs.length; 
  
  offset = offset < 0 ? 0 : offset;
  
  if (limit < 1) {
    throw {message: "Limit must be at least 1"};
  }

  if (offset > configs.length) {
    //
    // Shortcut, if our offset is greater than the total number of configurations,
    // just return an empty array.
    //
    configs = configs.slice(0);
  } else {    
    configs = configs.slice(offset, offset+limit);              
  }
  
    
  return {configs : configs, offset: offset, limit: limit, of: all};
}
