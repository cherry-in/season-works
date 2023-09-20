import Project from './project';

export default class Member {
    constructor(public project: Project) { }

    public map: any = {};
    public cache: any = [];

    public list() {
        return this.cache;
    }

    public async load() {
        let { code, data } = await this.project.api("member/load");
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
        let { code, data } = await this.project.api("member/create", { user, role });
        return { code, data };
    }

    public async remove(user: string) {
        let { code, data } = await this.project.api("member/remove", { user });
        return { code, data };
    }

    public async update(user: string, role: string) {
        let { code, data } = await this.project.api("member/update", { user, role });
        return { code, data };
    }

}