import { Injectable } from '@angular/core';
import Display from './struct/display';
import UIStat from './struct/uistat';
import Content from './struct/content';
import Access from './struct/access';

import ClassicEditor from '../season/ckeditor/ckeditor';
import $ from "jquery";

@Injectable({ providedIn: 'root' })
export class WikiBook {
    constructor() {
        this.display = new Display(this);
        this.uistat = new UIStat(this);
    }

    public service: any;
    public cache: any = {};

    public display: Display;
    public uistat: UIStat;
    public content: Content;
    public access: Access;

    public async bind(service: any) {
        this.service = service;
    }

    public async init(namespace: any = null) {
        this.cache = { visibility: 'private' };
        this.content = new Content(this);
        this.access = new Access(this);

        if (namespace) {
            this.cache.namespace = namespace;
            await this.load();
        }
    }

    public data() {
        return this.cache;
    }

    public id() {
        if (this.cache.id) return this.cache.id;
        return this.cache.namespace;
    }

    public status() {
        return this.cache.id != null;
    }

    public accessLevel(allowed: any = []) {
        let role: any = this.cache.role;
        if (allowed.includes(role)) return true;
        return false;
    }

    public async api(uri: string, data: any = {}) {
        let book_id = this.id();
        if (!book_id)
            return { code: 404, data: {} };
        let url = `/api/wiki/book/${book_id}/${uri}`;
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

    public async load() {
        const { code, data } = await this.api("load");
        if (code != 200) return;

        this.cache = data;
        if (!this.cache.extra) this.cache.extra = {};
    }

    public async update() {
        let pd = this.data();
        return await this.api("update", { data: JSON.stringify(pd) });
    }

    public async attachment(accept: any = null, multiple: boolean = true, max_file: number = -1, callback: any = null) {
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
            let url = `/api/wiki/attachment/upload/${this.id()}/${filepath}`;
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

    public attachmentUrl() {
        return `/api/wiki/attachment/upload/${this.id()}`;
    }

    public downloadUrl(fileid: string, filename: string) {
        return `/api/wiki/attachment/download/${this.id()}/${fileid}/${filename}`;
    }

    public async bindEditor(element: any, readOnly: boolean = false) {
        if ($(element).parent().find(".ck-content").length > 0) return null;
        let currentDp = $(element).parent().css("display");
        let uploadUrl = this.attachmentUrl();

        $(element).parent().css("display", "none");

        let toolbar = 'heading | bold italic strikethrough underline | blockQuote code | bulletedList numberedList | outdent indent | uploadImage insertTable link codeBlock horizontalLine'.split(' ');
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
}

export default WikiBook;