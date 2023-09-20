import season
import datetime

config = wiz.model("portal/wiki/config")
orm = wiz.model("portal/season/orm")
Access = wiz.model("portal/wiki/struct/access")
Content = wiz.model("portal/wiki/struct/content")
Revision = wiz.model("portal/wiki/struct/revision")

bookdb = orm.use("book", module="wiki")
accessdb = orm.use("access", module="wiki")

class Model:
    def __init__(self, data):
        self.id = data['id']
        self.data = data

        self.access = Access(self)
        self.content = Content(self)
        self.revision = Revision(self)
        self.data['role'] = self.access.auth()

    @staticmethod
    def membership():
        user_id = config.session_user_id()
        user = config.get_user_info(wiz, user_id)
        try:
            return user['membership']
        except:
            pass
        return "visitor"
    
    @staticmethod
    def search(query=None, text="", page=1, dump=10, visibility=['public'], status="open"):
        try:
            where = dict() 
            if query is not None:
                where['query'] = query
            else:
                where['visibility'] = visibility
                if len(text) > 0:
                    where['title'] = text
                    where['like'] = 'title'
                where['status'] = status

            where['page'] = page
            where['dump'] = dump
            where['orderby'] = "updated"
            where['order'] = "DESC"
            rows = bookdb.rows(fields="id,namespace,title,visibility,created,updated,icon", **where)
            total = bookdb.count(**where)
            return total, rows
        except Exception as e:
            pass
        return 0, []
    
    @staticmethod
    def workin(role="admin", key=None, type="user"):
        if key is None:
            key = config.session_user_id()
        return config.workin(wiz, key, role=role, type=type)

    @staticmethod
    def create(data):
        membership = Model.membership()
        if membership not in ['admin', 'staff', 'user']:
            raise Exception("Not Allowed")

        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()

        if bookdb.get(namespace=data['namespace']) is not None:
            raise Exception("Namespace가 사용중입니다")

        book_id = bookdb.insert(data)

        data = dict()
        data['book_id'] = book_id
        data['type'] = 'user'
        data['key'] = config.session_user_id()
        data['role'] = 'admin'
        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()
        accessdb.insert(data)

        return book_id

    @staticmethod
    def get(namespace):
        data = bookdb.get(namespace=namespace)
        if data is None:
            data = bookdb.get(id=namespace)
        if data is None:
            return None
        return Model(data)
    
    def visibility(self):
        return self.data['visibility']
    
    def updateTime(self):
        data = dict()
        data['updated'] = datetime.datetime.now()
        book_id = self.id
        return bookdb.update(data, id=book_id)
    
    def update(self, data):
        book_id = self.id
        data['updated'] = datetime.datetime.now()
        if 'id' in data:
            del data['id']
        return bookdb.update(data, id=book_id)
