import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { StreamingComponent } from './streaming/streaming.component';
import { UserListComponent } from './user-list/user-list.component';
import { AppRoutingModule } from './/app-routing.module';

/* Angular Fire */
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
// Environment configuration
import { environment } from 'environments/environment';

import { AngularDraggableModule } from 'angular2-draggable';

//this is not used at the moment..the box resets after resizing
import { ResizableModule } from 'angular-resizable-element';

@NgModule({
  declarations: [
    AppComponent,
    StreamingComponent,
    UserListComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularDraggableModule,
    ResizableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
