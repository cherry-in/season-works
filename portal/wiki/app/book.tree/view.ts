import { OnInit, OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { WikiBook } from '@wiz/libs/portal/wiki/book';

export class Component implements OnInit, OnDestroy {
    constructor(public service: Service, public wikibook: WikiBook) { }

    public async ngOnInit() {
        await this.service.init();
        this.wikibook.content.bind('update', this.contentBinding.bind(this));
        this.wikibook.content.bind('load', this.contentBinding.bind(this));
    }

    public async ngOnDestroy() {
        this.wikibook.content.unbind('update', this.contentBinding);
        this.wikibook.content.unbind('load', this.contentBinding);
    }

    public async contentBinding(content: any) {
        if (!this.treeConfig.info) return;
        let item = this.treeConfig.info(content.root_id);
        if (item) await item.refresh();
        this.wikibook.content.node = item;
    }

    public treeConfig: any = {
        load: async (key: any) => {
            let res = await this.wikibook.api(`tree/${key}`);
            return res;
        },
        update: async (node: any) => {
            let data = { title: node.title, type: 'folder', root_id: node.root_id ? node.root_id : '' };
            if (node.id) {
                data.id = node.id;
                data.title = node.rename;
            }
            await this.wikibook.api(`content/update`, data);
        },
        moved: async () => {
            if (this.wikibook.content.data().id)
                await this.wikibook.content.load(this.wikibook.content.data().id);
        },
        select: async (node: any) => {
            this.wikibook.content.node = node;
            this.wikibook.service.href(`/wiki/${this.wikibook.data().namespace}/${node.id}`);
        },
        onInit: async (root: any) => {
            let childs = root.getChildren();
            for (let i = 0; i < childs.length; i++) {
                if (childs[i].type == 'folder') {
                    await childs[i].toggle(true);
                }
            }
        },
        sort: (children: any) => {
            children.sort((a, b) => {
                return a.title.localeCompare(b.title);
            });
        },
        isActive: (node: any) => {
            return node.id === this.wikibook.content.data().id;
        }
    }

    // custom data control actions
    public async create(node: any) {
        node.newItem = { type: 'folder', root_id: node.id ? node.id : '' };
        await this.service.render();
    }

    public async createNode(node: any) {
        let data = JSON.parse(JSON.stringify(node.newItem));
        delete node.newItem;
        if (!data.title) return;
        await this.wikibook.api(`content/update`, data);
        await node.refresh();
    }

    public async createDoc(node: any) {
        let fn = async () => {
            this.wikibook.content.data().root_id = node.id;
            this.wikibook.content.unbind("load", fn);
        }
        await this.wikibook.content.bind("load", fn);
        await this.wikibook.service.href(`/wiki/${this.wikibook.data().namespace}/new`);
    }

    public async newContent() {
        this.service.href(`/wiki/${this.wikibook.data().namespace}/new`)
    }

    public async cancelCreate(node: any) {
        delete node.newItem;
        await this.service.render();
    }

    public async delete(node: any) {
        await this.wikibook.api(`content/delete`, { id: node.id });
        await node.parent().refresh();
    }

    public async updateIcon() {
        if (!this.wikibook.accessLevel(['admin'])) return;

        let res = await this.service.alert.show({
            title: '',
            message: '아이콘을 변경하시겠습니까?',
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