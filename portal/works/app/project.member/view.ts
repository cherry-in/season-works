import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    public readOnly: boolean = true;
    public newuser: any = { role: 'user' };

    public async ngOnInit() {
        await this.service.init();
        this.readOnly = !this.project.accessLevel(['admin', 'manager']);
        await this.project.member.load();
        await this.service.render();
    }

    public async alert(message: string, status: any = "error", action: string = '확인', cancel: any = false) {
        return await this.service.alert.show({
            title: '',
            message: message,
            cancel: cancel,
            actionBtn: status,
            action: action,
            status: status
        });
    }

    public async roleChanged(user: any) {
        await this.project.member.update(user.user, user.role);
        await this.project.member.load();
        await this.service.render();
    }

    public async remove(user: any) {
        await this.project.member.remove(user.user);
        await this.project.member.load();
        await this.service.render();
    }

    public async create() {
        let { email, role } = this.newuser;
        email = email.replace(" ", "");
        const { code, data } = await this.project.member.create(email, role);

        if (code != 200) {
            await this.alert(data);
            return;
        }

        this.newuser = { role: 'user' };
        await this.project.member.load();
        await this.service.render();
    }

}