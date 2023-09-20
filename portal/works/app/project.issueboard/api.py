import json
import time
import math

pid = wiz.request.query("project_id", True)
projectModel = wiz.model("portal/works/project")
project = projectModel.get(pid)

def load():
    labels = project.issueboard.label.list()
    wiz.response.status(200, labels)

def search():
    dump = 20
    label_id = wiz.request.query("label_id", None)
    status = wiz.request.query("status", True)
    page = wiz.request.query("page", 1)
    page = int(page)
    total, rows = project.issueboard.label.search(status, page=page, label_id=label_id, dump=dump)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def addLabel():
    query = wiz.request.query()
    obj = project.issueboard.label.create(**query)
    wiz.response.status(200, obj)

def removeLabel():
    label_id = wiz.request.query("id")
    project.issueboard.label.remove(label_id)
    wiz.response.status(200)

def updateLabels():
    data = wiz.request.query("data")
    data = json.loads(data)
    project.issueboard.label.update(data)
    wiz.response.status(200)

def loadIssues():
    issueIds = wiz.request.query("issueIds")
    issueIds = json.loads(issueIds)
    issues = project.issueboard.issue.load(issueIds)
    wiz.response.status(200, issues)

def updateIssue():
    data = wiz.request.query("data", True)
    data = json.loads(data)
    for item in data:
        project.issueboard.issue.updateLabel(item['issue_id'], item['label_id'])
    wiz.response.status(200)