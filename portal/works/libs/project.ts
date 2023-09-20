import { Injectable } from '@angular/core';
import Display from './struct/display';
import Drive from './struct/drive';
import Member from './struct/member';
import Plan from './struct/plan';

import ClassicEditor from '../season/ckeditor/ckeditor';
import $ from "jquery";

@Injectable({ providedIn: 'root' })
export class Project {
    constructor() {
        this.display = new Display(this);
    }

    public prev: any;
    public service: any;
    public display: Display;
    public drive: Drive;
    public cache: any = {};
    public member: Member;
    public plan: Plan;
    public isLoaded: boolean = false;

    public async bind(service: any) {
        this.service = service;
    }

    public async init(project_id: string) {
        this.isLoaded = false;
        this.cache = { namespace: project_id };
        this.member = new Member(this);
        this.plan = new Plan(this);
        this.drive = new Drive(this);
        await this.load();
        this.prev = this.data().namespace;
        document.title = this.data().title;
        this.isLoaded = true;
        await this.service.render();
    }

    public async load() {
        const { data } = await this.api("load");
        this.cache = data;
        if (!this.cache.extra) this.cache.extra = {};
        if (!this.cache.extra.goal) this.cache.extra.goal = [];
        if (!this.cache.extra.doc) this.cache.extra.doc = "";
        if (!this.cache.extra.main) this.cache.extra.main = "info";
        if (!this.cache.extra.menu) this.cache.extra.menu = {
            plan: true, meeting: true, issueboard: true, wiki: true, drive: true
        };
        if (this.cache.extra.menu.plan == null) this.cache.extra.menu.plan = true;
        if (this.cache.extra.menu.meeting == null) this.cache.extra.menu.meeting = true;
        if (this.cache.extra.menu.issueboard == null) this.cache.extra.menu.issueboard = true;
        if (this.cache.extra.menu.wiki == null) this.cache.extra.menu.wiki = true;
        if (this.cache.extra.menu.drive == null) this.cache.extra.menu.drive = true;
        if (this.cache.start) this.cache.start = (this.cache.start + '').substring(0, 10);
        if (this.cache.end) this.cache.end = (this.cache.end + '').substring(0, 10);
        await this.member.load();
        await this.plan.load();
    }

    public id() {
        if (this.cache.id) return this.cache.id;
        return this.cache.namespace;
    }

    public data() {
        return this.cache;
    }

    public status() {
        return this.cache.id != null;
    }

    public accessLevel(allowed: any = []) {
        let role: any = this.cache.role;
        if (allowed.includes(role)) return true;
        return false;
    }

    public async update() {
        let pd = this.data();
        return await this.api("update", { data: JSON.stringify(pd) });
    }

    public async untrack(status: boolean) {
        await this.api("untrack", { status: status });
        this.cache.userconfig_untrack = status;
        await this.service.render();
    }

    public url(uri: string) {
        let project_id = this.id();
        let url = `/api/works/project/${project_id}/${uri}`;
        return url;
    }

    public async api(uri: string, data: any = {}) {
        let project_id = this.id();
        if (!project_id)
            return { code: 404, data: {} };
        let url = `/api/works/project/${project_id}/${uri}`;
        let request = () => {
            return new Promise((resolve) => {
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data
                }).always(function (res) {
                    resolve(res);
                });
            });
        }
        try {
            let { code, data } = await request();
            return { code, data }
        } catch (e) {
            return { code: 500, data: e };
        }
    }

    public async attachment(namespace: any, accept: any = null, multiple: boolean = true, max_file: number = -1, callback: any = null) {
        let files = await this.service.file.select({ accept, multiple });
        if (max_file > 0 && files.length > max_file)
            return false;
        let res = [];
        let error = [];
        for (let i = 0; i < files.length; i++) {
            let fd = new FormData();
            if (!files[i].filepath) files[i].filepath = files[i].name;
            fd.append('upload', files[i]);
            let filepath = files[i].filepath;
            let url = `/api/works/attachment/upload/${this.id()}/${namespace}/${filepath}`;
            const data = await this.service.file.upload(url, fd, async (percent: number, total: number, position: number) => {
                if (callback)
                    await callback(i + 1, files.length, position, total);
            });
            if (data.code != 200) {
                data.filename = filepath;
                error.push(data);
            } else {
                delete data.url;
                delete data.code;
                res.push(data);
            }
        }
        return { data: res, error: error };
    }

    public attachmentUrl(namespace: string) {
        return `/api/works/attachment/upload/${this.id()}/${namespace}`;
    }

    public downloadUrl(fileid: string, filename: string) {
        return `/api/works/attachment/download/${this.id()}/${fileid}/${filename}`;
    }

    public thumbnailUrl(fileid: string, filename: string) {
        return `/api/works/attachment/thumbnail/${this.id()}/${fileid}/${filename}`;
    }

    public async bindEditor(element: any, tiny: boolean = false, readOnly: boolean = false) {
        if ($(element).parent().find(".ck-content").length > 0) return;
        let currentDp = $(element).parent().css("display");
        let ns = $(element).attr("namespace");
        let uploadUrl = this.attachmentUrl(ns);

        $(element).parent().css("display", "none");

        let toolbar = 'heading | bold italic strikethrough underline | blockQuote code | bulletedList numberedList | outdent indent | uploadImage insertTable link codeBlock horizontalLine'.split(' ');
        if (tiny) toolbar = 'bold italic strikethrough underline | bulletedList numberedList | blockQuote code codeBlock'.split(' ');

        let editor = await ClassicEditor.create(element, {
            toolbar: {
                items: toolbar,
                shouldNotGroupWhenFull: true
            },
            removePlugins: ["MediaEmbedToolbar"],
            table: ClassicEditor.defaultConfig.table,
            simpleUpload: {
                uploadUrl: uploadUrl
            }
        });

        if (readOnly) {
            const toolbarElement = editor.ui.view.toolbar.element;
            toolbarElement.style.display = 'none';
            editor.isReadOnly = true;
        }

        $(element).parent().css("display", currentDp);

        return editor;
    }

    public menuLink(menu: string) {
        return `/project/${this.data().namespace}/${menu}`;
    }

    public async revert() {
        this.prev = null;
        this.cache = {};
        document.title = '시즌웍스';
    }
}

export default Project;