import { OnInit } from '@angular/core';
import { HostListener } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit {
    constructor(public service: Service, public project: Project) { }

    public async ngOnInit() {
        await this.service.init();
    }

    @HostListener('document:click')
    public clickout() {
        this.service.navbar.toggle(true);
    }

    public isActive(link: string) {
        return location.pathname.indexOf(link) === 0
    }
}