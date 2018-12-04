/*/
/ Options
var jQueryScript = document.createElement('script');  
jQueryScript.setAttribute('src','https://unpkg.com/axios/dist/axios.min.js');
document.head.appendChild(jQueryScript);
const CLIENT_ID = '1062555331684-9tmtl6mkdrtfpv683revvvaa199geh48.apps.googleusercontent.com';
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultChannel = 'techguyweb';

// Form submit and change channel
channelForm.addEventListener('submit', e => {
  e.preventDefault();

  const channel = channelInput.value;

  getChannel(channel);
});

// Load auth2 library
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
  gapi.client
    .init({
      discoveryDocs: DISCOVERY_DOCS,
      clientId: CLIENT_ID,
      scope: SCOPES
    })
    .then(() => {
      // Listen for sign in state changes
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      // Handle initial sign in state
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    content.style.display = 'block';
    videoContainer.style.display = 'block';
    getChannel(defaultChannel);
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    content.style.display = 'none';
    videoContainer.style.display = 'none';
  }
}

// Handle login
function handleAuthClick() {
  gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
  gapi.auth2.getAuthInstance().signOut();
}

// Display channel data
function showChannelData(data) {
  const channelData = document.getElementById('channel-data');
  channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel) {
  gapi.client.youtube.channels
    .list({
      part: 'snippet,contentDetails,statistics',
      forUsername: channel
    })
    .then(response => {
      console.log(response);
      const channel = response.result.items[0];

      const output = `
        <ul class="collection">
          <li class="collection-item">Title: ${channel.snippet.title}</li>
          <li class="collection-item">ID: ${channel.id}</li>
          <li class="collection-item">Subscribers: ${numberWithCommas(
            channel.statistics.subscriberCount
          )}</li>
          <li class="collection-item">Views: ${numberWithCommas(
            channel.statistics.viewCount
          )}</li>
          <li class="collection-item">Videos: ${numberWithCommas(
            channel.statistics.videoCount
          )}</li>
        </ul>
        <p>${channel.snippet.description}</p>
        <hr>
        <a class="btn grey darken-2" target="_blank" href="https://youtube.com/${
          channel.snippet.customUrl
        }">Visit Channel</a>
      `;
      showChannelData(output);

      const playlistId = channel.contentDetails.relatedPlaylists.uploads;
      requestVideoPlaylist(playlistId);
    })
    .catch(err => alert('No Channel By That Name'));
}

// Add commas to number
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function requestVideoPlaylist(playlistId) {
  const requestOptions = {
    playlistId: playlistId,
    part: 'snippet',
    maxResults: 10
  };

  const request = gapi.client.youtube.playlistItems.list(requestOptions);

  request.execute(response => {
    console.log(response);
    const playListItems = response.result.items;
    if (playListItems) {
      let output = '<br><h4 class="center-align">Latest Videos</h4>';

      // Loop through videos and append output
      playListItems.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;

        output += `
          <div class="col s3">
          <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;
      });

      // Output videos
      videoContainer.innerHTML = output;
    } else {
      videoContainer.innerHTML = 'No Uploaded Videos';
    }
  });
}*/

// Options
var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src', 'https://unpkg.com/axios/dist/axios.min.js');
document.head.appendChild(jQueryScript);
const CLIENT_ID = '1062555331684-9tmtl6mkdrtfpv683revvvaa199geh48.apps.googleusercontent.com';
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.getElementById('content');
const channelForm = document.getElementById('channel-form');
const channelInput = document.getElementById('channel-input');
const videoContainer = document.getElementById('video-container');

const defaultChannel = 'zeeshanali242';

// Form submit and change channel
/*channelForm.addEventListener('submit', e => {
  e.preventDefault();

  const channel = channelInput.value;

  getChannel(channel);
});*/

// Load auth2 library
const constraints = {
    "video": {
        width: {
            max: 320
        }
    },
    "audio": true
};

var theStream;
var theRecorder;
var recordedChunks = [];

