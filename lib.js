//-------------------------------------------------------------------------
// lib
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// modules
//-------------------------------------------------------------------------

//-------------------------------------------------------------------------
// Declarations
//-------------------------------------------------------------------------


//-------------------------------------------------------------------------
// function
//-------------------------------------------------------------------------
module.exports = 
{
	"isNull": function (value)
	{
        if (typeof value == "undefined" || value == null)
            return true;
        else
            return false;
	}
}