import { OnInit, Input } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { WikiBook } from '@wiz/libs/portal/wiki/book';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public wikibook: WikiBook
    ) { }

    @Input() hasSaveBtn: boolean = true;

    public readOnly: boolean = true;
    public loaded: boolean = false;

    public async ngOnInit() {
        await this.service.init();
        this.loaded = true;
        this.readOnly = false;
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

    public async update() {
        const { code, data } = await this.wikibook.update();
        if (code == 200) {
            await this.alert("저장되었습니다", 'success');
            if (data.namespaceChanged)
                this.service.href(`/project/${data.data.namespace}/info`);
        } else {
            await this.alert(data);
            await this.wikibook.load();
        }
    }

    public async updateIcon() {
        if (!this.project.accessLevel(['admin'])) return;

        let res = await this.service.alert.show({
            title: '',
            message: '위키 아이콘을 변경하시겠습니까?',
            cancel: '닫기',
            actionBtn: 'warning',
            action: '확인',
            status: 'warning'
        });

        if (!res) return;

        let icon = await this.service.file.read({ type: 'image', accept: 'image/*', width: 96, quality: 1 });
        this.wikibook.data().icon = icon;
        await this.wikibook.update();
        await this.wikibook.load();
        await this.service.render();
    }
}