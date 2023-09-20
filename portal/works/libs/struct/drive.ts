import Project from './project';

export default class Drive {
    constructor(public project: Project) { }

    public status: boolean = false;
    public current: any = null;
    public percent: number = 0;
    public queue: any = [];

    public async run() {
        if (this.status) return;
        if (this.queue.length == 0) {
            await this.project.service.render();
            return;
        }

        this.status = true;
        while (this.queue.length > 0) {
            let { file, node } = this.queue.splice(0, 1)[0];
            this.current = file.name;
            let fd = new FormData();
            let filepath = [file.filepath];
            fd.append('file[]', file);
            fd.append('path', JSON.stringify(filepath));

            let url = this.project.url('drive/upload/' + node.id);
            await this.project.service.file.upload(url, fd, async (percent: number) => {
                this.percent = percent;
                await this.project.service.render();
            });
            await node.refresh();
        }

        this.status = false;
        await this.run();
    }

    public async regist(node: any, files: any) {
        for (let i = 0; i < files.length; i++)
            this.queue.push({ file: files[i], node: node });
        await this.run();
    }

}