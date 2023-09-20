import season
import datetime

config = wiz.model("portal/works/config")
Member = wiz.model("portal/works/struct/member")
Plan = wiz.model("portal/works/struct/plan")
Issueboard = wiz.model("portal/works/struct/issueboard")
Meeting = wiz.model("portal/works/struct/meeting")

orm = wiz.model("portal/season/orm")
projectdb = orm.use("project", module="works")
memberdb = orm.use("member", module="works")
projectconfigdb = orm.use("project/config", module="works")

class Project:
    def __init__(self, data):
        self.id = data['id']
        self.data = data
        
        self.member = Member(self)
        self.plan = Plan(self)
        self.issueboard = Issueboard(self)
        self.meeting = Meeting(self)
        
        self.data['role'] = self.member.auth()
        
        if self.data['role'] == 'visitor' and self.data['visibility'] not in ['public']:
            raise Exception("Not Allowed")
    
    @staticmethod
    def cache():
        if 'works' not in wiz.server.app: 
            wiz.server.app.works = season.util.std.stdClass()
        cache = wiz.server.app.works
        if 'project' not in cache:
            cache.project = season.util.std.stdClass()
        return cache.project

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
    def search(query=None, text="", page=1, dump=10, visibility=['public'], status="open", sort="updated"):
        untracks = Project.untracks()
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
            if sort == 'title':
                where['orderby'] = "title"
                where['order'] = "ASC"
            else:
                where['orderby'] = "updated"
                where['order'] = "DESC"
            rows = projectdb.rows(fields="id,namespace,visibility,title,short,user,status,start,end,icon,created,updated", **where)
            for i in range(len(rows)):
                if rows[i]['id'] in untracks:
                    rows[i]['untrack'] = True
            total = projectdb.count(**where)
            return total, rows
        except:
            pass
        return 0, []

    @staticmethod
    def workin(role="admin"):
        user_id = config.session_user_id()
        pid = memberdb.rows(user=user_id, fields="project_id", role=role)
        return [x['project_id'] for x in pid]
    
    @staticmethod
    def create():
        membership = Project.membership()
        if membership not in ['admin', 'staff', 'user']:
            raise Exception("Not Allowed")

        data = dict()
        data['namespace'] = orm.random(16)
        data['visibility'] = "private"
        data['title'] = ""
        data['short'] = ""
        data['status'] = "draft"
        data['start'] = datetime.datetime.now()
        data['created'] = datetime.datetime.now()
        data['updated'] = datetime.datetime.now()
        data['extra'] = dict()

        while projectdb.get(namespace=data['namespace']) is not None:
            data['namespace'] = orm.random(16)

        project_id = projectdb.insert(data)

        data = dict()
        data['project_id'] = project_id
        data['user'] = config.session_user_id()
        data['role'] = 'admin'
        data['created'] = datetime.datetime.now()
        memberdb.insert(data)
        return project_id

    @staticmethod
    def get(namespace, useCache=False):
        cache = Project.cache()
        if useCache:
            if namespace in cache:
                return cache[namespace]
        data = projectdb.get(namespace=namespace)
        if data is None:
            data = projectdb.get(id=namespace)
        if data is None:
            return None
        
        user_id = config.session_user_id()
        untrack = projectconfigdb.get(user_id=user_id, project_id=data['id'], key="untrack")
        if untrack is None or untrack['value'] != 'true':
            untrack = False
        else:
            untrack = True
        data['userconfig_untrack'] = untrack

        cache[namespace] = Project(data)
        return cache[namespace]

    def untracks():
        user_id = config.session_user_id()
        rows = projectconfigdb.rows(user_id=user_id, key="untrack", value="true")
        rows = [x['project_id'] for x in rows]
        return rows

    def untrack(self, status):
        user_id = config.session_user_id()
        item = dict(user_id=user_id, project_id=self.id, key="untrack", value=status)
        untrack = projectconfigdb.get(user_id=user_id, project_id=self.id, key="untrack")
        if untrack is None:
            projectconfigdb.insert(item)
        else:
            projectconfigdb.update(dict(value=status), user_id=user_id, project_id=self.id, key="untrack")

    def visibility(self):
        return self.data['visibility']
    
    def role(self):
        return self.data['role']
    
    def updateTime(self):
        data = dict()
        data['updated'] = datetime.datetime.now()
        project_id = self.id
        return projectdb.update(data, id=project_id)

    def update(self, data):
        self.member.accessLevel(['admin'])
        project_id = self.id
        data['updated'] = datetime.datetime.now()
        if 'id' in data:
            del data['id']
        return projectdb.update(data, id=project_id)

    def delete(self):
        project_id = self.id
        if self.data['status'] != 'draft':
            raise Exception("Not Allowed")
        projectdb.delete(id=project_id)
        memberdb.delete(project_id=project_id)

Model = Project