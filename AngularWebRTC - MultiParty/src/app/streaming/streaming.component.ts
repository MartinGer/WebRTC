import { Component, OnInit, ViewChild, AfterViewInit, Input, ViewChildren, ElementRef, HostListener  } from '@angular/core';
import { User } from 'app/user';
import { AngularFireDatabase, AngularFireList, snapshotChanges } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.component.html',
  styleUrls: ['./streaming.component.css']
})
export class StreamingComponent implements AfterViewInit {
  peer: any;
  firstCallStarted: boolean = false;
  localStream: any;
  database: any;
  users: any;
  senderId: string;
  messagesObservable: any;
  contactList: string[] = [];
  currentPrivateContact: string;
  videoElements: number = 0;
  myRef: any;
  videoElementsDic: any = {};
  senderCalling: boolean;

  @Input() myKey: any;

  @ViewChild('localVideo') localVideo: any;
  @ViewChild('callButton') callButton: any;
  @ViewChild('endCallButton') endCallButton: any;
  
  peerConfig = {
    'iceServers': [
      { 'urls': 'stun:stun.services.mozilla.com' },
      { 'urls': 'stun:stun.l.google.com:19302' },
    ]
  };

  constructor(private db: AngularFireDatabase) {
    this.messagesObservable = this.db.list('messages');

    this.database = db.database.ref('messages');
    this.database.on('child_added', this.readMessage.bind(this));

    this.users = db.database.ref('users');
    this.users.on('child_changed', this.userLeaves.bind(this));
    this.users.on('child_removed', this.userClosesApp.bind(this));
  }

  ////////MediaStream part////////////////////////////////////////////
  ngAfterViewInit() {
    this.myRef = this.db.object('/users/' + this.myKey);
    this.myRef.valueChanges().subscribe(snapshot => {
      this.senderId = snapshot.id;
      this.senderCalling = snapshot.calling;
    });
  }

