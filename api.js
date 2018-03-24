// To route all requests
// Client to server, aka sending data to Uber API

var router = require('express').Router();
var request = require('request');
var OAuth2 = require('oauth').OAuth2;
require('dotenv').config();

// Sandbox is development env.
var uberApiUrl = 'https://sandbox-api.uber.com/v1/';
var uberServerToken = process.env.UBER_SERVER_TOKEN;
var uberClientID = process.env.UBER_CLIENT_ID;
var uberClientSecret = process.env.UBER_CLIENT_SECRET;

// Use this if running on external host
// var serverUrl = 'http://' + require("os").hostname() + ':' + ( process.env.PORT || 3000 );
var serverUrl = 'http://localhost:' + ( process.env.PORT || 3000 );
// OAuth2 is authorization on how to get limited access to certain sites
var oauth2 = new OAuth2(
    uberClientID,
    uberClientSecret,
    'https://login.uber.com/',
    'oauth/authorize',
    'oauth/token',
    null);

// Routes an HTTP GET request.. Routing just means how the client will respond to a client request.
// “Listens” for requests that match the specified route(s) and method(s), and when it detects a match, it calls the specified callback function.
router.get('/estimates/price', function(req, res){
  var source = JSON.parse(req.query.source);
  var destination = JSON.parse(req.query.destination);
  // Create HTTP request to Uber API
  request.get({
    url : uberApiUrl + 'estimates/price',
    strictSSL: false,
    qs : {
      server_token : uberServerToken,
      start_latitude : source.lat,
      start_longitude : source.lng,
      end_latitude : destination.lat,
      end_longitude : destination.lng
    }
  }, function(err, response, body){
    if(err){
      return res.json(err);
    }
    res.json(body);
  });
});

// Routes an HTTP POST request
router.post('/get_ride', function(req, res){
  if( !req.body.hasOwnProperty('auth_token') ){
    return res.json({
      success : false,
      code : 401,
      popupUrl : getAuthorizeUrl()
    });
  }

  var uberRequest = {
    start_latitude : req.body.source.lat,
    start_longitude : req.body.source.lng,
    end_latitude : req.body.destination.lat,
    end_longitude : req.body.destination.lng,
    product_id : req.body.product_id
  };

  // Create HTTP request to Uber API
  request.post({
    url : uberApiUrl + 'requests',
    json : uberRequest,
    strictSSL: false,
    auth : {
      bearer : req.body.auth_token
    }
  }, function(err, response, body){
    if(err){
      return res.json(err);
    }
    body.success = true;
    res.json(body);
  });

});

// After user authorizes Uber in new window, redirected here. 
// From redirect after auth
router.get('/oauth/cb', function(req, res){
  var code = req.query.code;

  oauth2.getOAuthAccessToken(
    code,
    { // NOT IN THE UBER DOCS
      grant_type: 'authorization_code',
      redirect_uri: serverUrl+'/api/oauth/cb'
    },
    function (err, access_token, refresh_token, results){
      if(err){
        console.log(err);
        if(err.data){
          res.end(err.data);
        }else{
          res.json(err);
        }
      } else if(results.error) {
        console.log(results.error);
        res.json(results.error);
      } else {
        // If we get the access token, send back to client to store in cookies or something
        // POPUP Blocker must be disabled, or find workaround, or use redirect instead
        res.send(closeAndRedirectScript(access_token));
      }
    });
});

function closeAndRedirectScript(access_token) {
  return '<script> \
          if (window.opener != null && !window.opener.closed){ \
            window.opener.location = "'+redirectAccessTokenUrl(access_token)+'"; \
            window.close(); \
          }else{ \
            document.write("Pop-up blocker prevented proper authorization process. Please disable and re-authorize."); \
          } \
          </script>';
}

// Stores the access token
function redirectAccessTokenUrl(access_token) {
  return serverUrl + '#store-auth-token/' + access_token;
}

// This is presented to the client with a new window. Then the user authorizes Uber. Once authorized, it goes back to callback (those happen somewhere else)
function getAuthorizeUrl(){
  return oauth2.getAuthorizeUrl({
      redirect_uri: serverUrl + '/api/oauth/cb',
      scope: ['request'],
      state: 'authorizing',
      response_type: 'code'
    });
}


module.exports = router;
