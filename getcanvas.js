#!/usr/bin/env node
/* Query Canvas API endpoints from the command line.
07.30.2017 tps Created.
02.09.2019 tps Handle evaluation of property paths for field parameters.
06.26.2019 tps Add beta endpoint switch.
*/

// Give usage hints if not enough args given
var commandArgs = process.argv;
if (commandArgs.length < 3) {
  var s =
`Usage: getcanvas courses 90 sections
  Retrieves Canvas entities for endpoint "courses/90/sections"

Usage: getcanvas courses -o id name
  Ouputs the id & name fields of Canvas entities for endpoint "courses"

Usage: getcanvas courses -o calendar.ics
  Outputs the nested calendar.ics field of Canvas entities for endpoint "courses"

Usage: getcanvas courses -p enrollment_type teacher
  Retrieves Canvas entities for endpoint "courses", filtered by query parameter "enrollment_type" with value of "teacher"

Usage: getcanvas courses -a state[] unpublished deleted
  Retrieves Canvas entities for endpoint "courses", filtered by query parameter "state[]" with values "unpublished" and "deleted"

Usage: getcanvas courses -f id 52
  Retrieves Canvas entities for endpoint "courses", filtered by id == 52.

Usage: getcanvas -t courses
  Retrieves data from test Canvas site rather than live site, which is the default.
fo
Usage: getcanvas -b courses
  Retrieves data from beta Canvas site rather than live site, which is the default.

Usage: getcanvas courses -e public_description
  Retrieves Canvas entities for endpoint "courses", filtered by course objects that contain a non-null value for the property "public_description"
  
Usage: getcanvas courses -j
  Write only Canvas entities JSON & error messages to stdout`;

  console.log(s);
  return;
}

var canvasApi = require('./canvasApiWithTiny');

// var useLiveData = true;  // Query live data by default
var endpointArgs = [];
var fieldArgs = [];
var singleParams = [];
var arrayParams = [];
var filterExpression = [];
var filterProperty = null;
var isLogging = true;

// Enum representing arguments we're collecting
const collectingState = {
  ENDPOINT_ARGS: 0,
  FIELD_ARGS: 1,
  SCALAR_PARAM_ARGS: 2,
  VECTOR_PARAM_ARGS: 3,
  FILTER_EXPRESSION: 4,
  PROPERTY_EXISTS: 5
};
var isCollecting = collectingState.ENDPOINT_ARGS;


// Gather command arguments for building Canvas API endpoint & list of fields to show.
for (let i = 2; i < commandArgs.length; ++i) {
  arg = commandArgs[i];

  // Look for argument prefixes
  switch (arg) {
    case '-o':
      isCollecting = collectingState.FIELD_ARGS;
      continue;
    case '-p':
      isCollecting = collectingState.SCALAR_PARAM_ARGS;
      singleParams.push([]);
      continue;
    case '-a':
      isCollecting = collectingState.VECTOR_PARAM_ARGS;
      arrayParams.push([]);
      continue;
    case '-t':
      canvasApi.useTestData();
      // useLiveData = false;
      continue;
    case '-b':
      canvasApi.useBetaData();
      continue;
    case '-t':
      canvasApi.useTestData();
      // useLiveData = false;
      continue;
    case '-f':
      isCollecting = collectingState.FILTER_EXPRESSION;
      continue;
    case '-e':
      isCollecting = collectingState.PROPERTY_EXISTS;
      continue;
    case '-j':
      isLogging = false;
      continue;
    default:
      break;
  };

  // Gather argument into appropriate collection
  switch (isCollecting) {
    case collectingState.ENDPOINT_ARGS:
      endpointArgs.push(arg);
      break;
    case collectingState.FIELD_ARGS:
      fieldArgs.push(arg);
      break;
    case collectingState.SCALAR_PARAM_ARGS:
      singleParams[singleParams.length - 1].push(arg);
      break;
    case collectingState.VECTOR_PARAM_ARGS:
      arrayParams[arrayParams.length - 1].push(arg);
      break;
    case collectingState.FILTER_EXPRESSION:
      filterExpression.push(arg);
      break;
    case collectingState.PROPERTY_EXISTS:
      filterProperty = arg;
    default:
      break;
   };
} // end loop through command line args

// Configure data source
// var canvasApi = require('./canvasApiWithTiny');
// useLiveData ? canvasApi.useLiveData() : canvasApi.useTestData();
// if (useLiveData) {
  //canvasApi.useLiveData();
//}
canvasApi.setIsLogging(isLogging);

// Build endpoint
var endpoint = endpointArgs.join('/');

// Build scalar parameters.
// Assume each array element holds a nested array of at least 2 elements.
// First element of nested array is parameter name.
// Second element of nested array is parameter value.
var queryParams = {};
for (let a of singleParams) {
  queryParams[a[0]] = a[1];
}

// Build array parameters.
// Assume each array element holds a nested array of at least 2 elements.
// First element of nested array is parameter name.
// Remaining elements of nested array are values of array parameter.
for (let a of arrayParams) {
  queryParams[a[0]] = a.slice(1);
}

// Build array filter function that filters by field == value,
// where field name is specified by first filter expression argument
// and value is specified by 2nd filter expression argument.
var outputFilter = null;
if (filterExpression.length > 1) {
  outputFilter = function(e) {
    return ( e[filterExpression[0]] == filterExpression[1] );
  };
}

canvasApi.get(endpoint, queryParams,  (err, json) => {

  if (err) {  // There's nothing else to do if Canavs returns error.
    // return console.log(err.toString());
    return;
  }

  // Apply output filter
  if (outputFilter) {
    json = json.filter(outputFilter);
  }

  // Filter for objects containing a specific property
  if (filterProperty) {
    json = json.filter( e => e.hasOwnProperty(filterProperty) );
  }
  
  // Output entire JSON objects.
  if (isLogging) {
    console.log();
  }
  if (fieldArgs.length <= 0) {
    console.log(JSON.stringify(json, null, 2));
  } else {
    // Output selected fields of each object
    for (o of json) {
      let outputValues = []
      for (field of fieldArgs) {
        // Output a field value. Try to stringify it if it's an object itself.
        // Handle case of field being a property path, like "user.name" or "submission_type[0]"
        
        let fieldValue = '';  // Display nothing if the property evaluation fails.
        try {
          fieldValue = (function() {
            return Function('obj', 'return obj.' + field);
          })()(o);
        } catch(ignoreError) {
        }
        if (typeof fieldValue === 'object') {
          outputValues.push(JSON.stringify(fieldValue, null, 2));
        } else {
          outputValues.push(fieldValue);
        }
      } // end loop through fields
      console.log(outputValues.join(', '));
    } // end loop through JSON objects
  } // end else outputting selected fields

  if (isLogging) {
    console.log();
    console.log(`${json.length} objects returned from querying ${endpoint}`);
  }
}); // end querying Canvas API
