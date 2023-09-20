import datetime

orm = wiz.model("portal/season/orm")
db = orm.use("plan", module="works")

class Model:
    def __init__(self, project):
        self.project = project
        self.project_id = project.data['id']

    def load(self):
        self.project.member.accessLevel(['admin', 'manager', 'user', 'guest'])

        project_id = self.project_id
        data = db.rows(project_id=project_id, status=["ready", "active", "finish"], parent=0, order="ASC", orderby="order")
        for i in range(len(data)):
            item_id = data[i]['id']
            data[i]['child'] = db.rows(parent=item_id, status=["ready", "active", "finish"], order="ASC", orderby="order")
        return data
    
    def update(self, data):
        self.project.member.accessLevel(['admin', 'manager'])

        project_id = self.project_id
        
        def insertData(item):
            item['project_id'] = project_id
            if 'created' not in item:
                item['created'] = datetime.datetime.now()
            if 'status' not in item or len(item['status']) == 0:
                item['status'] = 'ready'
            item['updated'] = datetime.datetime.now()
            return db.insert(item)

        idata = []
        for i in range(len(data)):
            item = data[i]
            item['order'] = i + 1
            item['parent'] = 0

            if 'status' not in item:
                item['status'] = 'ready'

            if 'id' not in item:
                if item['status'] != 'deleted':
                    item['id'] = insertData(item)

            if 'id' in item:
                if 'child' in item:
                    for j in range(len(item['child'])):
                        child = item['child'][j]

                        if 'status' not in child:
                            child['status'] = 'ready'

                        if 'id' not in child and child['status'] == 'deleted':
                            continue
                        child['order'] = j + 1
                        child['parent'] = item['id']
                        idata.append(child)
                
                del item['child']
                idata.append(item)

        for item in idata:
            item['project_id'] = project_id
            if 'created' not in item:
                item['created'] = datetime.datetime.now()
            if 'status' not in item or len(item['status']) == 0:
                item['status'] = 'ready'
            item['updated'] = datetime.datetime.now()            
            if 'id' in item:
                db.update(item, id=item['id'])
            else:
                db.insert(item)

        self.project.updateTime()