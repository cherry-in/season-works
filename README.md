## Dependencies

Ubuntu dependencies

```
apt update
apt upgrade
apt install net-tools build-essential ntp -y
apt install libfontenc1 libxfont2 xfonts-encodings xfonts-utils xfonts-base xfonts-75dpi language-pack-ko -y
apt install fonts-nanum fonts-nanum-coding fonts-nanum-extra -y
apt install libfontenc1 libxfont2 xfonts-encodings xfonts-utils xfonts-base xfonts-75dpi language-pack-ko
apt install net-tools build-essential zip unzip -y
apt-get install pkg-config libxml2-dev libxmlsec1-dev libxmlsec1-openssl
apt install redis-server redis-tools 
apt install nginx
```

Install Python

```
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
sh Miniconda3-latest-Linux-x86_64.sh 
```

Python dependencies

```
pip install season python3-saml gevent-websocket redis flask_session
```

## Configuration

### ide config: config/boot.py

```
import redis
from flask_session import Session
from gevent import monkey

def bootstrap(app, config):
    app.flask.config['SESSION_TYPE'] = 'redis'
    app.flask.config['SESSION_PERMANENT'] = False
    app.flask.config['SESSION_USE_SIGNER'] = True
    app.flask.config['SESSION_REDIS'] = redis.from_url('redis://<redis-host-ip>:6379')
    Session(app.flask)
    monkey.patch_all()
    return
    
secret_key = "season-wiz-secret"

socketio = dict()
socketio['async_mode'] = 'gevent'
socketio['manage_session'] = True
socketio['async_handlers'] = True
socketio['always_connect'] = False
socketio['cors_allowed_origins'] = '*'
socketio['message_queue'] = 'redis://<redis-host-ip>:6379'
socketio['channel'] = 'works'

run = dict()
run['host'] = "0.0.0.0"
run['port'] = 3000
```

### project config: works.py

```
STORAGE_PATH = "/mnt/storage/works"
db_prefix = "works_"

def get_user_info(wiz, userkey):
    orm = wiz.model("portal/season/orm")
    db = orm.use("user")
    user = db.get(id=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    if user is None:
        user = db.get(email=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    return user
```

### project config: wiki.py

```
STORAGE_PATH = "/mnt/storage/wiki"
db_prefix = "wiki_"

def workin(wiz, userkey, role="admin"):
    orm = wiz.model("portal/season/orm")
    db = orm.use("access", module="wiki")
    pid = db.rows(type='user', key=userkey, role=role, fields="book_id")
    pid = [x['book_id'] for x in pid]
    return pid

def get_user_info(wiz, userkey):
    orm = wiz.model("portal/season/orm")
    db = orm.use("user")
    user = db.get(id=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    if user is None:
        user = db.get(email=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    return user

def find_access(wiz, book_id, key):
    orm = wiz.model("portal/season/orm")
    db = orm.use("access", module="wiki")
    access = db.get(type='user', key=key, book_id=book_id)
    if access is not None:
        return access['role']
    return 'visitor'
```

### project config: season.py

```
import datetime

pwa_title = "시즌웍스"

auth_login_uri = "/authenticate"
auth_saml_use = True

smtp_sender = 'noreply@season.co.kr'
smtp_host = "smtp.office365.com"
smtp_port = 587
smtp_password = 'season123!@'

def session_create(wiz, key):
    orm = wiz.model("portal/season/orm")
    db = orm.use("user")
    user = db.get(fields="id,email,membership,name,mobile,status,created,last_access", id=key)
    if user is None:
        user = db.get(fields="id,email,membership,name,mobile,status,created,last_access", email=key)
    wiz.session.set(**user)

def auth_saml_acs(wiz, userinfo):    
    email = None
    if 'email' in userinfo: email = userinfo['email'][0]
    elif 'mail' in userinfo: email = userinfo['mail'][0]
    else: wiz.response.status(500)
    name = ''
    if 'name' in userinfo: name = userinfo['name'][0]
    mobile = ''
    if 'mobile' in userinfo: mobile = userinfo['mobile'][0]

    orm = wiz.model("portal/season/orm")
    userdb = orm.use("user")
    sessiondata = userdb.get(fields="id,email,membership,name,mobile,status,created,last_access", email=email)
    
    if sessiondata is None:
        userdb.insert(dict(
            email=email, 
            membership="guest",
            name=name, 
            mobile=mobile,
            status="active",
            created=datetime.datetime.now(),
            last_access=datetime.datetime.now()
        ))
    else:
        userdb.update(dict(last_access=datetime.datetime.now()), email=email)

    user = userdb.get(fields="id,email,membership,name,mobile,status,created,last_access", email=email)
    return user
```

### project config: database.py

```
from season.util.std import stdClass

base = stdClass(
    type = "mysql",
    database = "works",
    host = "172.19.1.5",
    port = 3306,
    user = "works",
    password = "season123!@",
    charset = 'utf8'      
)

works = base
wiki = base
```

### project config: smtp/email_verify.html

```
<div style="width: 100%; min-height: 100%; background: #f5f7fb; padding-top: 48px; padding-bottom: 48px;">
    <div style="width: 80%; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px;">
        <div style="background: #3843D0; padding: 18px 24px; border-radius: 8px; padding-bottom: 12px; display: flex; align-items: end;">
            <b style="color: #fff; font-size: 20px; font-weight: 1000; margin-left: 12px;">SEASON Works</b>
        </div>

        <div style="padding: 8px 24px; padding-bottom: 32px; padding-top: 8px;">
            <h2 style="font-size: 24px; color: #F9623E; margin-bottom: 12px;">{title}</h2>

            <div style="text-align: center; padding-top: 24px; padding-bottom: 24px;">
                <span style="font-size: 18px; padding: 12px 24px; background: #F9623E; border-radius: 12px; color: #ffffff;">인증번호: {onetimepass}</span>
            </div>
        </div>

        <div
            style="padding: 12px 24px; background: #2e2e2e; color: #ffffff; border-bottom-right-radius: 8px; border-bottom-left-radius: 8px; text-align: center;">
            (30128) 세종특별자치시 나성북1로 12 (메가타워, 602호) 주식회사 시즌
        </div>
    </div>
</div>
```
