import Project from './project';

export default class Plan {
    constructor(public project: Project) { }

    public cache: any = [];

    public data() {
        return this.cache;
    }

    public async load() {
        let { code, data } = await this.project.api("plan/load");
        if (code == 200)
            this.cache = data;
        return { code, data };
    }

    public async update() {
        let query = this.data();
        let { code, data } = await this.project.api("plan/update", { data: JSON.stringify(query) });
        return { code, data };
    }
}