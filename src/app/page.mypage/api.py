import json

config = wiz.model("portal/season/config")

class Tool:
    def checkId(self, id):
        regex = re.compile(r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+')
        if re.fullmatch(regex, id):
            return True
        return False

    def checkEmail(self, email):
        regex = re.compile(r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+')
        if re.fullmatch(regex, email):
            return True
        return False

    def sendEmailVerification(self, mail, onetimepass):
        params = dict()
        params['to'] = mail
        params['title'] = 'SEASON 이메일 인증'
        params['onetimepass'] = onetimepass
        params['template'] = 'email_verify'
        smtp.send(**params)
        
tool = Tool()
orm = wiz.model("portal/season/orm")
db = orm.use("user")

def session():
    resp = dict()
    user_id = wiz.session.get("id")
    user = db.get(id=user_id)
    if user['password'] is None:
        user['hasPassword'] = False
    else:
        user['hasPassword'] = True
    del user['password']
    resp['user'] = user
    
    config.session_create(wiz, user_id)
    wiz.response.status(200, **resp)

def update():
    user = json.loads(wiz.request.query("userinfo", True))
    del user['id']
    del user['status']
    del user['last_access']
    del user['created']
    del user['membership']
    del user['email']
    del user['onetimepass']
    del user['onetimepass_time']
    user_id = wiz.session.get("id")
    db.update(user, id=user_id)
    wiz.response.status(200, True)

def change_password():
    current = wiz.request.query("current", True)
    data = wiz.request.query("data", True)
    user_id = wiz.session.get("id")
    user = db.get(id=user_id)

    if user['password'] is not None:
        if user['password'](current) == False:
            wiz.response.status(401, "비밀번호가 틀렸습니다")
    
    db.update(dict(password=data), id=user_id)
    wiz.response.status(200, True)