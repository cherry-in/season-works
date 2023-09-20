import datetime

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
messagedb = orm.use("issueboard/message", module="works")

class Model:
    def __init__(self, issueboard):
        self.issueboard = issueboard
        self.project = issueboard.project
        self.project_id = issueboard.project.data['id']

    def create(self, data):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        user_id = config.session_user_id()
        issue_id = data['issue_id']
        data['user_id'] = user_id
        data['updated'] = datetime.datetime.now()
        data['created'] = datetime.datetime.now()
        data['favorite'] = 0
        message_id = messagedb.insert(data)

        self.project.issueboard.issue.updateTime(issue_id)

        parent_id = 0
        if 'parent_id' in data:
            parent_id = data['parent_id']

        self.issueboard.emit("message", {"issue_id": issue_id, "message_id": str(message_id), "parent_id": str(parent_id)})
        self.project.updateTime()

    def updateFavorite(self, message_id, favorite):
        self.project.member.accessLevel(['admin', 'manager', 'user'])
        messagedb.update(dict(favorite=favorite), id=message_id)

    def update(self, data):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        if 'id' not in data:
            return self.create(data)
        message_id = data['id']
        user_id = config.session_user_id()
        if 'id' in data: del data['id']
        if 'type' in data: del data['type']
        if 'issue_id' in data: del data['issue_id']
        if 'user_id' in data: del data['user_id']
        if 'created' in data: del data['created']
        data['updated'] = datetime.datetime.now()
        messagedb.update(data, id=message_id, user_id=user_id)
        
        msg = messagedb.get(id=message_id)
        if msg is not None:
            issue_id = msg['issue_id']
            self.project.issueboard.issue.updateTime(issue_id)

        self.project.updateTime()

    def remove(self, message_id):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        user_id = config.session_user_id()
        messagedb.delete(id=message_id, user_id=user_id)
        self.project.updateTime()

    def log(self, issue_id, message):
        self.project.member.accessLevel(['admin', 'manager', 'user'])
        data = dict(issue_id=issue_id, message=message, attachment=[], type="log")
        self.create(data)

    def get(self, message_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])
        item = messagedb.get(id=message_id)
        if item is None:
            return None
        if self.project.issueboard.issue.get(item['issue_id']) is None:
            return None
        item['reply'] = messagedb.rows(parent_id=item['id'], order="ASC", orderby="id")
        return item

    def list(self, issue_id, type="log", first=None, favorite=None):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        def query(db, qs):
            nullcheck = (db.parent_id.is_null(True) | (db.parent_id == 0))
            qs = qs.where(nullcheck)
            return qs

        kwargs = dict(
            query=query,
            issue_id=issue_id, 
            type=type, 
            order="DESC", 
            orderby="id"
        )

        if favorite is not None:
            kwargs['favorite'] = 1

        if first is not None:
            def idOperator(field):
                return field < first
            kwargs['id'] = idOperator

        rows = messagedb.rows(page=1, dump=10, **kwargs)

        for i in range(len(rows)):
            rows[i]['reply'] = messagedb.rows(parent_id=rows[i]['id'], issue_id=issue_id, order="ASC", orderby="id")

        return rows
    
    def unread(self, issue_id, type="log", last=None, favorite=None):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        def query(db, qs):
            nullcheck = (db.parent_id.is_null(True) | (db.parent_id == 0))
            qs = qs.where(nullcheck)
            return qs

        kwargs = dict(
            query=query,
            issue_id=issue_id, 
            type=type, 
            order="ASC", 
            orderby="id"
        )

        if favorite is not None:
            kwargs['favorite'] = 1

        if last is not None:
            def idOperator(field):
                return field > last
            kwargs['id'] = idOperator

        rows = messagedb.rows(**kwargs)

        for i in range(len(rows)):
            rows[i]['reply'] = messagedb.rows(parent_id=rows[i]['id'], issue_id=issue_id, order="ASC", orderby="id")

        return rows