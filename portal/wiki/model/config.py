import season
sconfig = wiz.model("portal/season/config")

class BaseConfig(season.util.std.stdClass):
    DEFAULT_VALUES = dict()

    def __init__(self, values=dict()):
        default = self.DEFAULT_VALUES
        for key in default:
            _type, val = default[key]
            if key not in values:
                if _type is not None:
                    val = _type(val)
                values[key] = val
            else:
                if _type is not None:
                    values[key] = _type(values[key])
        super(BaseConfig, self).__init__(values)
        
    def __getattr__(self, attr):
        val = super(BaseConfig, self).__getattr__(attr)
        if attr in self.DEFAULT_VALUES:
            _type, _default = self.DEFAULT_VALUES[attr]
            if val is None: val = _default
            if _type is not None: val = _type(val)
        return val

def find_access(wiz, book_id, key):
    orm = wiz.model("portal/season/orm")
    db = orm.use("access", module="wiki")
    access = db.get(type='user', key=key, book_id=book_id)
    if access is not None:
        return access['role']
    return 'visitor'

def get_user_info(wiz, userkey):
    orm = wiz.model("portal/season/orm")
    db = orm.use("user")
    user = db.get(id=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    if user is None:
        user = db.get(email=userkey, fields="id,email,membership,name,mobile,status,profile_image,created,last_access")
    return user

def workin(wiz, userkey, role="admin"):
    orm = wiz.model("portal/season/orm")
    db = orm.use("user")
    user_id = config.session_user_id()
    pid = db.rows(type='user', key=userkey, role=role, fields="book_id")
    pid = [x['book_id'] for x in pid]
    return pid

class Config(BaseConfig):
    DEFAULT_VALUES = {
        'STORAGE_PATH': (str, 'storage/wiki'),
        'db_prefix': (str, ''),
        'find_access': (None, find_access),
        'get_user_info': (None, get_user_info),
        'session_user_id': (None, sconfig.session_user_id)
    }

config = wiz.config("wiki")
Model = Config(config)