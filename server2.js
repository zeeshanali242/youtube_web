
var http = require('http');
var express = require('express');
var Session = require('express-session');
var { google } = require('googleapis');
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID//  "1062555331684-9tmtl6mkdrtfpv683revvvaa199geh48.apps.googleusercontent.com";
const CLIENT_SECRET = process.env.CLIENT_SECRET//"W0EajrE4KQojqRm41aaqNaTX";
//const RedirectionUrl = "http://localhost:3000/Callback";
var OAuth2 = google.auth.OAuth2;
var moment = require('moment');

//starting the express app
var app = express();

//this is the base route
app.get("/", function (req, res) {
    res.send(`
    <h1>Authentication using google oAuth</h1> 
    <a href="open" >Login</a>;
    `)
});


app.get("/open", function (req, res) {
    var host = req.protocol+'://'+req.headers.host+'/Callback';
    res.type('text/html; charset=utf8');
    var url = getAuthUrl(host);
    res.send(`
    <script> window.open('${url}', 'yourWindowName', 'width=599,height=600');</script>
    `)
});

app.get("/Callback", function (req, res) {
    var host = req.protocol+'://'+req.headers.host+'/Callback';
    var oauth2Client = getOAuthClient(host);
    var code = req.query.code; // the query param code
    oauth2Client.getToken(code, function (err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (!err) {
            res.send(`please wait.....`);
            oauth2Client.setCredentials(tokens.refresh_token);
            console.log('$$$$$$$$oauth2Client$44 ',tokens)
            oauth2Client.on('tokens', (tokens) => {
                console.log("ca;;")
                if (tokens.refresh_token) {
                    // store the refresh_token in my database!
                    console.log( 'heheh ',tokens.refresh_token);
                   
                }
            });
            console.log("iffff ");
            //window.close();
            //saving the token to current session
           
        
        }
        else {
            console.log(err.response.data);
            console.log("else");
        
        }
    });
});


function getOAuthClient(host) {
    return new OAuth2(YOUTUBE_CLIENT_ID, CLIENT_SECRET, host);
}

function getAuthUrl(host) {
    var oauth2Client = getOAuthClient(host);
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/plus.me'
    ];
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });
    return url;
}







var port = 3000;
var server = http.createServer(app);
server.listen(port);
server.on('listening', function () {
    console.log(`listening to ${port}`);
});