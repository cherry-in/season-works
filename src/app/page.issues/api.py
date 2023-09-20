import json
config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")
viewdb = orm.use("issueboard/issue/view", module="works")
issueworkerdb = orm.use("issueboard/issue/worker", module="works")
workdb = orm.use("issueboard/worker", module="works")
projectdb = orm.use("project", module="works")
projectModel = wiz.model("portal/works/project")

def search():
    page = int(wiz.request.query("page", 1))
    category = wiz.request.query("category", "all")
    
    dump = 10
    fields = 'id,project_id,status,title,user_id,worker,updated,planend'
    untracks = projectModel.untracks()
    
    def query(db, qs):
        if category == 'request':
            base = db.user_id.in_([config.session_user_id()]) & db.status.in_(['open', 'work', 'finish'])
        elif category == 'work':
            base = db.worker_id.in_([config.session_user_id()]) & db.status.in_(['open', 'work', 'finish']) & db.role.in_(['manager'])
        else:
            myproject = projectModel.workin(["admin", "manager", "user", "guest"])
            base = db.project_id.in_(myproject) & db.status.in_(['open', 'work', 'finish'])
            if len(untracks) > 0:
                base = base & db.project_id.not_in(untracks)
        qs = qs.where(base)
        return qs

    rows = issueworkerdb.rows(query=query, fields=fields, order="DESC", orderby="updated", page=page, dump=dump, groupby="id")
    isLast = len(rows) == 0

    if isLast:
        rows = issueworkerdb.rows(query=query, fields=fields, order="DESC", orderby="updated", page=50, dump=10, groupby="id")
    elif page != 1:
        rows = rows + issueworkerdb.rows(query=query, fields=fields, order="DESC", orderby="updated", page=1, dump=10, groupby="id")

    issue_ids = [x['id'] for x in rows]
    views = viewdb.rows(fields="issue_id,last_viewed", user_id=config.session_user_id(), issue_id=issue_ids)
    viewmap = dict()
    for view in views:
        viewmap[view['issue_id']] = view['last_viewed'].timestamp()
    
    users = dict()
    cache = dict()
    for item in rows:
        project_id = item['project_id']
        if project_id in cache:
            project = cache[project_id]
        else:
            project = projectdb.get(id=project_id, fields="id,namespace,title,short,icon")
            if project is None: project = dict()
            cache[project_id] = project
        item['project'] = project

        users[item['user_id']] = dict()
        for worker in item['worker']:
            users[worker] = dict()

        item['unread'] = True
        if item['id'] in viewmap:
            if item['updated'].timestamp() < viewmap[item['id']]:
                item['unread'] = False

    for key in users:
        users[key] = config.get_user_info(wiz, key)

    wiz.response.status(200, issues=rows, users=users, isLast=isLast)
