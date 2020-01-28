# WebRTC
Tutorial Series for WebRTC

## Table of Contents
1. Introduction 
2. Advantages 
3. Issues with different browsers 
4. MediaStream 
5. RTCPeerConnection
6. RTCDataChannel
7. Signaling
8. Multi-Party WebRTC
9. WebRTC and Firebase
10. Security
11. Sources 


## 1. Introduction
Real Time Communication (RTC) is a major challenge for web developers that want to allow people to
communicate via audio and video on the internet. Historically this has been a complex and time consuming task.  

To make life easier, this post should give you a introduction to WebRTC, a collection of communication protocols
and [application programming interfaces](https://en.wikipedia.org/wiki/Application_programming_interface), that enable real-time communication over peer-to-peer connections.  

We are going to have a look on
* Advantages
* Issues with different browsers
* MediaStream
* RTCPeerConnection
* RTCDataChannel
* Signaling
* Multi-Party WebRTC
* WebRTC and FIrebase
* Security
* Conclusion
* Sources


## 2. Advantages
So why should you use WebRTC?
* Real-Time Audio and Video chat, instant messaging, file transfers and even screen-capturing are possible
* Plugin-free: This is the feature where WebRTC really scores: Many other web services offer RTC as well (e.g.
Skype, Facebook, Google Hangouts), but have the big disadvantage of using a plugin that has to be
downloaded and installed by the user. This can be complex, error prone and just annoying because plugins
have to be updated to stay supported. On the developers side it can be troublesome to deploy, debug, test
and maintain them. Furthermore there might be issues with licensing and integrating them into other
technologies.  
All in all it's quite annoying especially for users/customers that aren't experienced in IT topics  

*"The guiding principles of the WebRTC project are that its APIs should be open source, free, standardized, built into
web browsers and more efficient than existing technologies."*


## 3. Issues with different browsers
WebRTC supports most of the common used browsers but still has a few issues on a few of them.
The website <http://iswebrtcreadyyet.com/legacy.html> should give an overview which and to what point each
browser is supported, but seems to be a bit outdated most of the time:

![alt text](readme_images/webRtcSupport.jpg?raw=true "WebRTC Browser Support")
E.g. also Safari can be used to some extend as well at the moment.

Furthermore WebRTC offers possibilities to be used on your Android and iOS mobile devices too. So in theory there
shouldn't be too many problems that a user couldn't access the service by having a wrong browser installed.
Especially the popular Chrome, Firefox and Opera browsers are supported best. Additionally the developers are still
working on WebRTC for a better and a more complete support.

There are still a few things you have to look out for as a developer, because the three different APIs of WebRTC are
apparently still implemented under a bit different names in the various browsers. For example getUserMedia is
currently implemented by Chrome and Opera as webkitGetUserMedia and by Firefox as mozGetUserMedia. The
same applies for the other APIs as well. Those prefixes are going to be removed, as soon as the standards process
has stabilized. You can find more information in this [table](https://webrtc.org/web-apis/interop/):

![alt text](readme_images/webRTCApiDifferences.jpg?raw=true "webRTCApiDifferences")

To help out, Google and the [WebRTC community](https://github.com/webrtc/adapter/graphs/contributors) developed and maintain a JavaScript shim called [adapter.js](https://github.com/webrtc/adapter),
that abstracts away those browser differences and spec changes. Have a look on it's GitHub repository to find
techniques for making sure your app always accesses the most recent version.

I have to note though, that I could get to run all the following examples on different browsers without using
adapter.js and can't say for sure yet, if it is still needed at all.


## 4. MediaStream
To capture audio or video from a computer, for many years you had to rely on third-party browser plugins such as
Flash or Silverlight. HTML 5 allows now direct hardware access to numerous devices and provides JavaScript APIs
which interface with a system's underlying hardware capabilities. One example for those APIs is *getUserMedia*:

This means the first thing you want to do for a basic Video and Audio Chat, is getting access on the streams taken of
your computers camera and microphone. The [MediaStream API](http://dev.w3.org/2011/webrtc/editor/getusermedia.html) represents those synchronized streams of media.

For this example I'm going to use the [mediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) and the [Chrome Web Server plugin](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) to test the
code:

Let's first create a basic html website with a video element that can be accessed over *WebRTC*:

#### **`index.html`**
``` html
<!DOCTYPE html>
<html>
<head>
  <title>MediaStream Example</title>
  <link rel="stylesheet" href="css/main.css" />
</head>
<body>
  <h1>MediaStream Example</h1>
  <video autoplay></video>
  <script src="js/main.js"></script>
</body>
</html>
```

This is probably one of the easiest ways to get an video and audio stream over a javascript file:

#### **`main.js`**
``` js
var constraints = {
  audio: false,
  video: true
};

var video = document.querySelector('video');

function handleSuccess(stream) {
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
```

The code should be self explaining: *MediaDevices.getUserMedia* opens a prompt on the users browser, that asks for
permission to access its camera and microphone. In the constraints parameters we are able to turn them off
directly (accessing ans streaming your owns microphone data would just return some weird noise at that point). On
success the stream is passed to the video element on our website, otherwise an error is returned.


## 5. RTCPeerConnection
*RTCPeerConnection* is an API that represents the actual *WebRTC* connection which allows calls to stream video and audio and exchange data between two peers.

The codecs and protocols used by WebRTC do a huge amount of work to make real-time communication possible, even over unreliable networks, for example:
* packet loss concealment
* echo cancellation
* bandwidth adaptivity
* dynamic jitter buffering
* automatic gain control
* noise reduction and suppression
* image 'cleaning'

In this step we want to try to broadcast the recorded *MediaStream* from above from one video element to an other one. This is a quite unrealistic example but makes it way easier to understand the setup, because we can leave out a signaling service for now.

#### **`index.html`**
``` html
<!DOCTYPE html>
<html>
<head>
  <title>RTCPeerConnection Example</title>
  <link rel="stylesheet" href="css/main.css" />
</head>

<body>
  <h1>RTCPeerConnection Example</h1>

  <video id="localVideo" autoplay></video>
  <video id="remoteVideo" autoplay></video>

  <div>
    <button id="startButton">Start</button>
    <button id="callButton">Call</button>
    <button id="hangupButton">Hang Up</button>
  </div>

  <script src="js/main.js"></script>
</body>
</html>
```

The video element "localVideo" will display the recorded streams from *mediaDevices.getUserMedia* and
"remoteVideo" will show the __same__ video streamed via *RTCPeerConnection*.


We set up *RTCPeerConnection* interfaces for both video elements. Both parties (the caller and the called party) need to set up their own *RTCPeerConnection* instances to represent their end of the peer-to-peer connection:

Those interfaces provide useful methods to maintain the connections. Additionally the in the first example recorded stream is added to the local peer.

#### **`main.js`**
``` js
localPeer = new RTCPeerConnection;

localPeer.addStream(localStream);

remotePeer = new RTCPeerConnection;
```

At first the WebRTC peers need to find out and exchange local and remote video and audio media information. For that we use the [SDP](http://en.wikipedia.org/wiki/Session_Description_Protocol) (Session Description Protocol) to exchange metadata in form of an *offer* and an *answer*:

It is a descriptive protocol that is used as a standard method of announcing and managing session invitations, as well as performing other initiation tasks for multimedia sessions. SDP represents the browser capabilities and preferences as a message in text-format and synchronizes how the streamed media is going to look like, as well as how this traffic is encrypted. To be more precise, it can include different information as:
* Media capabilities (video, audio) and the employed codecs
* IP address and port number
* P2P data transmission protocol (WebRTC uses SecureRTP)
* Bandwidth usable for communication
* Session attributes (name, identifier, time active, etc.) -> However these are not used in WebRTC
* Other related metadata...

The call initiating user starts of with an *offer* that gets send to the callee via a signaling service (in this example we work on a single web page, so we can leave the signaling part out for now). This callee responds to this *offer*, with an *answer* message, also containing an SDP description. The connection and media configuration states get set on
both sides *RTCSessionDescriptions*:

#### **`main.js`**
``` js
localPeer.createOffer().then(function(offer) {
  localPeer.setLocalDescription(offer);
  remotePeer.setRemoteDescription(offer);

  remotePeer.createAnswer().then(function(answer) {
    remotePeer.setLocalDescription(answer);
    localPeer.setRemoteDescription(answer);
  })
});
```

The *SDP* descriptions are used as part of the full *ICE* workflow for *NAT* traversal that allows clients to connect with each other over the internet. This is not needed locally (but still has to be implemented), so we will have a closer look on that later.

For now the *EventHandler RTCPeerConnection.onicecandidate* is called as soon as the ICE agent needs to deliver a message to the other peer through a signaling server. It leaves us the choice of whatever messaging technology we use to send the ICE candidates to the remote peer (as explained before, this time we don't use one at all, but just work "locally" on one web page).

After the *RTCPeerConnection* received a new ICE candidate from the other peer, the new candidate can be added to the *RTCPeerConnections* remote description as *RTCIceCandidate*, which describes the state of the remote end of
the connection:

#### **`main.js`**
``` js
localPeer.onicecandidate = function(e) {
  findIceCandidate(localPeer, e);
};

remotePeer.onicecandidate = function(e) {
  findIceCandidate(remotePeer, e);
};

function findIceCandidate(peer, event) {
  if (event.candidate) {
    getOtherPeer(peer).addIceCandidate(
      new RTCIceCandidate(event.candidate)
    )
  }
}
```

The *RTCPeerConnection.ontrack* EventHandler gets called when the *remotePeer* receives a *track*, which are components of a *stream object*: The stream gets displayed in the *remoteVideo* element.

#### **`main.js`**
``` js
remotePeer.ontrack = gotRemoteStream;

function gotRemoteStream(e) {
  remoteVideo.srcObject = e.streams[0];
  console.log('gotStream');
}
```

With the connection now established, *RTCPeerConnection* enables the sending of real-time audio and video data as a bitstream between browsers.

All together the *RTCPeerConnection* API is responsible for managing the full life-cycle of each peer-to-peer connection and encapsulates the whole connection setup and management within a single interface.


## 6. RTCDataChannel
WebRTC offers even more than just Video and Audio Streaming, but also data channels, over which any kind of data may be transmitted. This can be useful for back-channel content such as images, file transfer, text chat, game update packets, and so forth. Let's have a look on a simple example how to send a text between two peers. To achieve that, we set up a web page with two text areas to simulate a text chat from one peer to an other:

#### **`index.html`**
``` html
<!DOCTYPE html>
<html>
<head>
  <title>RTCDataChannel Example</title>
  <link rel="stylesheet" href="css/main.css" />
</head>

<body>
  <h1>RTCDataChannel Example</h1>

  <textarea id="dataChannelSend" disabled
    placeholder="Press Start, enter some text, then press Send."></textarea>
  <textarea id="dataChannelReceive" disabled></textarea>

  <div id="buttons">
    <button id="startButton">Start</button>
    <button id="sendButton">Send</button>
    <button id="closeButton">Stop</button>
  </div>

  <script src="js/main.js"></script>

</body>
</html>
```

Now we follow the same path as before: At first we set up two *RTCPeerConnections* and instead of adding a stream, we attach a *DataChannel* to the local peer, which allows us to transmit a text message from it. Additionally a *RTCPeerConnection.ondatachannel EventHandler* gets added to the remote peer. It activates, as soon as the connected peer (in this case *localPeer*) creates a data channel:

#### **`main.js`**
``` js
localPeer = new RTCPeerConnection;

sendChannel = localPeer.createDataChannel('sendDataChannel');

remotePeer = new RTCPeerConnection;

remotePeer.ondatachannel = receiveChannelCallback;
```

After that we set up a proper connection via SDP and ICE as done in the example before:

#### **`main.js`**
``` js
localPeer.createOffer().then(function(offer) {
  localPeer.setLocalDescription(offer);
  remotePeer.setRemoteDescription(offer);

  remotePeer.createAnswer().then(function(answer) {
    remotePeer.setLocalDescription(answer);
    localPeer.setRemoteDescription(answer);
  })
});

localPeer.onicecandidate = function(e) {
  findIceCandidate(localPeer, e);
};

remotePeer.onicecandidate = function(e) {
  findIceCandidate(remotePeer, e);
};
```

Subsequently we are able to click a button to get the value of one text box and send it to the other one. The *send()* method of the *RTCDataChannel* interface sends data across the data channel to the remote peer. This can be done any time except during the initial process of creating the underlying transport channel. Data sent before connecting is buffered if possible (or an error occurs if it's not possible), and is also buffered if sent while the connection is
closing or closed.

#### **`main.js`**
``` js
function sendData() {
  var data = dataChannelSend.value;
  sendChannel.send(data);
}
```

On the other side the receiving channel of *remotePeer* will activate on getting a message over the *RTCPeerConnection* and write its value out into the second text area. The text message got delivered.

#### **`main.js`**
``` js
function receiveChannelCallback(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
}

function onReceiveMessageCallback(event) {
  dataChannelReceive.value = event.data;
}
```

## 7. Signaling
To create a real world *WebRTC* example for real time communication, we need to take care of the messaging technology in the background as well. A signaling service gives the users the possibility to actually exchange information over two devices online. That mechanism is not implemented by *WebRTCs* APIs: You need to build it yourself.

The theory:

Even though *WebRTCs RTCPeerConnection* attempts to stream the actual media data *peer to peer* once a session is established, you'll always need an intermediary server to exchange signaling messages and application data between clients to set up this connection. Unfortunately a web app can't simply shout into the internet 'Connect me to my friend!' Thankfully signaling messages are small and mostly exchanged at the start of a call.

So at first *SDP* messages are exchanged between the peers via a Signaling Server of your choice, that receives and sends messages to all the peers who want to connect to one another. Only after that, the media data can be streamed directly *peer to peer*:

![alt text](readme_images/webRTCtopology.jpg?raw=true "WebRTC Topology")

In reality, devices on the internet are most often hidden behind one or more layers of Network Address Translators ([NAT](https://developer.mozilla.org/en-US/docs/Glossary/NAT)). NAT works by dynamically translating private addresses into public ones, when an outbound request passes through them. Similarly, inbound requests to a public IP address are converted back into a private IP to ensure correct routing on the internal network. Consequently, sharing a private IP is often not enough information to establish a connection between two clients.

Furthermore, there might be Firewalls or other Anti-Virus software that block certain ports and protocols. Those are reasons that make it difficult to negotiate, how two peers should communicate directly peer to peer. Because of that, the [ICE](http://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment) (*Interactive Connectivity Establishment*) framework is used by *WebRTC* to overcome the difficulties
posed by communicating via NAT and find the correct network interfaces and ports to establish a connection. ICE first tries to make a connection using the host address obtained from a device's operating system and network card; if that fails (which it inevitably will for devices behind NATs), ICE then tries to figure out a way around those NATs by obtaining an external address. To do this, each client communicates with special [Session Traversal Utilities for NAT (STUN)](https://en.wikipedia.org/wiki/STUN) servers via the ICE protocol. Those STUN servers are available online and have the one task to check the IP:port address of an incoming request (from an application running behind a NAT) and send that address back as a response. By that the peer discovers its own IP:port from a __public perspective__. Now it can pass that public address on to another peer via the chosen signaling mechanism, in order to set up a direct link. Most
often this way will work out.

![alt text](readme_images/stun.jpg?raw=true "Stun")

If it fails, the ICE protocol will dictate you to a chosen [Traversal Using Relays around NAT (TURN)](https://en.wikipedia.org/wiki/Traversal_Using_Relays_around_NAT) server, which
relays the whole audio/video/data communication over that server. Obviously those need to handle a lot of data. By relaying traffic between peers the *WebRTC* communication can be ensured, but can suffer degradations in
media quality and latency.

![alt text](readme_images/turn.jpg?raw=true "Turn")

Each client will produce multiple ICE candidates to be used to stream media to another client. Each of those
candidates is a potential address/port to receive media, whereby we differentiate between three types of candidates:

* __Host Candidates__ are generated by the client by binding to its locally assigned IP addresses and port. If you
have multiple IP addresses, you can generate multiple host candidates.
* __Server Reflex Candidates__ are generated by sending STUN messages to a STUN/TURN server. A client sends
a query message to the STUN server. That query passes through the NAT which creates a binding. The
response to the query contains the public IP and port that was generated for the binding. This can now be
used as a server reflex candidate.
* __Relay Candidates__ are generated in the same way as a server reflex candidate. A query message is sent to
the TURN server which creates a NAT binding. That binding is used, but the binding will be sent to and from
the relay server.

Those ICE candidates will be properly formatted and encoded in the *offer* and *answer SDP* messages or be sent standalone (*trickle ICE*). The remote client will answer with his own ICE candidates.

Each ICE message suggests a communication protocol (TCP or UDP), IP address, port number, connection type (for
example, whether the specified IP is the peer itself or a relay server), along with other information needed to link
the two computers together. This includes NAT or other networking complexity.

As these exchanges take place, each client has an ICE agent handling connection management. After that a verification process begins:

1. Each agent matches up its candidates (local) with its peers (remote) creating candidate pairs.
2. The agent then sends connectivity checks every 20 ms, in pair priority, over the binding requests from the
local candidate to the remote candidate.
3. Upon receipt of the request, the peer agent generates a response.
4. If the response is received, the check has succeeded

As soon as the verification process is finished, the controlling agent (typically the one of the offering client) decides which candidate pair to use to establish the best connection, whereby we can differentiate between the following
connection types:

* __Host:__ These clients are on the same LAN and maybe under the same NAT. They can send media direct from
host to host.
* __Server Reflex:__ STUN has successfully figured out how to create a connection (like punching a hole) through
the NATs, and media is flowing between the two clients.
* __Relay:__ TURN has successfully allowed media to be sent to an intermediate server between the two NATs.
This allows NATs not have to attempt to send traffic between each other if it is not permitted.
* __Peer Reflex:__ During connectivity checks we found a better way to send media directly, between clients. One or both clients could be behind symmetric NATs where port preservation is not allowed. In this case, a STUN
message allowed a new binding to be created directly between the clients, and in spite of the symmetric NAT. Now, media can flow directly between them.

To have a closer look into that workflow, we are going to improve the *RTCPeerConnection* from before with a working Signaling Service to communicate not just over one web page, but over the network.

So a short recapitulation on the tasks of *RTCPeerConnection*:

* Ascertain local media conditions, such as resolution and codec capabilities. This is the metadata used in the *offer* and *answer* mechanism
* Get potential network addresses for the application's host, known as *candidates*

Once this local data has been ascertained, we will exchange it via a signaling mechanism with the remote peer.

A common technique for *WebRTC* appears to be to build a signaling service on [Node](http://nodejs.org/) (so make sure to install
Node.JS) and its WebSocket library [Socket.io](http://socket.io). Socket.io makes it easy to exchange messages and supports a
quite suited concept of rooms, which makes sense for multi-user chats. In the following example it will be possible
for multiple users to join a virtual room but only for two to actually communicate over an audio/video chat.
Let's follow the *RTCPeerConnection* example from before by setting up a web page again with just two video
elements. This time we will be needing two scripts for the communication, one for the server and one for the
clients. Sockets have traditionally been the solution around which most realtime chat systems are architected,
providing a bi-directional communication channel between a client and a server. This means that the server can
push messages to clients. The idea is that the server will get a message from one client and *push* it to all other
connected clients.

One task of the server in the current simple case is to bring together the different clients in a virtual room, so that
they are able to communicate with each other. The first client to connect will have to create a room and the others
will join it. Depending on that, the server returns a different message so the clients can react appropriately:

#### **`server.js`**
``` js
socket.on('create or join', function(room) {

  var numClients = io.sockets.sockets.length;

  if (numClients === 1) {
    socket.join(room);
    socket.emit('created', room, socket.id);

  } else {
    io.sockets.in(room).emit('join', room);
    socket.join(room);
    socket.emit('joined', room, socket.id);
  }
});
```

Furthermore it redirects messages from one client to all the other ones:

#### **`server.js`**
``` js
socket.on('message', function(message) {
  socket.broadcast.emit('message', message);
});
```

On the client side happens way more stuff. When joining the hosted website a *websocket* connection to the server is established. The connected client receives the servers messages and sets parameters depending on being the first user that has to create a virtual room or just has to join one. Additionally it is able to push messages to the server that are then emitted to all the other connected clients:

#### **`main.js`**
``` js
var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  roomExists = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  roomExists = true;
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}
```

For a client to access his media data, we make use of *WebRTCs MediaStream* API again. On success, the video
stream will be set to its own local video element on the web page and if the client is not the initiating one on the
server, a message will be send to the already waiting client, so that a connection can be established.

#### **`main.js`**
``` js
navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(handleSuccess)
.catch(handleError)

function handleSuccess(stream) {
  console.log('Adding local stream.');
  localVideo.srcObject = stream;
  localStream = stream;
  if (!isInitiator) {
    sendMessage('got user media');
  }
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error);
}
```

Both clients should now have accessed their local stream. The joining client sends a message to the initiating client and as a reaction it will try to get ready for a connection. It sets up a new *RTCPeerConnection* interface, which takes
a list of *STUN* servers. As explained above *STUN* servers talk over the *ICE* protocol and return the clients public ip
address. Google allows access to the in this tutorial used free *STUN* server which is incredibly useful during
development, but it’s probably a good idea to roll an own in a high volume production app. On a local network we obviously don't even need one.

After that we add an *icecandidate EventHandler* and a *track EventHandler* to the client. Furthermore the local stream will be added to the interface and an *offer* will be emitted. That means the client will configure its local end of the connection and sends this *Session Description* to the other client:

#### **`main.js`**
``` js
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

function setUpConnection() {
  if (!isStarted && typeof localStream !== 'undefined' && roomExists) {
    console.log('creating peer connection');
    createPeerConnection();
    peer.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      offer();
    }
  }
}

function createPeerConnection() {
  try {
    peer = new RTCPeerConnection(pcConfig);
    peer.onicecandidate = findIceCandidate;
    peer.ontrack = gotRemoteStream;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    return;
  }
}

function offer() {
  console.log('Sending offer to peer');
  peer.createOffer().then(function(offer) {
    setLocalAndSendMessage(offer);
  })
}

function setLocalAndSendMessage(sessionDescription) {
  peer.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}
```

As soon as *setLocalDescription* is called, the *ICE* negotiation starts. The client asks the servers to generate some *ICE* candidates which he will return to it. The *onicecandidate* callback we defined earlier is called and sends those
candidates encapsulated in messages over our Signaling Service to the other client, which will add them as *RTCIceCandidates* to its *RemoteDescription*.

At this point, the initiating client is done setting up, has its webcam turned on and is waiting for the other client to send its *SDP* and *ICE* candidate messages so that they both can communicate.

#### **`main.js`**
``` js
function findIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  } 
}
```

On the other side on receiving an *offer* the client will set up everything to be ready for a connection as well, including the *ICE* negotiation and set its *Session Description* as its remote end of the connection. Additionally it emits an *answer* with its *Session Description*.

#### **`main.js`**
``` js
function answer() {
  console.log('Sending answer to peer.');
  peer.createAnswer().then(function(answer) {
    setLocalAndSendMessage(answer);
  })
}
```

Both clients have now both clients *Session Descriptions* configured and should be able to communicate directly, if the *ICE* negotiations are finished.

As soon as the clients receive the opposites streams the track *Event Handler* will be called, set those received streams as remote streams and show them in their fitting video elements.

#### **`main.js`**
``` js
function gotRemoteStream(e) {
  console.log('Remote stream added.');
  remoteVideo.srcObject = e.streams[0];
  remoteStream = e.streams[0];
}
```

Note that testing on the Chrome browser will return an *"Only secure origins are allowed"* error if you are not *localhost*. The reason is Chrome currently allows service workers only "secure origins", basically HTTPS. As a workaround you have to use the *--unsafely-treat-insecure-origin-as-secure command-line flag combined with a --
user-data-dir flag*. For example:

*--user-data-dir=/tmp/foo --unsafely-treat-insecure-origin-as-secure=http://your-own.page*


_An other note:_

After an update I'm getting errors while testing my code, because my machine won't allow me to access my camera
more than once. So I can't simulate a video chat between two tabs/browsers. Probably the easiest workaround is to
create a fake camera/microphone device in your browsers settings. For example in Firefox:
1. Just go to about:config in your URL bar
2. Accept the warning message
3. Add a new Boolean value. You do this by right clicking and choosing New->Boolean.
4. Then enter media.navigator.streams.fake
5. Choose true as the value.

When accessing your camera you should now get a fake video and audio sound.


## 8. Multi-Party WebRTC
There are in general three different ways to set up a WebRTC Multi-Party Chat

1. [Mesh](https://webrtcglossary.com/mesh/) – where each participant sends his media to all other participants

![alt text](readme_images/mesh.jpg?raw=true "Mesh")

The Mesh Topology is the easiest way to upgrade the previous one-to-one video chat to support more users. The advantage is that we don't need any central entity in between. Big scaling is a problem though, because each client
has to set up a peer to peer connection directly to every other client, resulting in each client managing (n-1) bidirectional connections, where n is the total number of clients. The total number of edges/connections is
exponential, equal to n(n-1)/2, which starts out small, but adds up very fast.

Since most Internet connections are asymmetric (download bandwidth > upload bandwidth), upload bandwidth can become a limiting factor, especially if we’re using data-heavy video. Having to encrypt each media stream once for every connection doesn’t help, especially on mobile.

That said, the mesh structure requires no server infrastructure beyond the requisite signalling and TURN server(s),
so for applications where sessions typically involve 2-3 clients, this mesh topology can be an excellent, low-cost
approach.

There are a few changes that have to be made to the tutorial above: As before the first client opens up a "main room" in which every new user will also join into. The methods are changed in a way so that messages can be directly targeted to other users by their individual IDs. As soon as a new client joins the "main room", he and the first user will exchange their IDs and set up a *WebRTC* connection as explained in the previous tutorial. The more complicated part is to manage connecting all the other clients with each other:

As soon as the initial user has set up its connection with the new client, it shares the new clients ID with all other previous connected users over the "main room". Consequently everybody can now send an offer to the new client which includes their own ID so it can answer appropriately to each of them. The difficulty here is to get to work *ICE*
correctly, which runs automtically in the background. It needs time to finish its negotiations with the current user.

To solve that problem every client in the chat waits five seconds longer than the previous client to sends his *offer* so there is enough time to set up the *peer to peer connection*.

2. [MCU](http://webrtcglossary.com/mcu) – where a participant is “speaking” to a central entity who mixes all inputs and sends out a single stream towards each participant

![alt text](readme_images/mcu.jpg?raw=true "MCU")

3. [SFU](http://webrtcglossary.com/sfu) – where a participant sends his media to a central entity, who routes all incoming media as he sees fit to participants – each one of them receiving usually more than a single stream

![alt text](readme_images/sfu.jpg?raw=true "SFU")

## 9. WebRTC and Firebase
Let's have a look on an other way to organize the initial *Signaling* by using *Firebase*. *Firebase* is a mobile and web
application development platform owned by Google and probides various useful services such as for *Analytics* for apps, *Cloud Messaging* or *Authentication* methods. An other service is the *Firebase Realtime Database* which offers
developers an API that allows application data to be synchronized across clients and stored on *Firebase's cloud*. We can use it perfectly for exchanging as *Signaling Service* to exchange our *Signaling Messages* between clients. We will start off with the easier one to one chat example:

First off you have to create a free account on the *Firebase* website <https://firebase.google.com/> and then set up a
new project. Then click on "Add Firebase to your web app" and you will get config data that you have to add to your code (or exchange the config in the example) to be able to access your *Database*. Now click on *Database* and open the *Rules* tab: For this tutorial exchange them to

#### **`main.js`**
``` js
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

so we can access it without authentification.

After setting up the databases configuration in code we can access it with

#### **`main.js`**
``` js
  database.on('child_added', readMessage)
```

In addition to the previous tutorials with Node.js you will find an additional "Call button" on the user interface
backed up by a bit of *css* to make everything look a bit nicer. Instead of the Socket.io server which organized the
correct distribution of the different messages we will just write those to our *Firebase Database* and every client will
receive them as soon as changes are happening. Every client includes the sender as well, so we will always add its
randomly created Id to the message to be able to decide how each user should react on the different messages.

#### **`main.js`**
``` js
//create a random Id for each user
var yourId = Math.floor(Math.random()*1000000000);

function sendMessage(senderId, data) {
  var msg = database.push({
    sender: senderId,
    message: data
  });
  msg.remove();
}
```

Note that the message will be removed from the Database after the other clients read it. If you delete this line of
code, you will be able to see the messages in the data tab in your project on the *Firebase* website.

The other client reads the message from the database as soon as it was posted an compares the IDs to make sure
it's not his own. After that it answers to them appropriately as done in the other tutorials. Note that the clients will
capture their local video as soon as starting the application and will initiate the *Signaling* by clicking the "Call"
button.

For __Multi-Party WebRTC with Firebase__ set up a new Firebase project and import your configurations to a new
javascript project as done before. In a video chat with multiple users we have to organize the communication
between all different clients again: A new joining client will send his unique ID to all other users. Instead of giving
the users predefined time slots to exchange their *Signaling Information*, let's try a more efficient approach: The new
joining user should build up connections to all other clients one after an other, as soon as the *Signaling* with a client
is finished. To achieve that, every other client will send his user ID to the joining client in form of a directed private
message. Those private messages contain the ID of the user for which they are designated for, the senders ID and the message:

#### **`main.js`**
``` js
function sendPrivateMessage(toId, senderId, data) {
  console.log("Sending message to: " + toId)
  var msg = database.push({
    toId: toId,
    sender: senderId,
    message: data
  });
  msg.remove();
}
```

As soon as a new message is posted to the Firebase database, a client compares his own ID to the ID for which the message was meant for. Through that a user will only read the messages adressed to him.

The joining client will save all those IDs in his *contact list* and send an *offer* to his first contact to start to exchange
signaling messages and application data between those clients to set up a connection. As soon as this connection is
established, we want to go on with the next contact in the list. To determine a completed connection we can use a
new callback function *peer.oniceconnectionstatechange* to detect changes in the state of the *ICE* negotiations.
When the *ICE* connection state switches to "connected", the connection got completly set up and the user will go
on negotiating with the next client in the contact list:

#### **`main.js`**
``` js
function connectToOtherClients(event){
  if(peer.iceConnectionState == "connected"){
    if(contactList[0] != null){
      console.log("start connecting to next client..");
      createPeerConnection();
      currentPrivateContact = contactList[0];
      offerTo(contactList[0]);
      contactList.splice(0, 1);
    }
  }
}
```

## 10. Security
The idea of plugin-free audio and video communication embedded in a browser sounds exciting. However, this
naturally raises concerns over the security of this technology, and whether it can be trusted to provide reliable and
safe communication for both the end users and any intermediary carriers or third parties.

There are several security issues that we can think of. For example:

* Malware or viruses might be installed alongside a plugin, an application or updates for them
* Video or audio might be recorded and distributed without the user knowing
* Data or media streams might be intercepted en route between browsers or between browser and server

*WebRTC* has several features to avoid these problems:

* *WebRTC* is not a plugin: its components run in the browser sandbox and not in a separate process,
components do not require separate installation and are updated with your trusted browser
* Camera and microphone access must be granted explicitly and, when the camera or microphone are
running, this is clearly shown by the browsers interface
* *WebRTC* implementations use encryption protocols such as Datagram Transport Layer Security ([DTLS](http://en.wikipedia.org/wiki/Datagram_Transport_Layer_Security)) for
data streams and Secure Real-time Transport Protocol ([SRTP](http://en.wikipedia.org/wiki/Secure_Real-time_Transport_Protocol)) for media streams

As mentioned previously, you are free to use a signalling service of your choice . Although this allows for a degree of
flexibility that can have the WebRTC implementation tailored to the needs of your application, it is advisable to
implement a signalling protocol that provides additional security as encryption of the signalling traffic prohibit e.g.
to eavesdropping.

TURN servers can't understand or modify the real-time WebRTC data, but only relay them. Consequently they will
not decode the sensitive information peers send to each other and they will stay encrypted.

A full discussion of security for streaming media is out of scope for this article. For more information, see the [WebRTC Security Architecture](http://www.ietf.org/proceedings/82/slides/rtcweb-13.pdf) proposed by the IETF.

## 11. Sources
Here are a few links to different websites I used for research and some tutorials. Please keep in mind that *WebRTC*
is developing really fast and even the official tutorials might not be up to date anymore:

* Introduction into *WebRTCs* basics: <https://www.html5rocks.com/en/tutorials/webrtc/basics/>
* *WebRTC* tutorials for basic applications: <https://codelabs.developers.google.com/codelabs/webrtc-web/#0>
* Close look on *WebRTCs* workflow: <https://www.pkcsecurity.com/untangling-webrtc-flow.html>
* Introduction to Signaling: <https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#how-can-ibuild-a-signaling-service>
* Information on the Signaling Transaction Flow: <https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling>
* More about ICE: <https://temasys.io/webrtc-ice-sorcery/>
* A look on different Signaling Services for your application: <https://bloggeek.me/siganling-protocol-webrtc/>
* Close look on SDP: <https://tools.ietf.org/id/draft-nandakumar-rtcweb-sdp-01.html>
* Contents of a SDP message: <https://webrtchacks.com/sdp-anatomy/>
* *WebRTCs* architecture and a lot of information to the underlying security mechanisms: <http://webrtcsecurity.github.io/>
* Multi-Party *WebRTC*: <https://www.frozenmountain.com/developers/blog/archive/how-to-successfullyscale-your-webrtc-application/>
* *WebRTC* and Firebase: <https://codelabs.developers.google.com/codelabs/firebase-web/#7>
* *WebRTC* and Firebase: <https://websitebeaver.com/insanely-simple-webrtc-video-chat-using-firebase-withcodepen-demo#demo>