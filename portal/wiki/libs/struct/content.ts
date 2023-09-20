import WikiBook from './book';

export default class Content {
    constructor(public wikibook: WikiBook) { }

    public node: any = null;
    public cache: any = {};
    public _revisions: any = {};
    public contentType: string;
    public pageName: any;
    public _event: any = {
        load: [],
        update: []
    };

    public async load(content_id: string) {
        this.pageName = content_id;
        this.contentType = "content";
        if (content_id == 'setting')
            this.contentType = 'setting';

        let data = {};
        if (this.contentType == 'content') {
            let res = await this.wikibook.api(`content/load/${content_id}`);
            data = res.data;
            await this.loadRevisions(content_id);
        }

        this.cache = data;
        await this.wikibook.service.render();
        await this.event(`load`);
    }

    public async loadRevisions(content_id: string) {
        let res = await this.wikibook.api(`revision/load/${content_id}`);
        this._revisions = res.data;
    }

    public async loadRevision(revision_id: string) {
        let res = await this.wikibook.api(`revision/read/${revision_id}`);
        return res.data ? res.data.content : '';
    }

    public data() {
        return this.cache;
    }

    public revisions() {
        return this._revisions;
    }

    public is(contentType: string) {
        return this.contentType == contentType;
    }

    public async event(eventname: string) {
        for (let i = 0; i < this._event[eventname].length; i++)
            await this._event[eventname][i](this.data());
    }

    public async bind(eventname: string, fn) {
        if (!this._event[eventname]) return;
        this._event[eventname].push(fn);
    }

    public async unbind(eventname: string, fn) {
        if (!this._event[eventname]) return;
        this._event[eventname].remove(fn);
    }

    public async update() {
        let data = this.data();
        data.home = this.pageName;
        let res = await this.wikibook.api(`content/update`, data);

        if (res.code == 200) {
            let content_id = res.data;
            if (!this.data().id) {
                if (this.pageName == 'home') {
                    await this.load(content_id);
                } else {
                    this.wikibook.service.href(`/wiki/${this.wikibook.data().namespace}/${content_id}`);
                    return true;
                }
            }

            await this.event(`update`);
            return true;
        }

        return false;
    }

    public async commit() {
        let data = this.data();
        await this.wikibook.api(`revision/commit/${data.id}`);
        await this.loadRevisions(data.id);
    }

}