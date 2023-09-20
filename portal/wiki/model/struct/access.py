import season
import datetime

config = wiz.model("portal/wiki/config")
orm = wiz.model("portal/season/orm")
accessdb = orm.use("access", module="wiki")

class Model:
    def __init__(self, book):
        self.book = book
        self.book_id = book.data.id
        self.ACCESS_LEVELS = ['admin', 'user', 'guest', 'visitor']

    def list(self):
        self.accessLevel(['admin', 'user', 'guest'])
        book_id = self.book_id
        accesses = accessdb.rows(book_id=book_id)
        for i in range(len(accesses)):
            access = config.get_user_info(wiz, accesses[i]['key'], accesses[i]['type'])
            if access is not None:
                accesses[i]['meta'] = access
            else:
                accesses[i]['meta'] = dict()
        return accesses

    def role(self, key, type='user'):
        membership = self.book.membership()
        if membership in ['admin']:
            return 'admin'
        
        if type == 'user':
            access = config.find_access(wiz, self.book_id, key)
        else:
            access = accessdb.get(type=type, key=key, book_id=self.book_id)
            if access is not None:
                access = access['role']
            else:
                access = 'visitor'

        if access not in ['visitor']:
            return access

        visibility = self.book.visibility()
        if visibility in ['internal']:
            if membership in ['staff']:
                return 'guest'

        if visibility in ['public']:
            return 'guest'

        return 'visitor'
    
    def auth(self):
        user_id = config.session_user_id()
        return self.role(user_id) 

    def accessLevel(self, allowed, raise_exception=True):
        if type(allowed) == str:
            allowed = [allowed]
        auth = self.auth()
        if auth in allowed:
            return True
        if raise_exception:
            raise Exception("Not Allowed")
        return False
    
    def create(self, role, key, type="user"):
        if role == 'admin':
            self.accessLevel(["admin"])
        else:
            self.accessLevel(["admin", "user"])

        data = dict()
        data['book_id'] = self.book_id
        data['type'] = type
        data['key'] = key
        data['role'] = role
        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()
        accessdb.insert(data)
    
    def update(self, data):
        self.accessLevel(["admin"])
        where = dict()
        where['id'] = data['id']
        where['key'] = data['key']
        where['type'] = data['type']
        where['book_id'] = data['book_id']
        ud = dict()
        ud['role'] = data['role']
        ud['updated'] = datetime.datetime.now()
        accessdb.update(ud, **where)

    def remove(self, data):
        self.accessLevel(["admin"])
        where = dict()
        where['id'] = data['id']
        where['key'] = data['key']
        where['type'] = data['type']
        where['book_id'] = data['book_id']

        if where['key'] == config.session_user_id() and where['type'] == 'user':
            return
        if self.book_id != where['book_id']:
            return

        accessdb.delete(**where)