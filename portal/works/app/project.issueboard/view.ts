import { OnInit, OnDestroy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';

export class Component implements OnInit, OnDestroy {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    @ViewChild('container')
    public workspace: ElementRef;

    public socket: any = null;
    public labels: any = [];

    public readOnly: boolean = true;

    public cache: any = {
        label: '',
        loaded: false,
        issues: {},
        hiddenIssues: {}
    };

    public issue: any = {
        id: null,
        modal: false,
        event: {}
    };

    public config: any = {
        labelSorted: {
            animation: 0,
            handle: '.btn-action-move'
        },
        issueSorted: {
            animation: 0,
            handle: '.card',
            group: 'issue'
        }
    };

    public async alert(message: string, title: any = "", status: any = "error", action: string = '확인', cancel: any = false) {
        return await this.service.alert.show({
            title: title,
            message: message,
            cancel: cancel,
            actionBtn: status,
            action: action,
            status: status
        });
    }

    public async ngOnInit() {
        let self = this;
        this.config.issueSorted.onEnd = this.config.labelSorted.onEnd = async () => {
            let labels = self.labels;
            await self.updateLabels(labels);

            for (let i = 0; i < labels.length; i++) {
                let label = labels[i];

                for (let j = 0; j < label.issues.length; j++) {
                    let issueId = label.issues[j];
                    if (!this.cache.issues[issueId]) continue;
                    if (!this.cache.issues[issueId].label_id) continue;
                    if (label.id != this.cache.issues[issueId].label_id) {
                        let pd = {};
                        pd.issue_id = this.cache.issues[issueId].id;
                        pd.label_id = label.id;
                        this.pendingUpdateIssues.push(pd);
                        this.cache.issues[issueId].label_id = label.id;
                    }
                }
            }

            await this.updateIssueLabels();
        }

        this.readOnly = !this.project.accessLevel(['admin', 'manager', 'user']);
        if (this.readOnly) {
            this.config.labelSorted.handle = '.no-drag';
            this.config.issueSorted.handle = '.no-drag';
        }

        await this.service.init();
        await this.project.member.load();

        this.socket = wiz.socket();

        this.socket.on("connect", async () => {
            this.socket.emit("join", { project_id: this.project.id() });
        });

        this.socket.on("label", async () => {
            await this.load();
        });

        this.socket.on("issue", async (issue_id: any) => {
            delete this.cache.issues[issue_id];
            if (this.issue.id == issue_id)
                if (this.issue.event.update)
                    await this.issue.event.update();
            await this.load();
        });

        this.socket.on("message", async (data: any) => {
            let issue_id: any = data.issue_id;
            if (this.issue.id == issue_id)
                if (this.issue.event.messages)
                    await this.issue.event.messages(data);
            await this.service.render();
        });

        await this.load();
    }

    public async ngOnDestroy() {
        this.socket.close();
    }

    public async start() {
        await this.service.loading.show();
        await this.addLabel("TODO");
        await this.addLabel("작업중");
        await this.addLabel("검증중");
        await this.addLabel("완료됨");
        await this.addLabel("미분류", 1);
        await this.service.loading.hide();
    }

    public async load() {
        const { data } = await wiz.call("load", { project_id: this.project.id() });
        this.labels = [];
        for (let i = 0; i < data.length; i++)
            this.labels.push(data[i]);
        await this.sortLabel();
        this.cache.loaded = true;
        await this.service.render();
    }

    public hiddenIssues(label_id: string, status: string, as_object: boolean = false) {
        try {
            let obj = this.cache.hiddenIssues[label_id][status];
            if (as_object) return obj ? obj : {};
            if (!obj.issues) return [];
            return obj.issues;
        } catch {
        }
        return [];
    }

    public async search(status: string, label: any, clear: boolean = false) {
        let query = { project_id: this.project.id() };

        let label_id = label.id;

        if (!this.cache.hiddenIssues[label_id])
            this.cache.hiddenIssues[label_id] = {};
        if (!this.cache.hiddenIssues[label_id][status])
            this.cache.hiddenIssues[label_id][status] = { page: 0, isLastPage: false, issues: [] };

        let obj = this.cache.hiddenIssues[label_id][status];

        if (clear) {
            if (obj.page > 0) {
                obj.page = 0;
                obj.isLastPage = false;
                obj.issues = [];
                await this.service.render();
                return;
            }
        }

        obj.page++;

        if (label.mode != 1) query.label_id = label.id;
        query.page = obj.page;
        query.status = status;

        const { code, data } = await wiz.call("search", query);
        if (code != 200) return;
        let { rows, lastpage } = data;

        if (obj.page == lastpage) {
            obj.isLastPage = true;
        }

        for (let i = 0; i < rows.length; i++) {
            if (obj.issues.includes(rows[i])) continue;
            obj.issues.push(rows[i]);
        }

        await this.service.render();
    }

    public async loadClosed(label: any, clear: boolean = false) {
        await this.search("close", label, clear);
    }

    public async loadCanceled(label: any, clear: boolean = false) {
        await this.search("cancel", label, clear);
    }

    public async sortLabel() {
        this.labels.sort((a, b) => {
            let modediff = a.mode - b.mode;
            if (modediff != 0) return modediff;
            return a.order - b.order;
        });
        await this.service.render();
    }

    public async addLabel(title: string, mode: number = 0) {
        if (!title) return;
        this.cache.label = "";

        let obj = {
            title, mode,
            order: this.labels.length + 1,
            project_id: this.project.id()
        };

        await wiz.call("addLabel", obj);
    }

    public async removeLabel(item: any) {
        if (item.mode == 1) return;
        let res = await this.alert(`'${item.title}' 라벨을 정말로 삭제하시겠습니까? 삭제된 라벨의 이슈는 미분류 항목으로 이동됩니다.`, "라벨 삭제", "error", "삭제", "취소");
        if (!res) return;
        const { code } = await wiz.call("removeLabel", item);
        if (code !== 200) return;
        this.labels.remove(item);
        await this.service.render();
    }

    public async updateLabels(items: any) {
        for (let i = 0; i < items.length; i++)
            items[i].order = i + 1;
        await wiz.call("updateLabels", { project_id: this.project.id(), data: JSON.stringify(items) });
    }

    public async addIssue(label: any) {
        await this.openIssue("new", label);
        await this.service.render();
    }

    public async openIssue(issueId: number | string = "new", label: any = null) {
        this.issue.id = issueId;
        this.issue.event = {};
        this.issue.modal = true;
        if (!label)
            label = this.labels[this.labels.length - 1];
        this.issue.label_id = label.id;
        this.issue.label = label;
        this.issue.parent = this;
        await this.service.render();
    }

    public pendingUpdateIssues: any = [];
    public isUpdateIssueLabel: boolean = false;
    public pendingIssues: any = [];
    public isLoadingIssue: boolean = false;

    public isLoadedIssue(issueId: any) {
        if (this.cache.issues[issueId])
            return true;

        this.loadIssue(issueId);
        return false;
    }

    public async updateIssueLabels() {
        if (this.isUpdateIssueLabel) return;
        this.isUpdateIssueLabel = true;

        let data = [];
        for (let i = 0; i < this.pendingUpdateIssues.length; i++) data.push(this.pendingUpdateIssues[i]);
        await wiz.call("updateIssue", { project_id: this.project.id(), data: JSON.stringify(data) });
        for (let i = 0; i < data.length; i++) this.pendingUpdateIssues.remove(data[i]);

        this.isUpdateIssueLabel = false;
        if (this.pendingUpdateIssues.length > 0)
            return this.updateIssueLabels();
    }

    public onProcessIssue(issue: any) {
        if (!issue) return true;
        return ["open", "work", "finish", "noti"].includes(issue.status);
    }

    public async loadIssue(issueId: any) {
        if (!this.pendingIssues.includes(issueId))
            this.pendingIssues.push(issueId);
        if (this.isLoadingIssue)
            return;

        this.isLoadingIssue = true;

        let issueIds = JSON.stringify(this.pendingIssues);
        let { data } = await wiz.call("loadIssues", { project_id: this.project.id(), issueIds: issueIds });
        for (let i = 0; i < data.length; i++) {
            this.cache.issues[data[i].id] = data[i];
            this.pendingIssues.remove(data[i].id);
        }

        this.isLoadingIssue = false;
        await this.service.render();
    }

    public async scroll(move: any) {
        if (move == 'left') {
            this.workspace.nativeElement.scrollLeft = this.workspace.nativeElement.scrollLeft - 600;
        } else {
            this.workspace.nativeElement.scrollLeft = this.workspace.nativeElement.scrollLeft + 600;
        }
    }

}