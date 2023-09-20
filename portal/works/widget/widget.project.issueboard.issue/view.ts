import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    @Input() issue: any;

    public async ngOnInit() {
        await this.service.init();
    }

    public color() {
        if (!this.issue) return '';
        if (this.issue.status == 'close' || this.issue.status == 'cancel') return '';
        if (this.issue.status == 'finish' && this.issue.process == 100) return 'bg-teal-lt';
        if (this.issue.planend) {
            try {
                let endtime = new Date(this.issue.planend).getTime();
                let now = new Date().getTime();
                if (now - endtime > 1000 * 60 * 60 * 24)
                    return 'bg-red-lt';
            } catch (e) {
            }
        }
        return '';
    }
}