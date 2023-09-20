import WikiBook from './book';

export default class Access {
    constructor(public wikibook: WikiBook) { }

    public map: any = {};
    public cache: any = [];

    public list() {
        return this.cache;
    }

    public async load() {
        let { code, data } = await this.wikibook.api("access/load");
        if (code == 200) {
            this.cache = data;
            this.map = {};
            for (let i = 0; i < this.cache.length; i++) {
                let key = this.cache[i].user;
                this.map[key] = this.cache[i].meta;
            }
        }
        return { code, data };
    }

    public async create(user: string, role: string) {
        let { code, data } = await this.wikibook.api("access/create", { key: user, role, type: 'user' });
        return { code, data };
    }

    public async remove(query: any) {
        let { code, data } = await this.wikibook.api("access/remove", query);
        return { code, data };
    }

    public async update(query: any) {
        let { code, data } = await this.wikibook.api("access/update", query);
        return { code, data };
    }

}