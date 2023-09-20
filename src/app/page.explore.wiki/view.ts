import { OnInit } from "@angular/core";
import { Service } from '@wiz/libs/portal/season/service';
import { WikiBook } from '@wiz/libs/portal/wiki/book';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project,
        public wikibook: WikiBook
    ) { }

    public list: any = [];

    public search: any = {
        page: 1,
        text: '',
        range: 'join'
    };

    public pagenation: any = {
        end: -1,
        start: -1,
    };

    public loaded: boolean = false;

    public async ngOnInit() {
        this.project.prev = null;
        await this.service.init();
        await this.service.auth.init();
        await this.service.auth.allow();
        await this.project.revert();
        await this.service.render();
        await this.load();
    }

    public async alert(message: string, status: any = "error", action: string = '확인', cancel: any = false) {
        return await this.service.alert.show({
            title: '',
            message: message,
            cancel: cancel,
            actionBtn: status,
            action: action,
            status: status
        });
    }

    public async load(page: number = 1) {
        this.loaded = false;
        this.list = [];
        await this.service.render();
        const { code, data } = await wiz.call("search", this.search);
        if (code != 200) return;
        let { rows, lastpage } = data;
        const startpage = Math.floor((page - 1) / 10) * 10 + 1;
        this.search.page = page;
        this.list = rows;
        this.pagenation.start = startpage;
        this.pagenation.end = lastpage;
        this.loaded = true;
        await this.service.render();
    }

    public displayDate(date: any) {
        let strdate = (date + "").substring(0, 10);
        if (strdate == '0000-00-00')
            return "미지정";
        return strdate;
    }

    public newProject: boolean = false;

    public async createProject() {
        await this.service.loading.show();
        await this.wikibook.init();
        this.newProject = true;
        await this.service.render();
        await this.service.loading.hide();
    }

    public async createBook() {
        let info = this.wikibook.data();
        if (!info.title || info.title.length < 3) return await this.alert("3글자 이상의 프로젝트명을 입력해주세요")
        if (!info.namespace || info.namespace.length < 3) return await this.alert("3글자 이상의 Namespace를 입력해주세요")
        let check = /^[a-z0-9.]+$/.test(info.namespace);
        if (!check) return await this.alert("Namespace는 영어 또는 . 만 사용할 수 있습니다");

        const { code, data } = await wiz.call("create", { data: JSON.stringify(info) });
        if (code != 200) return await this.alert(data);
        await this.alert('위키가 생성되었습니다.', 'success');
        this.service.href("/wiki/" + info.namespace);
    }

    public async closeCreateBookModal() {
        this.newProject = false;
        await this.service.render();
    }

}