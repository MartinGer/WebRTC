'use strict';

var roomExists = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var peer;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

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

function writeMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    setUpConnection();
  } else if (message.type === 'offer') {
      if (!isStarted) {
        setUpConnection();
      }
      peer.setRemoteDescription(new RTCSessionDescription(message));
      answer();
  } else if (message.type === 'answer' && isStarted) {
      peer.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      peer.addIceCandidate(candidate);
  } 
});

////////MediaStream part////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

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
    writeMessage('got user media');
  }
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error);
}

///////////////////////////////////////////////////

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
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    return;
  }
}

function findIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    writeMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function gotRemoteStream(e) {
  console.log('Remote stream added.');
  remoteVideo.srcObject = e.streams[0];
  remoteStream = e.streams[0];
}

function offer() {
  console.log('Sending offer to peer');
  peer.createOffer().then(function(offer) {
    setLocalAndSendMessage(offer);
  })
}

function answer() {
  console.log('Sending answer to peer.');
  peer.createAnswer().then(function(answer) {
    setLocalAndSendMessage(answer);
  })
}

function setLocalAndSendMessage(sessionDescription) {
  peer.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  writeMessage(sessionDescription);
}

function hangup() {
  console.log('Hanging up.');
  stop();
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  peer.close();
  peer = null;
}

