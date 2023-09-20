import { OnInit, OnDestroy, DoCheck } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit, OnDestroy, DoCheck {
    public PROJECT_ID: string = "";
    public MENU: string = "";

    public loaded: boolean = false;

    constructor(public service: Service, public project: Project) {
        if (!WizRoute.segment.id)
            return service.href("/explore/project");
        this.PROJECT_ID = WizRoute.segment.id;
    }

    public async ngDoCheck() {
        if (!this.loaded) return;
        if (!WizRoute.segment.menu)
            return this.service.href("/explore/project");
        this.MENU = WizRoute.segment.menu;
    }

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.allow();
        await this.project.init(this.PROJECT_ID);

        if (!WizRoute.segment.menu) {
            let main: string = this.project.data().extra.main;
            if (!main) main = 'info';
            this.service.href(`/project/${this.PROJECT_ID}/${main}`);
            this.MENU = main;
        } else {
            this.MENU = WizRoute.segment.menu;
        }

        if (!this.project.status())
            return this.service.href("/explore/project");
        
        await this.service.render();

        this.loaded = true;
        await this.service.render();
    }

    public async ngOnDestroy() {
        await this.project.revert();
        await this.service.render();
    }
}