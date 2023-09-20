import datetime

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
workerdb = orm.use("issueboard/worker", module="works")

class Model:
    def __init__(self, issueboard):
        self.issueboard = issueboard
        self.project = issueboard.project
        self.project_id = issueboard.project.data['id']
    
    def updateOwner(self, issue_id, owners):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        workerdb.delete(issue_id=issue_id, role="owner")
        for uid in owners:
            obj = dict()
            obj['type'] = 'user'
            obj['user_id'] = uid
            obj['issue_id'] = issue_id
            obj['role'] = 'owner'
            obj['created'] = datetime.datetime.now()
            try:
                workerdb.insert(obj)
            except:
                pass

    def updateManager(self, issue_id, workers):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        workerdb.delete(issue_id=issue_id, role="manager")
        for uid in workers:
            obj = dict()
            obj['type'] = 'user'
            obj['user_id'] = uid
            obj['issue_id'] = issue_id
            obj['role'] = 'manager'
            obj['created'] = datetime.datetime.now()
            try:
                workerdb.insert(obj)
            except:
                pass
    
    # return: owner, manager, guest
    def role(self, issue_id, user_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])
        workrole = workerdb.get(issue_id=issue_id, user_id=user_id, role='owner')
        if workrole is None:
            workrole = workerdb.get(issue_id=issue_id, user_id=user_id, role='manager')
        if workrole is None:
            prole = self.project.member.auth()
            if prole in ['admin', 'manager']:
                return 'manager'
            return 'guest'
        return workrole['role']
            
    def managers(self, issue_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])
        rows = workerdb.rows(issue_id=issue_id, role="manager", fields="user_id")
        rows = [x['user_id'] for x in rows]
        return rows
    
    def owners(self, issue_id):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])
        rows = workerdb.rows(issue_id=issue_id, role="owner", fields="user_id")
        rows = [x['user_id'] for x in rows]
        return rows