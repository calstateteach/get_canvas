/* Module functions that query Canvas API endpoints.
07.23.2017 tps Created.
07.25.2017 tps Use Request module.
08.01.2017 tps Try with tiny-json-http npm module instead of request.
08.02.2017 tps tiny-json-http doesn't handle array parameters unless you have
02.05.2017 tps Don't add unnecessary query parameters to paged queries.
  parameter name like 'type[]'.
03.12.2018 tps Use .env file to get Canvas API secrets out of script.
03.12.2018 tps Allow clients to supress normal log messages.
08.08.2018 tps Explicitly specify where to find .env file.
06.26.2019 tps Add beta target.
*/

const tiny = require('tiny-json-http');
const linkHeaderParser = require('parse-link-header');

// ########### Endpoint constants ###########

// We might not be launched from the project folder.
const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '.env')})
// require('dotenv').config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REQUEST_HEADERS = {'Authorization':`Bearer ${ACCESS_TOKEN}`};

const BASE_URL_TEST = process.env.BASE_URL_TEST;
const BASE_URL_LIVE = process.env.BASE_URL_LIVE;
const BASE_URL_BETA = process.env.BASE_URL_BETA;
// var BASE_URL = BASE_URL_TEST; // Use test service by default.
var BASE_URL = BASE_URL_LIVE; // Live data is the default.

// Number of results to return per request.
const RESULTS_PER_PAGE = 20;

// Log to stdout
var isLogging = true;

// ######## Utility Functions ##########

function pagedCanvasQuery(endpointUrl, params, jsonList, resultCallback) {
  // Try recursion to create a series of paged calls.

  tiny.get({
    url: endpointUrl,
    data: params,
    headers: REQUEST_HEADERS
  },
    (err, response) => {

      // Pass errors to callback
      if (err) {
        console.log(`Got "${err}" from ${endpointUrl}`);
        // console.log(response); // Sometimes there is an error message here.
        return resultCallback(err);
      }

      if (isLogging) {
        console.log(`Got status "${response.headers.status}" from ${endpointUrl}`);
      }
      // console.log(body);
      var jsonResp = response.body;

      // The response might be a list of JSON dictionaries or it may be a single
      // JSON dictionary. If we have a list, we want to concatenate it to the
      // result list. If we have a single JSON dictionary, we want to append it
      //to the result list.
      // Return this list filled with JSON from Canvas API call.
      if (Array.isArray(jsonResp)) {
        jsonList = jsonList.concat(jsonResp);
      } else {
        jsonList.push(jsonResp);
      }

      // Results are paged, so keep querying until we've got all the data.
      var linkHeader = linkHeaderParser(response.headers['link']);
      // console.log(linkHeader);
      if (linkHeader && linkHeader['next']) {
        let nextUrl = linkHeader['next']['url'];

        // Next URL alrady includes query parameters, so don't pass them in again.
        // pagedCanvasQuery(nextUrl, params, jsonList, resultCallback);
        pagedCanvasQuery(nextUrl, {}, jsonList, resultCallback);
      } else {
        return resultCallback(null, jsonList);
      }
    }); // end request() callback.
} // end defining pagedCanvasQuery()


// ######## Module Exports ##########

exports.useLiveData = () => {
  BASE_URL = BASE_URL_LIVE;
  return exports;
}


exports.useTestData = () => {
  BASE_URL = BASE_URL_TEST;
  return exports;
}

exports.useBetaData = () => {
  BASE_URL = BASE_URL_BETA;
  return exports;
}

exports.setIsLogging = (bIsLogging) => {
  isLogging = bIsLogging;
}


exports.get = (endpoint, queryParams, resultCallback) => {
  /* Async call to populate list with JSON objects from Canvas API query.
  */
  // Build full endpoint URL
  let endpointUrl = BASE_URL + endpoint

  // Specify number of results to return in each request.
  // Client may override the default.
  let queryParamsCopy = { per_page: RESULTS_PER_PAGE };
  queryParamsCopy = Object.assign(queryParamsCopy, queryParams);

  pagedCanvasQuery(endpointUrl, queryParamsCopy, [], resultCallback);
};  // end queryEndpoint function definition.


exports.post = (endpoint, postParams, resultCallback) => {
  tiny.post({
    url: BASE_URL + endpoint,   // Build full endpoint URL
    data: postParams,
    headers: REQUEST_HEADERS
  },
    (err, response) => {
      console.log(`Got status "${response.headers.status}" from ${endpoint}`);
        resultCallback(null, response.body);
    }); // end request callback.

};  // end post function definition.
