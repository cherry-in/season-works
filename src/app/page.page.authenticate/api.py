import re
import datetime

smtp = wiz.model('portal/season/smtp').use()
orm = wiz.model("portal/season/orm")
db = orm.use("user")

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

def login():
    email = wiz.request.query("email", True)
    password = wiz.request.query("password", None)
    
    if tool.checkEmail(email) == False:
        user = db.get(id=email)
    else:
        user = db.get(email=email)
    
    if user is None:
        if tool.checkEmail(email):
            wiz.response.status(301, "가입되지 않은 계정입니다. 계정을 만드시겠습니까?")
        else:
            wiz.response.status(404, "가입되지 않은 계정입니다.")
    
    if user['status'] not in ['active', 'pending', 'block']:
        wiz.response.status(301, "가입되지 않은 계정입니다. 계정을 만드시겠습니까?")

    if user['status'] in ['pending', 'block']:
        wiz.response.status(404, "관리자의 승인을 기다리고 있습니다")

    if password is None:
        wiz.response.status(201, True)

    if user['password'](password) == False:
        wiz.response.status(401, "이메일 또는 비밀번호를 확인해주세요")

    wiz.session.create(user['id'])
    wiz.response.status(200, True)

def emailAuthentication():
    email = wiz.request.query("email", True)

    if tool.checkEmail(email) == False:
        wiz.response.status(401, "잘못된 이메일 형식입니다")

    user = db.get(email=email)
    if user is not None:
        if user['status'] in ['active', 'pending', 'block']:
            wiz.response.status(401, "이미 사용중인 이메일 입니다")
            
    if user is None:
        user = dict()
    else:
        del user['password']

    now = datetime.datetime.now()
    onetimepass = orm.random(6, number=True)

    user['email'] = email
    user['role'] = 'user'
    user['status'] = 'join'
    user['onetimepass'] = onetimepass
    user['onetimepass_time'] = now
    user['created'] = now
    user['last_access'] = now

    if 'id' not in user:
        db.insert(user)
    else:
        db.upsert(user)

    tool.sendEmailVerification(email, onetimepass)
    
    wiz.response.status(200, True)

def emailVerify():
    email = wiz.request.query('email', True)
    onetimepass = wiz.request.query('onetimepass', True)
    now = datetime.datetime.now().timestamp()

    user = db.get(email=email)
    if user is None:
        wiz.response.status(404, "가입되지 않은 회원입니다.")
    if user is not None:
        if user['status'] in ['active', 'pending', 'block']:
            wiz.response.status(401, "이미 사용중인 이메일 입니다")

    if user['onetimepass'] == onetimepass:
        diff = now - user['onetimepass_time'].timestamp()
        if diff < 300:
            wiz.session.set(verified=email)
            wiz.response.status(200, True)

    wiz.response.status(404, "잘못된 인증번호 입니다")

def join():
    email = wiz.request.query('email', True)
    verified = wiz.session.get("verified")
    if verified != email:
        wiz.response.status(401, "잘못된 접근입니다")

    user = db.get(email=email)
    if user is None:
        wiz.response.status(404, "가입되지 않은 회원입니다.")
    if user is not None:
        if user['status'] in ['active', 'pending', 'block']:
            wiz.response.status(401, "이미 사용중인 이메일 입니다")
    
    user = dict()
    user['name'] = wiz.request.query("name", True)
    user['password'] = wiz.request.query("password", True)
    user['mobile'] = wiz.request.query("mobile", True)
    
    user['membership'] = 'guest'
    user['status'] = 'active'
    user['onetimepass'] = ''
    user['onetimepass_time'] = None

    db.update(user, email=email)
    user = db.get(email=email)
    user_id = user['id']

    worksdb = orm.use("member", module="works")
    worksdb.update(dict(user=user_id), user=email)
    wikidb = orm.use("access", module="wiki")
    wikidb.update(dict(key=user_id), key=email, type="user")

    wiz.response.status(200, True)