function startFunction() {
    navigator.mediaDevices.getUserMedia(constraints)
        .then(gotMedia)
        .catch(function(e) {
            console.error('getUserMedia() failed: ' + e);
        });
}

 function gotMedia(stream) {
    theStream = stream;
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(stream);
    try {
        recorder = new MediaRecorder(stream, {
            mimeType: "video/webm"
        });
    } catch (e) {
        console.error('Exception while creating MediaRecorder: ' + e);
        return;
    }
    theRecorder = recorder;
    const ws = new WebSocket(
        window.location.protocol.replace('http', 'ws') + '//' + // http: => ws:, https: -> wss:
        window.location.host +
        '/rtmp/' +
        encodeURIComponent("rtmp://a.rtmp.youtube.com/live2/test.x9vt-tj8t-3782-c0uf")
    );

    ws.addEventListener('open', (e) => {
        console.log('WebSocket Open', e);

        recorder.addEventListener('dataavailable', (e) => {
            ws.send(e.data);
        });

        recorder.addEventListener('stop', ws.close.bind(ws));

        recorder.start(200); // Start recording, and dump data every second

        var liveStreamId = [];

        for(;;){
          if(liveStreamId && liveStreamId.length) break;
          getLiveStreamId(function(resp){
            if(resp && resp.length){
                liveStreamId = resp;
            }
          });
        }
        console.log("liveStreamId is ",liveStreamId);
    });

    ws.addEventListener('close', (e) => {
        console.log('WebSocket Close', e);
        recorder.stop();
    });

    

    
    
}


 function getLiveStreamId(callback){
  const AuthStr = 'Bearer '.concat(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);

  axios.get("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id&broadcastStatus=active&broadcastType=all", {
                headers: {
                    Authorization: AuthStr
                }
            }).then( function(response) {
                callback(response.data.items);
            })
            .catch((error) => {
                console.log('error 3 ' + error);
            });
    
}

// From @samdutton's "Record Audio and Video with MediaRecorder"
// https://developers.google.com/web/updates/2016/01/mediarecorder
function download() {
    theRecorder.stop();
    theStream.getTracks().forEach(track => {
        track.stop();
    });

    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 100);
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

// Init API client library and set up sign in listeners
function initClient() {
    gapi.client
        .init({
            discoveryDocs: DISCOVERY_DOCS,
            clientId: CLIENT_ID,
            scope: SCOPES
        })
        .then(() => {
            // Listen for sign in state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle initial sign in state
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        });
}

// Update UI sign in state changes
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        content.style.display = 'block';
        videoContainer.style.display = 'block';
        const AuthStr = 'Bearer '.concat(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);
        getChannel(AuthStr);
        
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        content.style.display = 'none';
        videoContainer.style.display = 'none';
    }
}

// Handle login
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

// Handle logout
function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

// Display channel data
function showChannelData(data) {
    const channelData = document.getElementById('channel-data');
    channelData.innerHTML = data;
}

// Get channel from API
function getChannel(channel) {

    axios.get("https://www.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&maxResults=50&mine=true", {
            headers: {
                Authorization: channel
            }
        }).then(response => {
            console.log(response.data);
            const playlistId = response.data.items[0];
            const output = `
        <ul class="collection">
          <li class="collection-item">Title: ${playlistId.snippet.title}</li>
          <li class="collection-item">ID: ${playlistId.id}</li>
          <li class="collection-item">Subscribers: ${numberWithCommas(
            playlistId.statistics.subscriberCount
          )}</li>
          <li class="collection-item">Views: ${numberWithCommas(
            playlistId.statistics.viewCount
          )}</li>
          <li class="collection-item">Videos: ${numberWithCommas(
            playlistId.statistics.videoCount
          )}</li>
        </ul>
        <p>${playlistId.snippet.description}</p>
        <hr>
        <a class="btn grey darken-2" target="_blank" href="https://youtube.com/${
          playlistId.snippet.customUrl
        }">Visit Channel</a>
      `;
            showChannelData(output);

            const playlistIds = playlistId.contentDetails.relatedPlaylists.uploads;
            requestVideoPlaylist(playlistIds);
        })
        .catch(function(err) {
            alert('No Channel By That Name', err)
        });
}
/*axios.get("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId="+playlistId, { headers: { Authorization: channel } }).then(res => {*/
// Add commas to number
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function requestVideoPlaylist(playlistId) {
    const requestOptions = {
        playlistId: playlistId,
        part: 'snippet',
        maxResults: 10
    };

    const request = gapi.client.youtube.playlistItems.list(requestOptions);

    request.execute(response => {
        console.log(response);
        const playListItems = response.result.items;
        if (playListItems) {
            let output = '<br><h4 class="center-align">Latest Videos</h4>';

            // Loop through videos and append output
            playListItems.forEach(item => {
                const videoId = item.snippet.resourceId.videoId;

                output += `
          <div class="col s3">
          <iframe width="100%" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;
            });

            // Output videos
            videoContainer.innerHTML = output;
        } else {
            videoContainer.innerHTML = 'No Uploaded Videos';
        }
    });
}