import json

pid = wiz.request.query("project_id", True)
projectModel = wiz.model("portal/works/project")
project = projectModel.get(pid)

def load():
    issue_id = wiz.request.query("issue_id", True)
    info = project.issueboard.issue.get(issue_id)
    wiz.response.status(200, info)

def update():
    data = wiz.request.query("data", True)
    data = json.loads(data)
    data = project.issueboard.issue.update(data)
    wiz.response.status(200, data)

def message():
    message_id = wiz.request.query("message_id", True)
    issue = project.issueboard.message.get(message_id)
    wiz.response.status(200, issue)

def messages():
    issue_id = wiz.request.query("issue_id", True)
    _type = wiz.request.query("type", True)
    favorite = None
    if _type == 'favorite':
        _type = ['message', 'file']
        favorite = 1
    if _type == 'message':
        _type = ['message', 'file']
    first = wiz.request.query("first", None)
    rows = project.issueboard.message.list(issue_id, type=_type, first=first, favorite=favorite)
    wiz.response.status(200, rows)

def unreadMessages():
    issue_id = wiz.request.query("issue_id", True)
    _type = wiz.request.query("type", True)
    favorite = None
    if _type == 'favorite':
        _type = ['message', 'file']
        favorite = 1
    if _type == 'message':
        _type = ['message', 'file']
    last = wiz.request.query("last", None)
    rows = project.issueboard.message.unread(issue_id, type=_type, last=last, favorite=favorite)
    wiz.response.status(200, rows)

def sendMessage():
    issue_id = wiz.request.query("issue_id", True)
    data = wiz.request.query("data", True)
    data = json.loads(data)
    data['issue_id'] = issue_id
    project.issueboard.message.update(data)
    wiz.response.status(200)

def favoriteMessage():
    message_id = wiz.request.query("id", True)
    issue_id = wiz.request.query("issue_id", True)
    favorite = wiz.request.query("favorite", True)
    project.issueboard.message.updateFavorite(message_id, favorite)
    wiz.response.status(200)
