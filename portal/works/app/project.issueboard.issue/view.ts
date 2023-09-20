import { OnInit, Input } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';
import { HostListener } from '@angular/core';
import moment from 'moment';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    @Input() issue: number = null;
    @Input() isMovable: boolean = true;

    @ViewChild('body')
    public bodyElement: ElementRef;

    @ViewChild('description')
    public descriptionElement: ElementRef;

    @ViewChild('comment')
    public commentElement: ElementRef;

    @ViewChild('messages')
    public messageElement: ElementRef;

    public NAMESPACE: string | null;

    public readOnly: boolean = true;

    public editor: any = { description: null, message: null };

    public config: any = {
        todoSorted: {
            animation: 0
        }
    };

    public data: any = {};

    public cache: any = {
        loaded: false,
        editorLoaded: false,
        worker: false,
        isUpdate: false,
        messageTab: '',
        isLastMessage: false,
        message: { attachment: [], images: [] },
        messageIds: {},
        searchMember: '',
        todoText: '',
        imageGrid: {},
        pendingGrid: [],
        activeGrid: false,
        newMessage: false,
        sendMessage: false,
        loadMessage: false,
        tab: 'info'
    };

    public shortcuts: any = [];
    public messageEvent: any = {};

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

        this.NAMESPACE = "issueboard.issue:" + this.issue.id;

        if (this.issue.modal) await this.service.loading.show();
        await this.service.init();

        this.readOnly = !this.project.accessLevel(['admin', 'manager', 'user']);
        if (this.readOnly)
            this.config.todoSorted.handle = ".no-drag";

        this.messageEvent.favoriteMessage = this.favoriteMessage.bind(this);
        this.messageEvent.replyMessage = this.replyMessage.bind(this);
        this.messageEvent.imageGrid = this.imageGrid.bind(this);
        this.messageEvent.imageUrl = this.imageUrl.bind(this);

        await this.load();

        let descEditor = await this.project.bindEditor(this.descriptionElement.nativeElement, false, !this.isRole(['owner']));
        if (descEditor) this.editor.description = descEditor;

        this.editor.description.keystrokes.set('Ctrl+S', async (event, cancel) => {
            event.preventDefault();
            await this.update();
        }, { priority: 'high' });

        if (this.data.info.description) this.editor.description.data.set(this.data.info.description);
        if (this.issue.id != 'new' && !this.readOnly) {
            let msgEditor = await this.project.bindEditor(this.commentElement.nativeElement, true, this.readOnly);
            if (msgEditor) this.editor.message = msgEditor;

            this.editor.message.keystrokes.set('Ctrl+S', async (event, cancel) => {
                event.preventDefault();
                await this.sendMessage();
            }, { priority: 'high' });

            this.editor.message.keystrokes.set('Shift+Space', async (event, cancel) => {
                event.preventDefault();
                await this.sendMessage();
            }, { priority: 'high' });
        }

        let self = this;

        this.issue.event.getData = () => {
            return self.data.info;
        }

        this.issue.event.update = async () => {
            let { data } = await self.api('load');
            self.data.info = data;
            if (self.data.info.planstart)
                self.data.info.planstart = moment(self.data.info.planstart).format("YYYY-MM-DD");
            if (self.data.info.planend)
                self.data.info.planend = moment(self.data.info.planend).format("YYYY-MM-DD");
            self.data.info.level = self.data.info.level + '';
            self.data.info.process = self.data.info.process + '';
            self.editor.description.data.set(self.data.info.description);
            await self.service.render();
        };

        this.issue.event.messages = async (data: any) => {
            let { parent_id } = data;
            parent_id = parent_id * 1;
            if (parent_id > 0)
                await this.refreshMessage(parent_id);
            if (!this.cache.sendMessage)
                await this.unreadMessage();
        };

        await this.service.loading.hide();
        if (this.issue.event.onLoad)
            this.issue.event.onLoad();
    }

    public async alert(message: string, title: any = "", status: any = "error", action: string = '확인', cancel: any = false) {
        return await this.service.alert.show({
            title: title,
            message: message,
            cancel: cancel,
            actionBtn: status,
            action: action,
            status: status
        });
    }

    public async api(fnname: string, query: any = {}) {
        query.project_id = this.project.id();
        query.issue_id = this.issue.id;
        return await wiz.call(fnname, query);
    }

    public async load() {
        this.data = {};

        await this.project.member.load();

        let { data } = await this.api('load');
        this.data.info = data;
        if (!this.data.info) {
            this.data.info = {
                level: '1',
                process: '0',
                status: 'open',
                planstart: moment().format("YYYY-MM-DD"),
                todo: [],
                worker: []
            };
        }
        if (this.data.info.planstart)
            this.data.info.planstart = moment(this.data.info.planstart).format("YYYY-MM-DD");
        if (this.data.info.planend)
            this.data.info.planend = moment(this.data.info.planend).format("YYYY-MM-DD");

        this.data.info.level = this.data.info.level + '';
        this.data.info.process = this.data.info.process + '';

        this.cache.loaded = true;
        this.cache.message = { attachment: [], images: [] };
        this.data.messages = [];
        this.cache.messageIds = {};
        this.cache.imageGrid = {};
        this.cache.isLastMessage = false;
        await this.service.render();

        if (this.issue.id == 'new') return;

        await this.initMessage('message');
    }

    public isRole(allowed: any = []) {
        if (this.issue.id == 'new') return true;
        if (this.readOnly) return false;
        return allowed.includes(this.data.info.role);
    }

    public searchMember(user: any, keyword: string) {
        if (this.readOnly) return false;
        if (!this.isRole(['owner', 'manager'])) return false;
        if (!user.meta.id) return false;
        if (!['admin', 'manager', 'user'].includes(user.role)) return false;
        if (this.data.info.worker.includes(user.meta.id)) return false;
        if (user.meta.name.indexOf(keyword) >= 0) return true;
        return false;
    }

    public async selectMember() {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        this.cache.worker = !this.cache.worker;
        await this.service.render();
    }

    public async addMember(member_id: string) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        if (!this.data.info.worker.includes(member_id))
            this.data.info.worker.push(member_id);
        this.cache.searchMember = '';
        this.cache.worker = false;
        await this.service.render();
    }

    public async removeMember(member_id: string) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        this.data.info.worker.remove(member_id);
        await this.service.render();
    }

    public async addTodo(todoText: string) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        if (!this.cache.todoText) return;
        if (this.data.info.todo.length >= 5) {
            await this.alert(`TODO 목록은 최대 5개 까지만 등록 가능합니다`, "오류", "error", "확인", false);
            return;
        }
        this.data.info.todo.push({ title: todoText, checked: false });
        this.cache.todoText = "";
        await this.service.render();
    }

    public async removeTodo(todo: any) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        this.data.info.todo.remove(todo);
        await this.service.render();
    }

    public async checkTodo(todo: any) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        todo.checked = !todo.checked;
        await this.service.render();
    }

    public async initMessage(tab: any = null) {
        if (!tab) tab = this.cache.messageTab;
        let isInit = this.cache.messageTab != tab;
        this.cache.messageTab = tab;
        if (isInit) {
            this.data.messages = [];
            this.cache.messageIds = {};
            this.cache.imageGrid = {};
            this.cache.isLastMessage = false;
            await this.loadMessage();
        }
        await this.service.render();
    }

    public async onScrollMessage() {
        let scrollElement = this.messageElement.nativeElement;
        let top = scrollElement.scrollTop;

        if (!this.cache.isLastMessage) {
            if (top < 50) {
                scrollElement.scrollTo(0, 100);
                this.loadMessage();
            }
        }

        if (this.cache.newMessage) {
            if (top > scrollElement.scrollHeight - scrollElement.offsetHeight * 1.2) {
                this.cache.newMessage = false;
                await this.service.render();
            }
        }
    }

    public async refreshMessage(message_id: number) {
        let { code, data } = await this.api("message", { message_id: message_id });
        console.log(data);
        if (data) {
            for (let i = 0; i < this.data.messages.length; i++) {
                if (this.data.messages[i].id == data.id) {
                    for (let key in data)
                        this.data.messages[i][key] = data[key];
                    break;
                }
            }
        }
        await this.service.render();
    }

    public async loadMessage() {
        if (this.cache.loadMessage) return;
        this.cache.loadMessage = true;
        await this.service.render();

        let qd = {
            'type': this.cache.messageTab
        };
        if (this.data.messages.length > 0)
            qd['first'] = this.data.messages[0].id;
        let res = await this.api("messages", qd);
        if (res.code != 200) return;
        if (res.data.length < 10)
            this.cache.isLastMessage = true;
        for (let i = 0; i < res.data.length; i++) {
            if (this.cache.messageIds[res.data[i].id]) continue
            this.data.messages.unshift(res.data[i]);
            this.cache.messageIds[res.data[i].id] = true;
        }
        await this.service.render();

        if (!qd.first) {
            let scrollElement = this.messageElement.nativeElement;
            scrollElement.scrollTo(0, scrollElement.scrollHeight + 32);
        }

        this.cache.loadMessage = false;
        await this.service.render();
    }

    public async unreadMessage(scrollDown: boolean = false) {
        if (this.cache.loadMessage) return;
        this.cache.loadMessage = true;

        let qd = {
            'type': this.cache.messageTab
        };
        if (this.data.messages.length > 0)
            qd['last'] = this.data.messages[this.data.messages.length - 1].id;
        let res = await this.api("unreadMessages", qd);
        let count = 0;

        if (res.code == 200) {
            for (let i = 0; i < res.data.length; i++) {
                if (this.cache.messageIds[res.data[i].id]) continue;
                this.data.messages.push(res.data[i]);
                this.cache.messageIds[res.data[i].id] = true;
                count++;
            }
        }

        await this.service.render();

        if (scrollDown) {
            let scrollElement = this.messageElement.nativeElement;
            scrollElement.scrollTo(0, scrollElement.scrollHeight + 32);
            this.cache.newMessage = false;
        } else {
            if (count > 0)
                this.cache.newMessage = true;
        }

        this.cache.loadMessage = false;
        await this.service.render();
    }

    public async sendMessage() {
        if (this.readOnly) return;

        let info = this.cache.message;
        info.message = this.editor.message.data.get();
        info.message = info.message.trim();

        if (!info.message && info.attachment.length == 0 && info.images.length == 0) {
            return;
        }

        info.favorite = 0;
        info.type = 'message';
        if (info.attachment.length > 0)
            info.type = 'file';

        this.cache.sendMessage = true;
        await this.api("sendMessage", { data: JSON.stringify(info) });
        let parent_id: any = this.cache.message.parent_id;
        this.cache.message = { attachment: [], images: [] };
        if (parent_id)
            this.cache.message.parent_id = parent_id;
        this.editor.message.data.set("");
        await this.initMessage(parent_id ? null : "message");
        await this.unreadMessage(true);
        this.cache.sendMessage = false;
    }

    public async favoriteMessage(message: any) {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;

        if (message.favorite == 0) message.favorite = 1;
        else message.favorite = 0;

        await this.api("favoriteMessage", {
            id: message.id,
            favorite: message.favorite
        });
        await this.service.render();
    }

    public async replyMessage(parent: any) {
        if (!parent) {
            delete this.cache.message.parent_id;
        } else {
            this.cache.message.parent_id = parent.id;
            this.editor.message.focus();
        }
        await this.service.render();
    }

    public async removeAttachment(file: any) {
        if (this.readOnly) return;
        this.cache.message.attachment.remove(file);
        await this.service.render();
    }

    public async removeImage(file: any) {
        if (this.readOnly) return;
        this.cache.message.images.remove(file);
        await this.service.render();
    }

    public async upload(filetype: string = "file") {
        if (this.readOnly) return;
        let accept: any = filetype == 'image' ? 'image/*' : null;
        let multiple: boolean = true;

        let ns = "issueboard.issue.attachment:" + this.issue.id;
        if (filetype != 'file') ns = "issueboard.issue.image:" + this.issue.id;

        let res = await this.project.attachment(ns, accept, multiple, -1, async (fi: number, flength: number, ui: number, ut: number) => {
            if (filetype != 'file') return;
            this.cache.message.uploading = {};
            this.cache.message.uploading.index = fi;
            this.cache.message.uploading.total = flength;
            this.cache.message.uploading.process = ui * 100 / ut;
            await this.service.render();
        });

        for (let i = 0; i < res.data.length; i++) {
            if (filetype == 'file')
                this.cache.message.attachment.push(res.data[i]);
            else
                this.cache.message.images.push(res.data[i]);
        }

        let errormsg = [];
        for (let i = 0; i < res.error.length; i++)
            errormsg.push(res.error[i].filename);

        if (errormsg.length > 0) {
            await this.alert(`${errormsg.join(", ")} 파일 업로드 중 오류가 발생했습니다.`, "파일 업로드 오류", "error", "확인", false);
        }

        delete this.cache.message.uploading;
        await this.service.render();
    }

    public imageUrl(image: any) {
        return `url('${this.project.thumbnailUrl(image.id, image.filename)}')`;
    }

    public imageGrid(msg: any) {
        if (this.cache.imageGrid[msg.id]) return this.cache.imageGrid[msg.id];
        let images = msg.images;
        let grid = [];

        let row = { items: [] };
        for (let i = 0; i < images.length; i++) {
            row.items.push(images[i]);
            if (row.items.length == 4) {
                row.size = "col-3";
                grid.push(row);
                row = { items: [] };
            }
        }

        if (row.items.length > 0) {
            if (row.items.length == 1) {
                row.size = "col-12";
            } else if (row.items.length == 2) {
                row.size = "col-6";
            } else if (row.items.length == 3) {
                row.size = "col-4";
            } else {
                row.size = "col-3";
            }

            grid.push(row);
        }

        this.cache.imageGrid[msg.id] = grid;
        this.cache.pendingGrid.push(msg.id);
        this.activeGrid();
        return grid;
    }

    public async activeGrid() {
        if (this.cache.activeGrid)
            return;

        this.cache.activeGrid = true;

        while (this.cache.pendingGrid.length > 0) {
            let msg_id = this.cache.pendingGrid[this.cache.pendingGrid.length - 1];
            for (let i = 0; i < this.cache.imageGrid[msg_id].length; i++) {
                let grid = this.cache.imageGrid[msg_id][i];
                for (let j = 0; j < grid.items.length; j++) {
                    grid.items[j].load = true;
                    await this.service.render(200);
                }
            }
            this.cache.pendingGrid.remove(msg_id);
        }

        this.cache.activeGrid = false;
        if (this.cache.pendingGrid.length > 0)
            this.activeGrid();
    }

    public async update() {
        if (this.readOnly) return;
        if (!this.isRole(['owner', 'manager'])) return;
        if (this.cache.isUpdate) return;

        let info = this.data.info;
        try {
            info.description = this.editor.description.data.get();
        } catch (e) {
        }
        if (!info.title)
            return await this.alert(`이슈 제목을 입력해주세요`, "오류", "error", "확인", false);

        this.cache.isUpdate = true;
        await this.service.render();

        if (!info.label_id) {
            info.label_id = this.issue.label_id;
        } else {
            delete info.label_id;
        }

        if (["finish", "close"].includes(info.status))
            info.process = 100;

        if (info.process == 100 && !["finish", "close", "cancel"].includes(info.status))
            info.status = 'finish';

        const { code, data } = await this.api("update", { data: JSON.stringify(info) });

        this.cache.isUpdate = false;

        if (this.issue.id != 'new') {
            await this.service.render();
            return;
        }

        if (code == 200) {
            this.issue.label.issues.push(data.id);
            await this.issue.parent.updateLabels(this.issue.parent.labels);
            await this.hide();
        }
    }

    public async hide() {
        this.issue.modal = false;
        await this.service.render();
        if (this.issue.event.hide) await this.issue.event.hide();
    }

    public async switchTab(tab: string = 'info') {
        this.cache.tab = tab;
        await this.service.render();
    }

    public async preventEvent(event: any) {
        event.preventDefault();
        event.stopPropagation();
    }

    public isMoving: boolean = false;
    public modalStyle: any = {};

    public async onStartMoving(event: any) {
        event.stopPropagation();
        event.preventDefault();
        this.isMoving = true;
    }

    @HostListener('document:mouseup')
    public onStopMoving() {
        this.isMoving = false;
        this.modalStyle = {};
    }

    @HostListener('mousemove', ['$event'])
    public onMouseMove(event: MouseEvent) {
        if (!this.isMoving) return;
        if (!this.modalStyle.start) {
            this.modalStyle.start = true;
            this.modalStyle.x = parseInt(window.getComputedStyle(this.bodyElement.nativeElement).marginLeft);
            this.modalStyle.y = parseInt(window.getComputedStyle(this.bodyElement.nativeElement).marginTop);
            this.modalStyle.stx = event.screenX;
            this.modalStyle.sty = event.screenY;
            return;
        }

        let x: number = event.screenX - this.modalStyle.stx;
        let y: number = event.screenY - this.modalStyle.sty;

        this.bodyElement.nativeElement.style.marginTop = (y + this.modalStyle.y) + 'px';
        this.bodyElement.nativeElement.style.marginLeft = (x + this.modalStyle.x) + 'px';
    }

}