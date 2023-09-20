import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';
import { WikiBook } from '@wiz/libs/portal/wiki/book';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        public service: Service,
        public project: Project,
        public wikibook: WikiBook,
        public router: Router,
        public ref: ChangeDetectorRef
    ) { }

    public async ngOnInit() {
        await this.service.init(this);
        await this.project.bind(this.service);
        await this.wikibook.bind(this.service);
    }
}