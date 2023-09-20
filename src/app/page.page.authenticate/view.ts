import { OnInit } from '@angular/core';
import { Service } from '@wiz/libs/portal/season/service';

export class Component implements OnInit {
    constructor(public service: Service) { }

    public returnTo: string = "notset";

    public async ngOnInit() {
        await this.service.init();
        let returnTo = this.getParam('returnTo', '/');
        let check = await this.service.auth.allow(false, returnTo);
        if (check)
            this.returnTo = returnTo;
    }

    public getParam(sname, defaultvalue) {
        let params = location.search.substring(location.search.indexOf("?") + 1);
        let sval = defaultvalue;
        params = params.split("&");
        for (let i = 0; i < params.length; i++) {
            let temp = params[i].split("=");
            if ([temp[0]] == sname) { sval = temp[1]; }
        }
        return decodeURIComponent(sval);
    }

    public view: string = 'login.email';

    public data: any = {
        email: '',
        password: ''
    };

    public async alert(message: string, status: string = 'error', cancel: any = false, action: string = '확인') {
        return await this.service.alert.show({
            title: "",
            message: message,
            cancel: cancel,
            actionBtn: status,
            action: action,
            status: status
        });
    }

    public async toLogin() {
        this.view = 'login.email';
        await this.service.render();
    }

    public async login() {
        let user = JSON.parse(JSON.stringify(this.data));
        if (user.password)
            user.password = this.service.auth.hash(user.password);
        else
            delete user.password;

        let { code, data } = await wiz.call("login", user);

        if (code == 200) {
            location.href = this.returnTo;
        } else if (code == 201) {
            this.view = "login.password";
            await this.service.render();
            try {
                setTimeout(() => {
                    document.querySelector("input[type=password]").focus();
                }, 150);
            } catch (err) {
                console.log(err);
            }
        } else if (code == 301) {
            let isjoin = await this.alert(data, 'success', '닫기', '계정 만들기');
            if (!isjoin) return;
            this.view = "join.terms";
            await this.service.render();
        } else {
            await this.alert(data, 'error');
        }
    }

    public async join_start() {
        this.view = "join.email";
        await this.service.render();
    }

    public async join_email_check() {
        let user = JSON.parse(JSON.stringify(this.data));
        delete user.password;
        let { code, data } = await wiz.call("login", user);
        if (code == 301) {
            this.view = "join.terms";
            await this.service.render();
            return;
        }

        await this.alert('사용할 수 없는 이메일입니다.');
    }

    public async termsAccept() {
        this.view = "join.verify";
        await this.emailAuthentication(this.data.email, false);
        await this.service.render();
    }

    public async emailAuthentication(email: string, showstatus: boolean = true) {
        await this.service.loading.show();
        let res = await wiz.call('emailAuthentication', { email });
        await this.service.loading.hide();
        if (!showstatus) return;
        if (res.code == 200) {
            await this.alert('이메일 인증 코드가 발송되었습니다', 'success');
        } else {
            await this.alert('이메일 인증 코드 발송중 오류가 발생했습니다', 'error');
        }
    }

    public async emailVerify(email: string, onetimepass: string) {
        await this.service.loading.show();
        let res = await wiz.call('emailVerify', { email, onetimepass });
        await this.service.loading.hide();
        if (res.code == 200) {
            this.view = "join.userrequired";
            await this.service.render();
        } else {
            await this.alert(res.data, 'error');
        }
    }

    public async join() {
        if (this.data.name.length == 0) return await this.alert("이름을 입력해주세요");
        let password = this.data.password;
        let password_re = this.data.password_repeat;
        if (password.length < 8) return await this.alert("8글자 이상의 비밀번호를 설정해주세요");
        if (password.search(/[a-z]/i) < 0) return await this.alert("비밀번호에 알파벳을 포함해주세요");
        if (password.search(/[0-9]/) < 0) return await this.alert("비밀번호에 숫자를 포함해주세요");
        if (password != password_re) return await this.alert("비밀번호가 일치하지 않습니다");

        let user = JSON.parse(JSON.stringify(this.data));
        delete user.password_repeat;

        user.password = this.service.auth.hash(user.password);

        await this.service.loading.show();
        let { code, data } = await wiz.call("join", user);
        await this.service.loading.hide();

        if (code != 200) {
            await this.alert(data);
            return;
        }

        await this.alert("회원가입이 완료되었습니다", "success");
        location.reload();
    }
}