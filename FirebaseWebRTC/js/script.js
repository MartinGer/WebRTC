//Create an account on Firebase, and use the given credentials in place of the following config:
var config = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
};
firebase.initializeApp(config);

var peer;
var isStarted = false;
var database = firebase.database().ref();

//create a random Id for each user
var yourId = Math.floor(Math.random()*1000000000);

var peerConfig = {'iceServers': [
    {'urls': 'stun:stun.services.mozilla.com'}, 
    {'urls': 'stun:stun.l.google.com:19302'}, 
]};

function sendMessage(senderId, data) {
    var msg = database.push({ 
        sender: senderId, 
        message: data 
    });
    msg.remove();
}

database.on('child_added', readMessage);

function readMessage(data) {
    var msg = data.val().message;
    var sender = data.val().sender;
    if (sender != yourId) {  
        if (msg.type == "offer"){
            console.log("got offer");
            if (!isStarted) {
                console.log("create peer");
                createPeerConnection();
            }
            peer.setRemoteDescription(new RTCSessionDescription(msg))
            answer();
        }
        else if (msg.type == "answer")
            peer.setRemoteDescription(new RTCSessionDescription(msg));
        else if (msg.type == "candidate"){
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: msg.label,
                candidate: msg.candidate
              });
            peer.addIceCandidate(candidate);
        }
    }
};

////////MediaStream part////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
})
.then(handleSuccess)
.catch(handleError);

function handleSuccess(stream) {
    console.log('Adding local stream.');
    localVideo.srcObject = stream;
    localStream = stream;
  }

function handleError(error) {
    console.log('navigator.mediaDevices.getUserMedia error: ', error);
  }
///////////////////////////////////////////////////////////////////

function call() {
      console.log('creating peer connection');
      createPeerConnection();
      isStarted = true;
      offer();
  }
  
function createPeerConnection() {
    try {
        peer = new RTCPeerConnection(peerConfig);
        peer.onicecandidate = findIceCandidate;
        peer.ontrack = gotRemoteStream;
        peer.addStream(localStream);
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        return;
    }
}

function findIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage(
            yourId, 
            {
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
}

function offer(){
    console.log('Sending offer to peer');
    peer.createOffer().then(function(offer) {
      setLocalAndSendMessage(offer);
    })
}

function answer(){
    console.log('Sending answer to peer.');
    peer.createAnswer().then(function(answer) {
      setLocalAndSendMessage(answer);
    })
  }

function setLocalAndSendMessage(sessionDescription) {
    peer.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(yourId, 
                sessionDescription
                );
  }