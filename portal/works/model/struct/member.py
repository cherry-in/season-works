import datetime

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
memberdb = orm.use("member", module="works")
userdb = orm.use("user")

class Member:
    def __init__(self, project):
        self.project = project
        self.project_id = project.data['id']
        self.ACCESS_LEVELS = ['admin', 'manager', 'user', 'guest', 'visitor']
    
    def members(self):
        self.accessLevel(['admin', 'manager', 'user', 'guest'])
        
        project_id = self.project_id
        users = memberdb.rows(project_id=project_id)
        for i in range(len(users)):
            user = config.get_user_info(wiz, users[i]['user'])
            if user is not None:
                users[i]['meta'] = user
            else:
                users[i]['meta'] = dict()
        return users

    def list(self):
        return self.members()

    def get(self, key):
        user = userdb.get(id=key)
        if user is None:
            user = userdb.get(email=key)
        return user

    def role(self, key):
        membership = self.project.membership()
        if membership in ['admin']:
            return 'admin'

        member = memberdb.get(user=key, project_id=self.project_id)
        if member is not None:
            return member['role']

        visibility = self.project.visibility()

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

    def create(self, email, role):
        self.accessLevel(["admin", "manager"])
        key = email + ""
        userinfo = config.get_user_info(wiz, key)
        if userinfo is not None:
            key = userinfo['id']

        memberdata = memberdb.get(user=key, project_id=self.project_id)
        if memberdata is None:
            memberdata = memberdb.get(user=email, project_id=self.project_id)
        if memberdata is not None:
            raise Exception("이미 추가된 사용자입니다")
        
        data = dict()
        data['user'] = key
        data['role'] = role
        data['project_id'] = self.project_id
        data['created'] =  datetime.datetime.now()

        if self.auth() == "manager":
            if data['role'] in ['admin', 'manager']:
                return

        memberdb.insert(data)

    def remove(self, user):
        self.accessLevel(["admin", "manager"])
        if user == config.session_user_id():
            return
        if self.auth() == "manager":
            role = self.role(user)
            if role in ['admin', 'manager']:
                return
        memberdb.delete(project_id=self.project_id, user=user)

    def update(self, data):
        self.accessLevel(["admin", "manager"])
        if data['user'] == config.session_user_id():
            return
        if self.auth() == "manager":
            if data['role'] in ['admin', 'manager']:
                return
            role = self.role(data['user'])
            if role in ['admin', 'manager']:
                return
        memberdb.update(data, project_id=self.project_id, user=data['user'])

Model = Member