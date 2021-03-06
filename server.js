/**
 *  Copyright (c) 2017-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

const child_process = require('child_process');
const express = require('express');
const WebSocketServer = require('ws').Server;
const https = require('https')
const fs = require('fs')
var readline = require('readline');
var {google} = require('googleapis');
var path = require('path');
const Rox = require("rox-node");
const appSettingsContainer = {
  isWebLive: new Rox.Flag(),
};
const passport = require('passport');
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;


const app = express();
const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}

app.use('/js', express.static(path.resolve(__dirname)));
const server = https.createServer(httpsOptions,app).listen(4000,() => {
  console.log('Listening...');
});

app.get('/login', async function (req, res) {
   res.sendFile(path.join(__dirname+'/live.html'));
})

function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    forUsername: 'GoogleDevelopers'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  channels[0].id,
                  channels[0].snippet.title,
                  channels[0].statistics.viewCount);
    }
  });
}

const wss = new WebSocketServer({
  server: server
});

app.use((req, res, next) => {
  console.log('HTTP Request: ' + req.method + ' ' + req.originalUrl);
  return next();
});

app.use(express.static(__dirname + '/www'));

wss.on('connection', (ws) => {
  
  // Ensure that the URL starts with '/rtmp/', and extract the target RTMP URL.
  let match;
  if ( !(match = ws.upgradeReq.url.match(/^\/rtmp\/(.*)$/)) ) {
    ws.terminate(); // No match, reject the connection.
    return;
  }
  console.log("match is ",match);
  const rtmpUrl = decodeURIComponent(match[1]);
  console.log('Target RTMP URL:', rtmpUrl);


  const ffmpeg = child_process.spawn('ffmpeg', [
    '-i', '-',
    '-r','23.976',
    '-c:v', 'libx264',
    "-framerate" , "23",
    '-b:v','2500k',
    '-b:a','128k',
    '-s','1280x720',
    "-c:a","aac",
    '-acodec', 'aac',
    '-f', 'flv',
    rtmpUrl 
  ]);
//  ffmpeg -f alsa -ac 2 -i hw:0,0 -i /dev/video0 -f v4l2 -s 1280x720 -r 10   -vcodec libx264 -pix_fmt yuv420p -preset ultrafast -r 25 -g 20 -b:v 2500k -codec:a libmp3lame -ar 44100 -threads 6 -b:a 11025 -bufsize 512k -f flv rtmp://a.rtmp.youtube.com/live2/1w29-d4pk-m8r5-1f4x



//ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono  -f v4l2 -r 10 -i /dev/video0 -i :0.0 -f pulse -i default -c:v libx264 -pix_fmt yuv420p -preset ultrafast -g 20 -b:v 2500k  -c:a aac -ar 44100 -threads 0 -bufsize 512k -strict experimental -f flv rtmp://a.rtmp.youtube.com/live2/x9vt-tj8t-3782-c0uf
  
  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on('close', (code, signal) => {
    console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
    ws.terminate();
  });
  
  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e);
  });
  
  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg STDERR:', data.toString());
  });

  // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
  ws.on('message', (msg) => {
    console.log('DATA', msg);
    ffmpeg.stdin.write(msg);
  });
  
  // If the client disconnects, stop FFmpeg.
  ws.on('close', (e) => {
    ffmpeg.kill('SIGINT');
  });
  
});
