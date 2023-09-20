import { OnInit, Input } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit {
    public NAMESPACE: string = "info";

    constructor(
        public service: Service,
        public project: Project
    ) { }

    public shortcuts: any = [];

    @Input() hasSaveBtn: boolean = true;
    @Input() config: any = {};

    @ViewChild('editor')
    public editorElement: ElementRef;

    public editor: any;
    public editorLoaded: boolean = false;
    public readOnly: boolean = true;
    public loaded: boolean = false;

    public async ngOnInit() {
        this.shortcuts = [
            {
                name: "save",
                key: ["cmd + s", "ctrl + s"],
                preventDefault: true,
                command: async () => {
                    await this.update();
                }
            }
        ];
        for (let i = 0; i < this.shortcuts.length; i++)
            this.shortcuts[i].allowIn = ['TEXTAREA', 'INPUT', 'SELECT'];

        await this.service.init();
        this.loaded = true;
        this.readOnly = !this.project.accessLevel(['admin']);
        await this.service.render();
        let editor = await this.project.bindEditor(this.editorElement.nativeElement, false, this.readOnly);
        if (editor) this.editor = editor;

        this.editor.keystrokes.set('Ctrl+S', async (event, cancel) => {
            event.preventDefault();
            await this.update();
        }, { priority: 'high' });

        this.editor.data.set(this.project.data().extra.doc);
        this.config.updateDescription = this.updateDescription.bind(this);
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

    public async updateDescription() {
        this.project.data().extra.doc = this.editor.data.get();
    }

    public async arrayAdd(arr: any, item: any = {}) {
        arr.push(item);
        await this.service.render();
    }

    public async arrayRemove(arr: any, item: any = {}) {
        arr.remove(item);
        await this.service.render();
    }

    public async update() {
        if (this.hasSaveBtn && !this.readOnly) {
            this.project.data().extra.doc = this.editor.data.get();
            const { code, data } = await this.project.update();
            if (code == 200) {
                await this.alert("저장되었습니다", 'success');
                if (data.namespaceChanged) {
                    this.service.href(`/project/${data.data.namespace}/info`);
                }
            } else {
                await this.alert(data);
                await this.project.load();
            }
        }
    }

    public async updateIcon() {
        if (!this.project.accessLevel(['admin'])) return;

        let res = await this.service.alert.show({
            title: '',
            message: '프로젝트 아이콘을 변경하시겠습니까?',
            cancel: '닫기',
            actionBtn: 'warning',
            action: '확인',
            status: 'warning'
        });

        if (!res) return;

        let icon = await this.service.file.read({ type: 'image', accept: 'image/*', width: 96, quality: 1 });
        this.project.data().icon = icon;
        await this.project.update();
        await this.project.load();
        await this.service.render();
    }

    public async deleteIcon() {
        this.project.data().icon = '';
        await this.project.update();
        await this.project.load();
        await this.service.render();
    }

}