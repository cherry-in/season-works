import { OnInit } from "@angular/core";
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

import moment from 'moment';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    public socket: any = null;

    @ViewChild('issuelist')
    public issueListElement: ElementRef;

    public async ngOnInit() {
        await this.service.init();
        await this.service.auth.init();
        await this.service.auth.allow(true, '/explore/project');
        await this.service.render();

        this.socket = wiz.app("portal.works.project.issueboard").socket();

        this.socket.on("connect", async () => {
            await this.load(false);
        });

        this.socket.on("updated", async () => {
            await this.load(false);
        });

        this.socket.on("message", async (data: any) => {
            let issue_id: any = data.issue_id;
            let ud = this.issue.event.getData();
            for (let key in this.items[issue_id]) {
                if (ud[key])
                    this.items[issue_id][key] = ud[key];
            }
            this.items[issue_id].unread = true;

            if (this.issue.id == issue_id)
                if (this.issue.event.messages)
                    await this.issue.event.messages(data);

            await this.service.render();
        });
    }

    public async ngOnDestroy() {
        this.socket.close();
    }

    public displayColor(issue: any) {
        if (!issue) return '';
        if (issue.status == 'close' || issue.status == 'cancel') return 'bg-secondary-lt';
        if (issue.status == 'finish') return 'bg-teal-lt';
        if (issue.planend) {
            try {
                let endtime = new Date(issue.planend).getTime();
                let now = new Date().getTime();
                if (now - endtime > 1000 * 60 * 60 * 24)
                    return 'bg-red-lt';
            } catch (e) {
            }
        }
        return '';
    }

    public displayDate(date: any) {
        let targetdate = moment(date);
        let diff = new Date().getTime() - new Date(targetdate).getTime();
        diff = diff / 1000 / 60 / 60;
        if (diff > 24) return targetdate.format("M월 D일");
        if (diff > 1) return Math.floor(diff) + "시간전"
        diff = diff * 60;
        if (diff < 2) return "방금전";
        return Math.floor(diff) + "분전";
    }

    public displayStatus(status: any) {
        if (status == 'noti') return { text: "공지/알림", cls: 'bg-secondary-lt' };
        if (status == 'open') return { text: "대기", cls: 'bg-secondary-lt' };
        if (status == 'work') return { text: "진행", cls: 'bg-lime-lt' };
        if (status == 'close') return { text: "종료", cls: 'bg-red-lt' };
        if (status == 'cancel') return { text: "취소", cls: 'bg-red-lt' };
        return { text: "완료", cls: 'bg-red-lt' };
    }

    public tab: string = 'list';
    public category: string = 'request';
    public searchText: any = '';
    public page: number = 1;
    public isLoading: boolean = false;
    public isLast: boolean = false;

    public list: any = [];
    public items: any = {}
    public users: any = {};

    public issue: any = {
        id: null,
        modal: false,
        event: {}
    };

    public async load(clear: boolean = false, page: number = null, category: any = null) {
        if (this.isLoading) return;

        this.isLoading = true;
        if (clear) {
            this.list = [];
            this.items = {};
            this.isLast = false;
        }

        if (page === null) page = this.page;
        if (category === null) category = this.category;
        this.page = page;
        this.category = category;

        await this.service.render();

        let res = await wiz.call("search", { category: category, page: page });
        this.isLast = res.data.isLast;

        for (let i = 0; i < res.data.issues.length; i++) {
            if (!this.list.includes(res.data.issues[i].id))
                this.list.push(res.data.issues[i].id);
            this.items[res.data.issues[i].id] = res.data.issues[i];
        }

        for (let key in res.data.users)
            this.users[key] = res.data.users[key];

        this.list.sort((a, b) => {
            a = this.items[a];
            b = this.items[b];
            if (!a || !b) return;
            return new Date(b.updated).getTime() - new Date(a.updated).getTime();
        });

        this.isLoading = false;
        await this.service.render();

        if (this.list.length > 0 && !this.issue.id) {
            await this.openIssue(this.getIssue(this.list[0]), true);
        }

        if (this.isReloadIssue())
            await this.load(false, page + 1, category);
    }

    public async changed() {
        if (this.isReloadIssue())
            await this.load(false, this.page + 1);
    }

    public getIssue(issueId: string) {
        return this.items[issueId];
    }

    public getUserInfo(key: string) {
        if (this.users[key]) return this.users[key];
        return {};
    }

    public async clearIssue() {
        this.issue = {
            id: null,
            modal: false,
            loaded: false,
            event: {}
        };
        this.tab = 'list';
        await this.service.render();
    }

    public async openIssue(issue: any, onInit: boolean = false) {
        await this.clearIssue();

        let prev = this.project.id();
        if (prev) this.socket.emit("leave", { project_id: prev });
        await this.project.init(issue.project_id);
        this.socket.emit("join", { project_id: this.project.id() });

        this.issue.id = issue.id;
        this.issue.event = {};
        this.issue.event.hide = this.clearIssue.bind(this);
        this.issue.event.onLoad = (async () => {
            this.issue.loaded = true;
            await this.service.render();
        }).bind(this);
        this.issue.modal = false;
        this.issue.parent = this;
        if (!onInit)
            this.tab = 'issue';

        issue.unread = false;
        await this.service.render();
    }

    public match(item: any) {
        try {
            if (item.title.toLowerCase().includes(this.searchText.toLowerCase())) return true;
        } catch (e) {
        }
        try {
            if (item.project.title.toLowerCase().includes(this.searchText.toLowerCase())) return true;
        } catch (e) {
        }
        try {
            if (this.displayStatus(item.status).text.toLowerCase().includes(this.searchText.toLowerCase())) return true;
        } catch (e) {
        }
        return false;
    }

    public isReloadIssue() {
        let target = this.issueListElement.nativeElement;
        let top: number = target.scrollTop;
        let offset: number = target.scrollHeight - target.offsetHeight - 300;
        return top > offset && !this.isLast;
    }

    public async onScrollIssue() {
        if (this.isReloadIssue())
            await this.load(false, this.page + 1);
    }
}