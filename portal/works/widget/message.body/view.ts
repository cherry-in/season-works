import { OnInit, Input } from '@angular/core';

export class Component implements OnInit {
    @Input() cache: any = {};
    @Input() event: any = {};
    @Input() project: any = {};
    @Input() msg: any = {};

    public async ngOnInit() {
    }
}