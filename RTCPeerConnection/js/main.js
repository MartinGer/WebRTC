'use strict';

var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;

startButton.onclick = startRecording;
callButton.onclick = call;
hangupButton.onclick = hangup;

var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

var localStream;
var localPeer;
var remotePeer;

//MediaStream part
function startRecording() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(handleSuccess)
  .catch(handleError) 
}

function handleSuccess(stream) {
  localVideo.srcObject = stream;
  localStream = stream;
  callButton.disabled = false;
}

function handleError(error) {
  console.log('navigator.mediaDevices.getUserMedia error: ', error);
}

///////////////////////

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  
  localPeer = new RTCPeerConnection;
  
  localPeer.addStream(localStream);
    
  remotePeer = new RTCPeerConnection;

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

  remotePeer.ontrack = gotRemoteStream;
}

function findIceCandidate(peer, event) {
  if (event.candidate) {
    getOtherPeer(peer).addIceCandidate(
      new RTCIceCandidate(event.candidate)
    )
  }
}

function getOtherPeer(peer) {
  return (peer === localPeer) ? remotePeer : localPeer;
}

function gotRemoteStream(e) {
  remoteVideo.srcObject = e.streams[0];
  console.log('gotStream');
}

function hangup() {
  localPeer.close();
  remotePeer.close();
  localPeer = null;
  remotePeer = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}


