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
var localStream;
var database = firebase.database().ref();
var contactList = [];
//create a random Id for each user
var myId = Math.floor(Math.random()*1000000000);

var firstCallStarted = false;

var contactCounter = 1;
var videoElements = 1;
var currentPrivateContact;

var peerConfig = {'iceServers': [
    {'urls': 'stun:stun.services.mozilla.com'}, 
    {'urls': 'stun:stun.l.google.com:19302'}, 
]};

//joining user sends his Id to all other clients
function sendMessage(){
    console.log("Sending my ID: " + myId + " to all other clients. ");
  
    var msg = database.push({ 
        myId: myId,
    });
    msg.remove();
}

//send a private message to a clients Id
function sendPrivateMessage(toId, senderId, data) {
    console.log("Sending message to: " +  toId)
    var msg = database.push({ 
        toId: toId,
        sender: senderId, 
        message: data 
    });
    msg.remove();
}

database.on('child_added', readMessage);

function readMessage(data) {
    if(data.val().sender == undefined){
        if (data.val().myId != myId) {  //make sure that the user doesn't answer to his own message
            contactList = [];
            sendPrivateMessage(data.val().myId, myId, "ContactId")
        }
    }
    else {
        var toId = data.val().toId;

        if (toId == myId) {  //make sure this message is adressed to this user
            var msg = data.val().message;
            var sender = data.val().sender;

            console.log('Client ' + myId + ' received private message from ' + sender + ':', msg);

            if(msg == "ContactId"){
                console.log("Saved contact " + sender + " to my contact list.");
                contactList.push(sender);

                if (!firstCallStarted){
                    createPeerConnection();
                    currentPrivateContact = sender;
                    offerTo(sender);
                    firstCallStarted = true;
                    contactList.splice(0, 1); //delete client, to which offer got sent from list
                }
            }
            else {
                if (msg.type == "offer"){
                    createPeerConnection();
                    currentPrivateContact = sender;
                    peer.setRemoteDescription(new RTCSessionDescription(msg))
                    answerTo(sender);
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
    }
    }
};

////////MediaStream part////////////////////////////////////////////
var localVideo = document.querySelector('#localVideo');

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
    sendMessage();
  }
  
function createPeerConnection() {
    console.log('creating peer connection');
    try {
        peer = new RTCPeerConnection(peerConfig);
        peer.onicecandidate = findIceCandidate;
        peer.ontrack = gotRemoteStream;
        peer.addStream(localStream);
        peer.oniceconnectionstatechange = connectToOtherClients;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        return;
    }
}

function findIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendPrivateMessage(
            currentPrivateContact,
            myId, 
            {
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        }
    else {
        console.log('End of candidates.');
    }
  }

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

function gotRemoteStream(event) {
    var newVideoElement = document.createElement("VIDEO");
    newVideoElement.id = ('video'+ videoElements);
    document.querySelector('#videos').appendChild(newVideoElement);

    var videoString = "#video" + videoElements;
    var video =  document.querySelector(videoString);
    console.log(event.streams[0]);
    video.srcObject = event.streams[0];
    video.play();
    videoElements++;
    console.log("added " + videoElements + " video element");
}

function offerTo(toId){
    console.log('Sending offer to peer');
    peer.createOffer().then(function(offer) {
      setLocalAndSendMessage(offer, toId);
    })
}

function answerTo(sender){
    console.log('Sending answer to peer', sender);
    peer.createAnswer().then(function(answer) {
      setLocalAndSendMessage(answer, sender);
    })
  }

function setLocalAndSendMessage(sessionDescription, toId) {
    peer.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendPrivateMessage(toId,
                    myId, 
                    sessionDescription
                    );
    
  }