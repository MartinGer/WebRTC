'use strict';

var localPeer;
var remotePeer;
var sendChannel;
var receiveChannel;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function createConnection() {
  
  localPeer = new RTCPeerConnection;

  sendChannel = localPeer.createDataChannel('sendDataChannel');

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

  remotePeer.ondatachannel = receiveChannelCallback;

  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  startButton.disabled = true;
  closeButton.disabled = false;
}

function sendData() {
  var data = dataChannelSend.value;
  sendChannel.send(data);
}

function findIceCandidate(peer, event) {
  if (event.candidate) {
    getOtherPeer(peer).addIceCandidate(
      event.candidate
    )
  }
}

function getOtherPeer(peer) {
  return (peer === localPeer) ? remotePeer : localPeer;
}

function receiveChannelCallback(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
}

function onReceiveMessageCallback(event) {
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function closeDataChannels() {
  sendChannel.close();
  receiveChannel.close();
  localPeer.close();
  remotePeer.close();
  localPeer = null;
  remotePeer = null;
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  sendButton.disabled = true;
  startButton.disabled = false;
}

