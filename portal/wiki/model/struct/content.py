import season
import datetime

config = wiz.model("portal/wiki/config")
orm = wiz.model("portal/season/orm")
db = orm.use("content", module="wiki")

class Model:
    def __init__(self, book):
        self.book = book
        self.book_id = book.data.id

    def load(self, content_id):
        if content_id == 'home':
            content_id = self.book.data['home']
        data = db.get(id=content_id, book_id=self.book_id)
        if data is None:
            data = dict()
        return data

    def update(self, data):
        self.book.access.accessLevel(['admin', 'user'])
        content_id = None
        if 'id' not in data:
            if 'type' not in data: data['type'] = 'doc'
            if 'root_id' not in data: data['root_id'] = ''
            data['book_id'] = self.book_id
            data['created'] = datetime.datetime.now()
            content_id = db.insert(data)
            if 'home' in data and data['home'] == 'home':
                self.book.update(dict(home=content_id))
        else:
            content_id = data['id']
            content = self.load(content_id)
            if content is None:
                raise Exception("Not Found")
            if 'id' in data: del data['id']
            if 'book_id' in data: del data['book_id']
            if 'type' in data: del data['type']
            if 'created' in data: del data['created']
            data['updated'] = datetime.datetime.now()
            db.update(data, id=content_id)
        
        revs = self.book.revision.load(content_id)
        if len(revs) == 0:
            self.book.revision.commit(content_id)
        return content_id
    
    def delete(self, content_id):
        self.book.access.accessLevel(['admin', 'user'])
        content = db.get(id=content_id)
        if content['type'] == 'attachment':
            book_id = self.book_id
            fs = wiz.model("portal/wiki/fs").use(f"book/{book_id}/attachment")
            fs.remove(content_id)
        db.delete(id=content_id)
        db.delete(root_id=content_id)

    def tree(self, root_id=""):
        self.book.access.accessLevel(['admin', 'user', 'guest'])
        root = db.get(id=root_id, fields="id,type,title,root_id")
        if root is None: root = dict()
        children = db.rows(book_id=self.book_id, root_id=root_id, type=['doc', 'folder'], order="ASC", orderby="title", fields="id,type,title,root_id")
        return dict(root=root, children=children)
