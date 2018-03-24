var express = require('express');
var app = express();
var api = require('./api');
var bodyParser = require('body-parser');
require('dotenv').config();


//Middleware function. Servers HTML, images, etc. Points to public directory
app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', api);

//Have server listen to port 3000. For localhost:3000
app.listen(process.env.PORT || 3000, function () {
  console.log('Server is listening on port', process.env.PORT || 3000);
});
