import { OnInit } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { WikiBook } from '@wiz/libs/portal/wiki/book';

export class Component implements OnInit {
    constructor(public service: Service, public wikibook: WikiBook) { }

    @ViewChild('editor')
    public editorElement: ElementRef;
    public editor: any;

    public tab: string;
    public isUpdate: boolean = false;
    public isCommit: boolean = false;
    public revision_id: any;

    public async ngOnInit() {
        await this.service.init();
        await this.active("default");

        this.wikibook.content.bind('load', async () => {
            this.revision_id = null;
            await this.active("default");
        });
    }

    public is(tab: string) {
        return this.tab == tab;
    }

    public isnot(tab: string) {
        return this.tab != tab;
    }

    public async active(tab: string) {
        this.tab = tab;
        await this.service.render();

        if (tab == 'default' && this.wikibook.content.contentType == 'content') {
            let editor = await this.wikibook.bindEditor(this.editorElement.nativeElement, !this.wikibook.accessLevel(['admin', 'user']));
            if (editor) this.editor = editor;
            this.editor.data.set(this.wikibook.content.data().content ? this.wikibook.content.data().content : '');
            this.editor.keystrokes.set('Ctrl+S', async (event, cancel) => {
                event.preventDefault();
                await this.updateContent();
            }, { priority: 'high' });
        }
    }

    public async home() {
        this.wikibook.data().home = this.wikibook.content.data().id;
        await this.wikibook.update();
    }

    public async updateContent() {
        this.isUpdate = true;
        await this.service.render();
        this.wikibook.content.data().content = this.editor.data.get();
        await this.wikibook.content.update();
        this.isUpdate = false;
        await this.service.render();
    }

    public async commit() {
        let res = await this.service.alert.show({
            title: '리비전 생성',
            message: '확인을 누르면 리비전이 생성됩니다',
            cancel: '취소',
            actionBtn: 'success',
            action: '확인',
            status: 'success'
        });

        if (!res) return;

        this.isCommit = true;
        await this.service.render();
        await this.wikibook.content.commit();
        this.isCommit = false;
        await this.service.render();
    }

    public async loadRevision(revision_id: any) {
        this.revision_id = revision_id;
        if (revision_id) {
            let content = await this.wikibook.content.loadRevision(revision_id);
            this.editor.data.set(content);
        } else {
            this.editor.data.set(this.wikibook.content.data().content ? this.wikibook.content.data().content : '');
        }
    }

    public async delete() {
        let res = await this.service.alert.show({
            title: '문서삭제',
            message: '정말로 삭제하시겠습니까?',
            cancel: '닫기',
            actionBtn: 'error',
            action: '삭제',
            status: 'error'
        });

        if (!res) return;

        await this.wikibook.api(`content/delete`, { id: this.wikibook.content.data().id });
        if (await this.wikibook.content.node)
            await this.wikibook.content.node.parent().refresh();
        await this.service.href(`/wiki/${this.wikibook.data().namespace}`);
    }
}