  startVideoChat(){
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })
        .then(stream => this.handleSuccess(stream))
        .catch(this.handleError);
    }
  }

  handleSuccess(stream) {
    console.log('Adding local stream.');
    this.localVideo.nativeElement.srcObject = stream;
    this.localStream = stream;
    this.sendMessage(); 
  }

  handleError(error) {
    console.log('navigator.mediaDevices.getUserMedia error: ', error);
  }
  ///////////////////////////////////////////////////////////////////

  //joining user sends his Id to all other calling clients
  sendMessage() {
    console.log("Sending my ID: " + this.senderId + " to all other calling clients. ");
    var msg = this.messagesObservable.push({
      sender: this.senderId,
    });
    msg.remove();
  }

  //send a private message to a clients Id
  sendPrivateMessage(toId, senderId, data) {
    console.log("Sending message to: " + toId)
    var msg = this.messagesObservable.push({
      toId: toId,
      sender: this.senderId,
      message: data
    });
    msg.remove();
  }

  readMessage(data) {
    if (data.val().toId == undefined) {   //handle the initial message of a joining user
      if (data.val().sender != this.senderId && this.senderCalling == true) {    //make sure that the user doesn't answer to his own message
        console.log("The new user " + data.val().sender + " requested contact. Sending my Id to the new user..");
        this.contactList = [];
        this.sendPrivateMessage(data.val().sender, this.senderId, "ContactId");
      }
    }  
    else {
      var toId = data.val().toId;

      if (toId == this.senderId) {  //make sure this message is adressed to this user
        var msg = data.val().message;
        var sender = data.val().sender;

        console.log('Client ' + this.senderId + ' received private message from ' + sender + ':', msg);

        if (msg == "ContactId") {
          console.log("Saved contact " + sender + " to my contact list.");
          this.contactList.push(sender);

          if (!this.firstCallStarted) {
            this.createPeerConnection();
            this.currentPrivateContact = sender;
            this.offerTo(sender);
            this.firstCallStarted = true;
            this.contactList.splice(0, 1); //delete client from list, to which offer got sent 
          }
        }
        else {
          if (msg.type == "offer") {
            this.createPeerConnection();
            this.currentPrivateContact = sender;

            this.peer.setRemoteDescription(new RTCSessionDescription(msg))
            this.answerTo(sender);
          }
          else if (msg.type == "answer")
            this.peer.setRemoteDescription(new RTCSessionDescription(msg));
          else if (msg.type == "candidate") {
            var candidate = new RTCIceCandidate({
              sdpMLineIndex: msg.label,
              candidate: msg.candidate
            });
            this.peer.addIceCandidate(candidate);
          }
        }
      }
    }
  }

  call() {
    this.startVideoChat();
    this.callButton.nativeElement.disabled = true;
    this.endCallButton.nativeElement.disabled = false;

    this.myRef.update({ calling: true });
  }

  endCall() {
    this.callButton.nativeElement.disabled = false;
    this.endCallButton.nativeElement.disabled = true;

    this.closeOtherVideos();
    this.myRef.update({ calling: false });


    //
    this.firstCallStarted = false;
  }

  createPeerConnection() {
    try {
      this.peer = new RTCPeerConnection(this.peerConfig);
      this.peer.onicecandidate = (event => this.findIceCandidate(event));
      this.peer.ontrack = (event => this.gotRemoteStream(event));
      this.peer.oniceconnectionstatechange = (event => this.connectToOtherClients(event));
      this.peer.addStream(this.localStream);
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      return;
    }
  }

  findIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      this.sendPrivateMessage(
        this.currentPrivateContact,
        this.senderId,
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

  connectToOtherClients(event) {
    if (this.peer.iceConnectionState == "connected") {
      if (this.contactList[0] != null) {
        console.log("start connecting to next client..");
        this.createPeerConnection();
        this.currentPrivateContact = this.contactList[0];
        this.offerTo(this.contactList[0]);
        this.contactList.splice(0, 1);
      }
    }
  }

  gotRemoteStream(event) {
    //gets called two times, once for audio and once for video track
    if (event.track.kind == 'video'){
      //create new video element div
      this.videoElements++;
      var newVideoElement = document.createElement("DIV");
      document.querySelector('#videos').appendChild(newVideoElement);
      newVideoElement.id = ('videoElement' + this.videoElements);
      newVideoElement.className = 'videoElement';
      var videoElementString = '#videoElement' + this.videoElements;
      var currentVideoElement = document.querySelector(videoElementString);

      //create Video itself, add it to the div and play it
      var newVideo = document.createElement("VIDEO");
      newVideo.id = ('video' + this.videoElements);
      newVideo.className = 'video';
      var videoString = '#video' + this.videoElements;
      currentVideoElement.appendChild(newVideo);
      var currentVideo = <HTMLVideoElement>document.querySelector(videoString);
      currentVideo.srcObject = event.streams[0];
      currentVideo.play();
      
      this.videoElementsDic[this.currentPrivateContact] = videoElementString;
      console.log("Added " + this.videoElements + " video element for user " + this.currentPrivateContact);

      //create a mute button and add it to the video element div
      var newButton = document.createElement("BUTTON");
      currentVideoElement.appendChild(newButton);
      newButton.className = 'btn';
      newButton.innerHTML = 'Mute';
    }
  }

  offerTo(toId) {
    console.log('Sending offer to peer');
    this.peer
      .createOffer()
      .then(offer => this.setLocalAndSendMessage(offer, toId));
  }

  answerTo(sender) {
    console.log('Sending answer to peer.');
    this.peer
      .createAnswer()
      .then(answer => this.setLocalAndSendMessage(answer, sender));
  }

  setLocalAndSendMessage(sessionDescription, toId) {
    this.peer
      .setLocalDescription(sessionDescription);

    console.log('setLocalAndSendMessage sending message', sessionDescription);

    this.sendPrivateMessage(
      toId,
      this.senderId,
      sessionDescription
    );
  }

  closeOtherVideos(){
    for (var i = 1; i <= this.videoElements; i++){
      document.querySelector('#videoElement'+ i).remove();
    }
    this.videoElements = 0; //reset the videoElements counter so the user can call again
  }

  //user closes his browser/app
  userClosesApp(data){
    console.log("User " + data.val().id + " closed the app. Removing his video..");
    try{
      var videoId = this.videoElementsDic[data.val().id];
      document.querySelector(videoId).remove();
      this.videoElements--;
    }
    catch {
      console.log("Leaving user never started a video chat..")
    }
  }

  //user ends the video call
  userLeaves(data){
    if(data.val().id != this.senderId && data.val().calling == false){
      console.log("User " + data.val().id + " left the chat. Removing his video..");
      var videoId = this.videoElementsDic[data.val().id];
      document.querySelector(videoId).remove();
      this.videoElements--; //one video element got deleted
    }
  }

  muteMicrophone(){
    this.localStream.getAudioTracks()[0].enabled = !(this.localStream.getAudioTracks()[0].enabled);
    var icon = document.getElementById("muteMic");
    if (icon.innerHTML == "mic") {
      icon.innerHTML = "mic_off";
    } 
    else {
      icon.innerHTML = "mic";
    }
  }

  hideVideo(){
    this.localStream.getVideoTracks()[0].enabled = !(this.localStream.getVideoTracks()[0].enabled);
    var icon = document.getElementById("hideVideo");
    if (icon.innerHTML == "videocam_off") {
      icon.innerHTML = "videocam";
    } 
    else {
      icon.innerHTML = "videocam_off";
    }
  }

  shareScreen(){
    var icon = document.getElementById("shareScreen");
    if (icon.innerHTML == "airplay") {
      icon.innerHTML = "close";
    } 
    else {
      icon.innerHTML = "airplay";
    }
  }
}
