import { OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit, OnDestroy {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    public async ngOnInit() {
        await this.service.init();
        while (!this.treeConfig.rootNode)
            await this.service.render(100);
        this.current = this.treeConfig.rootNode();
        await this.service.render();
    }

    public async alert(message: string, action: string = '확인') {
        return await this.service.alert.show({
            title: "",
            message: message,
            cancel: "취소",
            actionBtn: "error",
            action: action,
            status: "error"
        });
    }

    public accessLevel() {
        return this.project.accessLevel(['admin', 'manager', 'user'])
    }

    public tab: string = 'files';

    public async tabChange(tab: string = 'files') {
        this.tab = tab;
        if (tab == 'attachment') {
            this.attachment.ns = '.attachment';
            await this.loadAttachment(1);
        } else if (tab == 'photo') {
            this.attachment.ns = '.image';
            await this.loadAttachment(1);
        }

        await this.service.render();
    }

    public attachment: any = {
        list: [],
        page: 1,
        start: -1,
        end: -1,
    };

    public async loadAttachment(page: number) {
        this.attachment.list = [];
        this.attachment.page = page;
        await this.service.render();
        const { code, data } = await this.project.api(`attachment/list`, this.attachment);
        if (code != 200) return;
        let { rows, lastpage } = data;
        const startpage = Math.floor((page - 1) / 10) * 10 + 1;
        this.attachment.list = rows;
        this.attachment.start = startpage;
        this.attachment.end = lastpage;
        await this.service.render();
    }

    public imageUrl(image: any, isThumbnail: boolean = true) {
        if (isThumbnail)
            return `url('${this.project.thumbnailUrl(image.id, image.filename)}')`;
        return this.project.downloadUrl(image.id, image.filename);
    }

    // 파일 드라이브
    public current: any;
    public selected: any = [];
    public newFolder: any = {};

    public icon(node: any, checkopen: boolean = true) {
        if (node.type == 'folder') {
            if (node.isOpen() && checkopen)
                return 'fa-regular fa-folder-open';
            else
                return 'fa-solid fa-folder';
        }

        return 'fa-regular fa-file-lines';
    }

    public async open(node: any) {
        if (node.type == 'folder') {
            await this.tabChange('files');
            this.current = node;
            this.selected = [];
            this.newFolder = {};
            await this.current.refresh();
            await this.service.render();
        } else {
            await this.download(node);
        }
    }

    public async select(node: any) {
        if (this.selected.includes(node.id)) {
            this.selected.remove(node.id);
        } else {
            this.selected.push(node.id);
        }
        await this.service.render();
    }

    public async selectAll() {
        let childs = this.current.getChildren();
        let isUnselect = this.selected.length == childs.length;
        for (let i = 0; i < childs.length; i++) {
            let node = childs[i];
            if (isUnselect) {
                if (this.isSelected(childs[i]))
                    await this.select(childs[i]);
            } else {
                if (!this.isSelected(childs[i]))
                    await this.select(childs[i]);
            }
        }
        await this.service.render();
    }

    public isSelected(node: any) {
        return this.selected.includes(node.id);
    }

    public async deleteSelected() {
        if (!await this.alert(`${this.selected.length}개의 파일을 삭제하시겠습니까?`, `삭제`)) return;
        let data = JSON.stringify(this.selected);
        await this.project.api(`drive/deletes`, { data });
        this.selected = [];
        await this.current.refresh();
        await this.service.render();
    }

    public treeConfig: any = {
        load: async (path: any) => {
            let res = await this.project.api(`drive/tree`, { path: path });
            return res;
        },
        update: async (node: any) => {
            let data = JSON.parse(JSON.stringify(node));
            let changed = data.title != data.rename;
            if (data.rename) data.title = data.rename;
            await this.project.api(`drive/update`, data);
            if (changed) await node.flush();
        },
        upload: async (node: any, files: any) => {
            if (node.type == 'file')
                node = node.parent();
            this.project.drive.regist(node, files);
        },
        select: async (node: any) => {
            if (node.type == 'folder') {
                if (node.id != this.current.id)
                    await node.toggle();
            } else {
                await this.download(node);
            }
        },
        isActive: (node: any) => {
            if (!this.current) return false;
            return node.id === this.current.id;
        }
    }

    public async create(node: any, onTree: boolean = true) {
        if (onTree) {
            node.newItem = { type: 'folder', root_id: node.id ? node.id : '' };
        } else {
            this.newFolder = { type: 'folder', root_id: node.id ? node.id : '' };
        }
        await this.service.render();
    }

    public async createFolder(node: any, onTree: boolean = true) {
        let data: any = null;
        if (onTree) {
            data = JSON.parse(JSON.stringify(node.newItem));
            delete node.newItem;
        } else {
            data = JSON.parse(JSON.stringify(this.newFolder));
            this.newFolder = {};
        }
        if (!data.title) return;
        await this.project.api(`drive/create`, data);
        await node.refresh();
    }

    public async cancelCreate(node: any, onTree: boolean = true) {
        if (onTree) {
            delete node.newItem;
        } else {
            this.newFolder = {};
        }
        await this.service.render();
    }

    public async delete(node: any) {
        if (!await this.alert(`'${node.title}' ${node.type == 'folder' ? '폴더' : '파일'}을 삭제하시겠습니까?`, `삭제`)) return;
        await this.project.api(`drive/delete`, { id: node.id });
        this.selected.remove(node.id);
        await node.parent().refresh();
    }

    public async rename(node: any) {
        node.editable = true;
        await this.service.render();
    }

    public async download(node: any) {
        if (!node) node = this.rootNode;
        let url = this.project.url('drive/download/' + node.id);
        window.open(url, '_blank');
    }

    public async upload(node: any) {
        let files = await this.service.file.select();
        await this.project.drive.regist(node, files);
    }

    public dragToItem: any = null;

    public isDrop(node: any) {
        if (this.dragToItem && node.id == this.dragToItem.id)
            return true;
        return false;
    }

    public async dragover(event: any, file: any) {
        event.preventDefault();
        event.stopPropagation();
        let changed: boolean = this.dragToItem != file;
        this.dragToItem = file;
        if (changed)
            await this.service.render();
    }

    public async dragend(event: any, file: any) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.dragToItem) return;

        let parent = file.parent();
        file.root_id = this.dragToItem.id ? this.dragToItem.id : '';
        await file.update();
        await await parent.refresh();
        await await file.parent().refresh();

        this.dragToItem = null;
        await this.service.render();
    }

    public async preventEvent(event: any) {
        event.preventDefault();
        event.stopPropagation();
    }
}