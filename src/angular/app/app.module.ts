import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, COMPOSITION_BUFFER_MODE } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SortablejsModule } from "@wiz/libs/portal/season/ngx-sortablejs";
import { KeyboardShortcutsModule } from 'ng-keyboard-shortcuts';

@NgModule({
    declarations: [
        '@wiz.declarations'
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        SortablejsModule,
        KeyboardShortcutsModule.forRoot(),
        '@wiz.imports'
    ],
    providers: [
        {
            provide: COMPOSITION_BUFFER_MODE,
            useValue: false
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }