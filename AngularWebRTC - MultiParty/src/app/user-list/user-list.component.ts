import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { User } from 'app/user';

import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: Observable<any[]>;
  newUser: any;
  userKey: any;
  usersRef: AngularFireList<any>;
  videoVisible = false;

  @ViewChild('videoContainer') videoContainer: any;

  constructor(private db: AngularFireDatabase) { 
    this.usersRef = db.list('users');
    this.users = this.usersRef.snapshotChanges().map(changes => {
      return changes.map(c => ({ key: c.payload.key, ...c.payload.val() }));
    });
  }
  
  ngOnInit() {
    this.addUser();
  }

  //delete user from firebase, when he closes his session
  @HostListener('window:beforeunload', ['$event'])
    beforeunloadHandler(event) {
      setTimeout(this.deleteUser(), 3);
  }

  // create new user
  addUser() {
    let id = this.createId();
    this.newUser = new User(id, false);
    // this saves the user
    this.userKey = this.usersRef.push(this.newUser).key;

    console.log("User: " + id + " added");
  }

  deleteUser() {
    this.db.list('users').remove(this.userKey);
    console.log("User: " +  this.newUser.id + " left");
  }

  createId() {
    return (
      this.generateId() +
      this.generateId() +
      "-" +
      this.generateId() +
      "-" +
      this.generateId() +
      "-" +
      this.generateId() +
      "-" +
      this.generateId() +
      this.generateId() +
      this.generateId()
    );
  }

  generateId() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  startVideoChat(){
    this.videoVisible = true;
  }
}
