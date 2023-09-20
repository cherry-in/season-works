import { OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

import moment from 'moment';

const BASE_CONTENT = `<h3>회의목적</h3>
<blockquote>~ 를 위한 ~ 회의</blockquote>
<hr>
<h3>회의참석자</h3>
<ul>
    <li>소속1: 참석자1, 참석자2, 참석자3</li>
    <li>소속2: 참석자4, 참석자5</li>
</ul>
<hr>
<h3>주요안건</h3>
<ul>
    <li>안건 1</li>
    <li>안건 2</li>
    <li>안건 3</li>
</ul>
<hr>
<h3>회의내용</h3>
<p>회의 내용을 작성해주세요</p>`;

export class Component implements OnInit, OnDestroy {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    @ViewChild('editor')
    public editorElement: ElementRef;

    public NAMESPACE: string = "meeting:";

    public editor: any;
    public editorLoaded: boolean = false;
    public readOnly: boolean = true;
    public isUpdate: boolean = false;

    public socket: any = null;
    public socketStatus: boolean = true;
    public list: any = [];
    public selected: any = {};
    public versions: any = [];
    public uploading: any = null;

    public shortcuts: any = [];
    public query: any = {
        text: ''
    };

    public async ngOnInit() {
        await this.service.init();

        this.readOnly = !this.project.accessLevel(['admin', 'manager', 'user']);
        this.socket = wiz.socket();

        this.socket.on("connect", async () => {
            if (this.socketStatus == false) {
                await this.load();
                await this.select(this.selected);
                this.socketStatus = true;
            }
        });

        this.socket.on("disconnect", async () => {
            this.socketStatus = false;
        });

        this.socket.on("update", async (message: any) => {
            if (this.isUpdate) return;
            if (!this.isEditable()) return;
            await this.select(this.selected);
        });

        await this.load();

        this.shortcuts = [
            {
                name: "save",
                key: ["cmd + s", "ctrl + s"],
                preventDefault: true,
                command: async () => {
                    await this.update();
                    return false;
                }
            }
        ];
    }

    public async ngOnDestroy() {
        this.socket.close();
    }

    public tab: string = 'list';

    public async switchTab(tab: string) {
        this.tab = tab;
        await this.service.render();
    }

    public async alert(title: string, message: string, action: string = '확인', cancel: any = '닫기') {
        return await this.service.alert.show({
            title: title,
            message: message,
            cancel: cancel,
            actionBtn: 'error',
            action: action,
            status: 'error'
        });
    }

    public async call(action: string, pd: any = {}) {
        pd.project_id = this.project.id();
        return await wiz.call(action, pd);
    }

    public isEditable() {
        if (this.readOnly) return false;
        if (!this.selected.id) return true;
        return this.selected.isEditable;
    }

    public async buildEditor() {
        let item = this.selected;
        let changable = ['meetdate', 'meetdate_day', 'meetdate_time', 'title', 'content', 'updated', 'isEditable']
        if (item.version == 'latest') {
            let res = await this.call("read", item);
            let data = res.data.data;
            data.meetdate_day = moment(data.meetdate).format("YYYY-MM-DD");
            data.meetdate_time = moment(data.meetdate).format("HH:mm");
            for (let key of changable)
                if (data[key] !== undefined)
                    this.selected[key] = data[key];
            this.selected.isEditable = res.data.isEditable;
        } else if (item.version) {
            let res = await this.call("readVersion", item);
            let data = res.data.data;
            data.meetdate_day = moment(data.meetdate).format("YYYY-MM-DD");
            data.meetdate_time = moment(data.meetdate).format("HH:mm");
            for (let key of changable)
                if (data[key] !== undefined)
                    this.selected[key] = data[key];
            this.selected.isEditable = res.data.isEditable;
        }

        this.editorLoaded = false;
        await this.service.render();
        this.editorLoaded = true;
        await this.service.render();

        if (!this.editorElement) return;

        let editor = await this.project.bindEditor(this.editorElement.nativeElement, false, !this.isEditable());
        if (editor) this.editor = editor;

        editor.keystrokes.set('Ctrl+S', async (event, cancel) => {
            event.preventDefault();
            await this.update();
        }, { priority: 'high' });

        this.editor.data.set(this.selected.content);

        if (this.isEditable()) {
            let lastChanged = new Date().getTime();

            editor.model.document.on('change', async () => {
                if (!this.selected.id) return;
                if (editor.model.document.differ.getChanges().length == 0) return;
                lastChanged = new Date().getTime();
                await this.service.render(1000);
                let now = new Date().getTime();
                if (now - lastChanged < 1000) return;
                await this.update(false);
            });
        }
    }

    public async load(refresh: boolean = true) {
        const { data } = await this.call("search", this.query);
        this.list = data;
        if (this.selected && !this.selected.id)
            refresh = true;

        if (refresh) {
            if (this.list.length > 0)
                await this.select(this.list[0]);
            else
                await this.create();
        }
        await this.service.render();
    }

    public async select(item: any) {
        if (this.selected.id)
            this.socket.emit("leave", { meeting_id: this.selected.id });

        let res = await this.call("read", item);
        let { data, isEditable, versions } = res.data;
        this.versions = versions;
        data.isEditable = isEditable;
        data.meetdate_day = moment(data.meetdate).format("YYYY-MM-DD");
        data.meetdate_time = moment(data.meetdate).format("HH:mm");
        data.version = 'latest';
        this.selected = data;
        if (this.selected.id)
            this.socket.emit("join", { meeting_id: this.selected.id });
        this.NAMESPACE = "meeting:" + this.selected.id;
        await this.buildEditor();
        await this.service.render();
        await this.switchTab("item");
    }

    public async create() {
        this.selected = {
            title: "새로운 회의",
            meetdate_day: moment().format("YYYY-MM-DD"),
            attachment: [],
            meetdate_time: '10:00',
            content: BASE_CONTENT
        };

        await this.buildEditor();
        await this.service.render();
    }

    public async update(toast: boolean = true) {
        if (!this.isEditable())
            return;

        let item = JSON.parse(JSON.stringify(this.selected));
        item.content = this.editor.data.get();
        item.attachment = JSON.stringify(item.attachment);

        if (item.meetdate_day && item.meetdate_time)
            item.meetdate = item.meetdate_day + ' ' + item.meetdate_time;
        else if (item.meetdate_day)
            item.meetdate = item.meetdate_day;

        if (item.title.length > 48) item.title = item.title.substring(0, 48);
        if (item.title.length == 0) item.title = '제목없음';

        this.isUpdate = true;
        const { code, data } = await this.call("update", item);

        if (code == 200 || code == 201) {
            if (toast)
                this.service.toast.success('저장되었습니다');
        } else {
            await this.alert("Error", "저장중 오류가 발생했습니다", false, '닫기');
        }

        if (!item.id)
            await this.select(data);

        await this.load(false);
        this.isUpdate = false;
    }

    public async onChange() {
        if (!this.selected.id) return;
        await this.update(false);
    }

    public async revision() {
        if (!this.isEditable())
            return;

        let res = await this.service.alert.show({
            title: '리비전 생성',
            message: '현재 상태를 저장한 후 리비전을 생성합니다.',
            cancel: '취소',
            actionBtn: 'success',
            action: '확인',
            status: 'success'
        });
        if (!res) return;
        await this.update(false);
        await this.call("revision", { id: this.selected.id });
        await this.select(this.selected);
    }

    public async delete() {
        let res = await this.alert('회의록 삭제', '삭제된 목록 보기를 통해 다시 불러올 수 있습니다. 정말 삭제하시겠습니까?', '삭제', '취소');
        if (!res) return;
        await this.call("delete", { id: this.selected.id });
        await this.load();
    }

    public displayDate(date) {
        let targetdate = moment(date);
        let diff = new Date().getTime() - new Date(targetdate).getTime();
        diff = diff / 1000 / 60 / 60;
        if (diff > 24) return targetdate.format("YYYY-MM-DD");
        if (diff > 1) return Math.floor(diff) + "시간전"
        diff = diff * 60;
        if (diff < 2) return "방금전";
        return Math.floor(diff) + "분전";
    }

    public async upload() {
        if (this.readOnly) return;
        let filetype = 'file';
        let accept: any = filetype == 'image' ? 'image/*' : null;
        let multiple: boolean = true;
        let ns = "meeting.attachment:" + this.selected.id;

        let res = await this.project.attachment(ns, accept, multiple, async (fi: number, flength: number, ui: number, ut: number) => {
            this.uploading = {};
            this.uploading.index = fi;
            this.uploading.total = flength;
            this.uploading.process = ui * 100 / ut;
            await this.service.render();
        });

        for (let i = 0; i < res.data.length; i++) {
            this.selected.attachment.push(res.data[i]);
        }

        let errormsg = [];
        for (let i = 0; i < res.error.length; i++)
            errormsg.push(res.error[i].filename);

        if (errormsg.length > 0) {
            await this.alert(`${errormsg.join(", ")} 파일 업로드 중 오류가 발생했습니다.`, "파일 업로드 오류", "error", "확인", false);
        }

        this.uploading = null;
        await this.service.render();
        await this.update(false);
    }

    public async removeAttachment(file: any) {
        if (this.readOnly) return;
        this.selected.attachment.remove(file);
        await this.service.render();
        await this.update(false);
    }

}