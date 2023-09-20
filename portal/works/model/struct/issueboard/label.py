import datetime

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
labeldb = orm.use("issueboard/label", module="works")
issuedb = orm.use("issueboard/issue", module="works")

class Model:
    def __init__(self, issueboard):
        self.issueboard = issueboard
        self.project = issueboard.project
        self.project_id = issueboard.project.data['id']
    
    def list(self):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        project_id = self.project_id
        labels = labeldb.rows(project_id=project_id)

        issues = issuedb.rows(project_id=project_id, status=['open', 'work', 'finish', 'noti'], fields="id")
        issues = [x['id'] for x in issues]
        classified = []
        undefined = -1
        
        for i in range(len(labels)):
            labelIssues = []
            for issue in labels[i]['issues']:
                if issue in issues:
                    labelIssues.append(issue)
                    classified.append(issue)
            labels[i]['issues'] = labelIssues
            labels[i]['closeCount'] = self.search("close", label_id=labels[i]['id'], as_count=True)
            labels[i]['cancelCount'] = self.search("cancel", label_id=labels[i]['id'], as_count=True)

            if labels[i]['mode'] == 1:
                undefined = i

        for issue in issues:
            if issue not in classified:
                labels[undefined]['issues'].append(issue)

        return labels

    def search(self, status, page=1, dump=20, label_id=None, as_count=False):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        project_id = self.project_id
        
        kwargs = dict()
        kwargs['fields'] = 'id'
        kwargs['status'] = status
        kwargs['project_id'] = project_id
        kwargs['order'] = "DESC"
        kwargs['orderby'] = "updated"
        
        if as_count == False:
            kwargs['page'] = page
            kwargs['dump'] = dump
        
        if label_id is None:
            labels = labeldb.rows(project_id=project_id, mode=0, fields="id")
            labels = [x['id'] for x in labels]
            def queryObject(field):
                return field.not_in(labels)
            kwargs['label_id'] = queryObject
        else:
            kwargs['label_id'] = label_id

        total = issuedb.count(**kwargs)
        if as_count:
            return total

        rows = issuedb.rows(**kwargs)
        rows = [x['id'] for x in rows]

        return total, rows

    def closedList(self, **kwargs):
        return self.search("close", **kwargs)
    
    def canceledList(self, **kwargs):
        return self.search("cancel", **kwargs)

    def create(self, title="", mode=0, order=999999, **kwargs):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        obj = dict()
        obj['title'] = title
        obj['project_id'] = self.project_id
        obj['order'] = order
        obj['issues'] = []
        obj['mode'] = mode
        insert_id = labeldb.insert(obj)
        obj = labeldb.get(id=insert_id)

        self.issueboard.emit("label", "created")
        self.project.updateTime()
        return obj
    
    def remove(self, label_id):
        self.project.member.accessLevel(['admin', 'manager'])
        project_id = self.project_id
        labeldb.delete(id=label_id, project_id=project_id)

        self.issueboard.emit("label", "deleted")
        self.project.updateTime()

    def update(self, items):
        self.project.member.accessLevel(['admin', 'manager', 'user'])

        for data in items:
            project_id = self.project_id
            label_id = data['id']

            allowed = ['title', 'order', 'issues']
            keys = []
            for key in data:
                keys.append(key)
            for key in keys:
                if key not in allowed:
                    del data[key]

            labeldb.update(data, id=label_id, project_id=project_id)

        self.issueboard.emit("label", "updated")
        self.project.updateTime()