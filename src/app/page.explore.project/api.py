import math
import json

projectModel = wiz.model("portal/works/project")

def search():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    sort = wiz.request.query("sort", "updated")
    dump = 20

    membership = wiz.session.get("membership")
    visibility = ["public"]
    if membership in ["staff"]:
        visibility = ["public", "internal"]
    if membership in ["admin"]:
        visibility = ["public", "internal"]

    status = wiz.request.query("status", "open")
    projectRange = wiz.request.query("range", "all")

    def query(db, qs):
        base = ((db.visibility.in_(visibility)) | db.id.in_(projectModel.workin(["admin", "manager", "user", "guest"])))
        common = (db.title.contains(text)) & db.status.in_([status])
        if projectRange == 'manage':
            base = (db.id.in_(projectModel.workin(["admin"])))
        elif projectRange == 'join':
            base = (db.id.in_(projectModel.workin(["admin", "manager", "user", "guest"])))
        
        qs = qs.where(base & common)
        return qs
    
    total, rows = projectModel.search(query=query, page=page, dump=dump, sort=sort)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def create():
    project_id = projectModel.create()
    project = projectModel.get(project_id)
    wiz.response.status(200, project.data)

def delete():
    project_id = wiz.request.query("id", True)
    project = projectModel.get(project_id)
    project.delete()
    wiz.response.status(200)

def update():
    data = wiz.request.query("data", True)
    data = json.loads(data)
    project_id = data['id']
    project = projectModel.get(project_id)
    if project.data['namespace'] != data['namespace']:
        try:
            exists = projectModel.get(data['namespace'])
            if exists is not None:
                raise Excpetion("Exists Namespace")
        except:
            wiz.response.status(400, 'Namespace가 사용중입니다')
    data['status'] = 'open'
    project.update(data)
    project = projectModel.get(project_id)
    wiz.response.status(200, project.data)