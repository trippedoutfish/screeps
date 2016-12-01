//-------------------------------------------------------------------------
// Main
//-------------------------------------------------------------------------
console.log("++++++ new tick ++++++");

//-------------------------------------------------------------------------
// Modules
//-------------------------------------------------------------------------
// prototypes
require('prototype.creep')();
require('prototype.source')();
require('prototype.spawn')();

// other modules
var motivator = require('motivator')();
//var needManager = require('needManager')();

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// Do stuffs
//-------------------------------------------------------------------------
motivator.init();

//-------------------------------------------------------------------------
// END
//-------------------------------------------------------------------------
console.log("------ end tick ------");