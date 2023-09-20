import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';
import { Project } from '@wiz/libs/portal/works/project';
import moment from 'moment';

export class Component implements OnInit {
    constructor(
        public service: Service,
        public project: Project
    ) { }

    public readOnly: boolean = true;
    public mmlist: any = [];
    public cache: any = { total: { mm: 0, period: 0, ymm: 0 } };

    public async ngOnInit() {
        await this.service.init();
        await this.project.load();
        this.readOnly = !this.project.accessLevel(['admin', 'manager']);
        await this.calcMMPeriod();
        await this.service.render();
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

    public async update() {
        const { code } = await this.project.plan.update();
        if (code == 200) {
            await this.alert("저장되었습니다", 'success');
            await this.project.plan.load();

        } else {
            await this.alert("저장 중 오류가 발생했습니다.");
        }
    }

    public async arrayUp(arr: any, item: any) {
        arr.up(item);
        await this.service.render();
    }

    public async arrayDown(arr: any, item: any) {
        arr.down(item);
        await this.service.render();
    }

    public async arrayAdd(arr: any, item: any = {}) {
        arr.push(item);
        await this.calcMMPeriod();
        await this.service.render();
    }

    public async arrayRemove(arr: any, item: any = {}) {
        if (item.status == 'deleted') {
            item.status = "";
        } else {
            item.status = "deleted";
        }
        await this.calcMMPeriod();
        await this.service.render();
    }

    public async calcMMPeriod() {
        let data = this.project.plan.data();
        let max_mm = 0;
        for (let i = 0; i < data.length; i++) {
            try {
                for (let j = 0; j < data[i].child.length; j++)
                    if (data[i].child[j].extra.mm)
                        max_mm = data[i].child[j].extra.mm.length;
            } catch (e) {
            }
        }

        if (max_mm == 0) max_mm = 3;
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].child.length; j++) {
                if (!data[i].child[j].extra)
                    data[i].child[j].extra = {};
                if (!data[i].child[j].extra.mm)
                    data[i].child[j].extra.mm = [];

                if (data[i].child[j].extra.mm.length != max_mm) {
                    data[i].child[j].extra.mm = [];
                    for (let k = 0; k < max_mm; k++) {
                        data[i].child[j].extra.mm.push({ mm: null });
                    }
                }
            }
        }

        this.mmlist = [];
        let startdate = null;
        if (this.project.start)
            startdate = moment(this.project.start);

        for (let i = 0; i < max_mm; i++) {
            if (!startdate) {
                this.mmlist.push({ title: (i + 1) + 'M' });
            } else {
                this.mmlist.push({ title: startdate.format("YYYY/MM") });
                startdate = startdate.add(1, 'M');
            }
        }

        await this.service.render();
    }

    public async addMMPeriod() {
        let data = this.project.plan.data();
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].child.length; j++) {
                try {
                    data[i].child[j].extra.mm.push({ mm: null });
                } catch (e) {
                }
            }
        }
        this.calcMMPeriod();
    }

    public async deleteMMPeriod() {
        let data = this.project.plan.data();

        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].child.length; j++) {
                try {
                    data[i].child[j].extra.mm.remove(data[i].child[j].extra.mm[data[i].child[j].extra.mm.length - 1]);
                } catch (e) {
                }
            }
        }
        this.calcMMPeriod();
    }

    public calculateMM() {
        let val = 0;
        let data = this.project.plan.data();

        if (this.mmlist.length == 0)
            return 0;

        for (let i = 0; i < this.mmlist.length; i++) {
            this.mmlist[i].mm = 0;
        }

        for (let i = 0; i < data.length; i++) {
            data[i]._mm = [];

            for (let j = 0; j < this.mmlist.length; j++) {
                data[i]._mm.push({ mm: 0 });
            }


            let child = data[i].child;
            for (let j = 0; j < child.length; j++) {
                let item = child[j];
                let mm = 0;
                let period = 0;
                for (let k = 0; k < item.extra.mm.length; k++) {
                    if (item.extra.mm[k].mm) {
                        this.mmlist[k].mm += item.extra.mm[k].mm;
                        data[i]._mm[k].mm += item.extra.mm[k].mm;
                        mm += item.extra.mm[k].mm;
                        period++;
                    }
                }
                item.mm = mm / period;
                item.period = period;

                if (item.mm && item.period) {
                    val += item.mm * item.period;
                }
            }
        }

        this.cache.ymm = val / 12;
        this.cache.period = this.mmlist.length;
        this.cache.mm = val / this.cache.period;

        return this.cache.ymm;
    }
}