'use strict';

var joinedChat = false;
var isInitiator = false;
var localStream;
var peer;
var mySocketId = "";
var currentPrivateContact = "";
var waitingTime = 0;
var waitingTimeLocked = false;
var videoElements = 1;

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

socket.on('created', function(room, socketId) {
  mySocketId = socketId;
  console.log('Created main room ' + room + '. Initiators ID is ' + mySocketId + '.');
  isInitiator = true;
});

socket.on('joined', function(room, numClients, socketId) {
  if (!isInitiator && !joinedChat) {
    mySocketId = socketId;
    exchangeIds(socketId);
  }
  console.log('joined: ' + room);
  console.log('There are ' + numClients + ' clients in the main room. My ID is ' + mySocketId);
  
  //Users wait to to try to connect with joining ones. E.g. 5th user joins => 2 sends direct offer, 3 waits 10 seconds, 4th waits 20 seconds..
  if (numClients > 2 && !waitingTimeLocked){
    waitingTime = (numClients - 2) * 5000;
  }
  waitingTimeLocked = true;

  joinedChat = true;
});

socket.on('newId', function (newId) {
  currentPrivateContact = newId;
  console.log('Saved new ID ' + currentPrivateContact + ' as private contact.');
});

function exchangeIds(newId)
{
  socket.emit('exchange Id', newId);
  console.log('Sent my Id: ' + newId);
}
////////////////////////////////////////////////

function sendPrivateMessage(message) {
  console.log('Client sending new users ID ' + message + ' to all other clients:');
  socket.emit('message', message);
}

function sendPrivatMessage(message, userId) {
  console.log('Client ' + mySocketId + ' is sending private message to user ' + userId + ':' , message);
  socket.emit('private message', message, mySocketId, userId);
}

// This client receives a message
socket.on('message', function(userId) {
  if(userId != mySocketId){
    //wait x seconds for the previous users to set up a connection
    setTimeout(function(){
      currentPrivateContact = userId; //save the other user for ice
      console.log('Client received new users id from user ' + userId + ".  Sending offer after waiting " + waitingTime/1000 + " seconds.");
      setUpConnection();
      offerTo(userId);
  }, waitingTime);
  }
});

// This client receives a private message
socket.on('private message', function(message, fromUserId, toUserId) {
  if (mySocketId == toUserId){
  console.log('Client ' + toUserId + ' received private message from ' + fromUserId + ':', message);

  if (message === 'got user media') {
    setUpConnection();

  } else if (message.type === 'offer') {

        currentPrivateContact = fromUserId; //save the other user for ice
        console.log('Client received new users id from user ' + fromUserId + ". Answering to its offer...");
        setUpConnection();
        peer.setRemoteDescription(new RTCSessionDescription(message));
        answerTo(fromUserId);

  } else if (message.type === 'answer') {
      peer.setRemoteDescription(new RTCSessionDescription(message));
      if (isInitiator){
        sendPrivateMessage(currentPrivateContact);      //send the new users id to all other users
      }
  } else if (message.type === 'candidate') {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      peer.addIceCandidate(candidate);
  }
}
});

////////MediaStream part////////////////////////////////////////////

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
    sendPrivatMessage('got user media', currentPrivateContact);
  }
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error);
}

///////////////////////////////////////////////////

function setUpConnection() {
  if (typeof localStream !== 'undefined' && joinedChat) {
    createPeerConnection();
    peer.addStream(localStream);
    if (isInitiator) {
      offerTo(currentPrivateContact);
    }
  }
}

function createPeerConnection() {
  try {
    console.log('Created a new peer connection');
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
        sendPrivatMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        }, currentPrivateContact);
      } else {
        console.log('End of candidates.');
    }
  }


function gotRemoteStream(e) {
  var newVideoElement = document.createElement("VIDEO");
  newVideoElement.id = ('video'+ videoElements);
  document.querySelector('#videos').appendChild(newVideoElement);

  var videoString = "#video" + videoElements;
  var video =  document.querySelector(videoString);
  video.srcObject = e.streams[0];
  video.play();
  videoElements++;
  console.log("added " + videoElements + " video element");
}

function offerTo(userId){
  peer.createOffer().then(function(offer) {
          console.log("Sending private offer to " + userId);
          setLocalAndSendPrivateMessage(offer, userId);
      })
}

function answerTo(userId) {
  console.log('Sending private answer to peer ' + userId);
  peer.createAnswer().then(function(answer) {
    setLocalAndSendPrivateMessage(answer, userId);
  })
}

function setLocalAndSendPrivateMessage(sessionDescription, userId) {
  peer.setLocalDescription(sessionDescription);
  sendPrivatMessage(sessionDescription, userId);
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
  peer.close();
  peer = null;
}

