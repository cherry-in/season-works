import { OnInit, OnDestroy, DoCheck } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';
import { WikiBook } from '@wiz/libs/portal/wiki/book';

export class Component implements OnInit, OnDestroy, DoCheck {
    public BOOK_ID: string = "";
    public CONTENT_ID: string = "";

    public loaded: boolean = false;

    constructor(
        public service: Service,
        public wikibook: WikiBook,
        public project: Project
    ) {
        if (!WizRoute.segment.id)
            return service.href("/explore/wiki");
        this.BOOK_ID = WizRoute.segment.id;
        if (!WizRoute.segment.content)
            return service.href(`/wiki/${this.BOOK_ID}/home`);
    }

    public async ngOnInit() {
        if (this.project.prev) {
            await this.project.init(this.project.prev);
        }
        await this.service.init();
        await this.service.auth.allow();
        await this.wikibook.init(this.BOOK_ID);
        if (!this.wikibook.status())
            return this.service.href("/explore/wiki");
        this.loaded = true;
        await this.service.render();
    }

    public async ngDoCheck() {
        if (!this.loaded) return;
        if (this.CONTENT_ID !== WizRoute.segment.content) {
            this.CONTENT_ID = WizRoute.segment.content;
            await this.wikibook.content.load(this.CONTENT_ID);
        }
    }

    public async ngOnDestroy() {
        await this.service.render();
    }
}