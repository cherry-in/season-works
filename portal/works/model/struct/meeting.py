import datetime
import json
import season

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
db = orm.use("meeting", module="works")
versiondb = orm.use("meeting/version", module="works")

class Model:
    def __init__(self, project):
        self.project = project
        self.project_id = project.data['id']
        self.cache = dict()
        self.cache['users'] = dict()
    
    def emit(self, event, data):
        socketio = wiz.server.app.socketio
        branch = wiz.branch()
        socketNamespace = f"/wiz/app/{branch}/portal.works.project.meeting"
        meeting_id = data['id']
        socketio.emit(event, data, to=meeting_id, namespace=socketNamespace, broadcast=True)

    def transformUser(self, user_id):
        if user_id in self.cache['users']:
            user = self.cache['users'][user_id]
        else:
            user = config.get_user_info(wiz, user_id)
            self.cache['users'][user_id] = user
        if user is None:
            user = dict()
        return user

    def search(self, text=""):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])
        
        project_id = self.project_id

        where = dict()
        where['project_id'] = project_id
        where['status'] = ['edit', 'read']
        if len(text) > 0:
            where['title'] = text
            where['like'] = 'title'
        rows = db.rows(fields="id,title,meetdate,user_id", orderby='meetdate', order='DESC', **where)

        udata = dict()
        for i in range(len(rows)):
            user_id = rows[i]['user_id']
            user = self.transformUser(user_id)
            rows[i]['user'] = user
        return rows

    def versions(self, meeting_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        rows = versiondb.rows(meeting_id=meeting_id, orderby='updated', order='DESC', fields="id,user_id,updated")
        udata = dict()
        for i in range(len(rows)):
            user_id = rows[i]['user_id']
            user = self.transformUser(user_id)
            rows[i]['user'] = user
            rows[i]['name'] = 'revision ' + str(len(rows) - i)
        return rows

    def get(self, key):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        project_id = self.project_id
        return db.get(id=key, project_id=project_id)

    def version(self, version_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        data = versiondb.get(id=version_id, project_id=self.project_id)
        data['user'] = self.transformUser(data['user_id'])
        return data

    def versioning(self, id):
        self.project.member.accessLevel(['admin', 'manager', 'user'])
        data = db.get(id=id)
        data['meeting_id'] = data['id']
        del data['id']
        versiondb.insert(data)
        self.project.updateTime()

    def update(self, data):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        data['status'] = 'edit'
        data['project_id'] = self.project_id
        data['user_id'] = config.session_user_id()
        if 'id' not in data:
            data['created'] = datetime.datetime.now()
        else:
            del data['created']
        data['updated'] = datetime.datetime.now()
        if 'id' not in data:
            insert_id = db.insert(data)
            data = db.get(id=insert_id)
            self.versioning(insert_id)
        else:
            db.update(data, id=data['id'])
            data = db.get(id=data['id'])
        
        data['meetdate'] = data['meetdate'].strftime('%Y-%m-%d %H:%M:%S')
        data['created'] = data['created'].strftime('%Y-%m-%d %H:%M:%S')
        data['updated'] = data['updated'].strftime('%Y-%m-%d %H:%M:%S')
        
        self.emit("update", {"id": data['id']})
        self.project.updateTime()
        return data
    
    def delete(self, id):
        self.project.member.accessLevel(['admin', 'manager'])

        data = dict()
        data['status'] = 'deleted'
        db.update(data, id=id)
        data = db.get(id=id)
        self.emit("update", {"id": data['id']})
        self.project.updateTime()