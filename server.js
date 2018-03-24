// Start and configure your server

var express = require('express');
var app = express();
var api = require('./api');
var bodyParser = require('body-parser');
require('dotenv').config();


// Middleware functions. 
// Servers HTML, images, etc. Points to public directory
app.use(express.static('./public'));
// Body-parser extracts the entire body portion of an incoming request stream and exposes it on  req.body
app.use(bodyParser.urlencoded({ extended: true }));
// When using path /api, invoke a callback function called api, which is api.js
app.use('/api', api);

//Have server listen to port 3000. For localhost:3000
app.listen(process.env.PORT || 3000, function () {
  console.log('Server is listening on port', process.env.PORT || 3000);
});
