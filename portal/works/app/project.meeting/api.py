import os
import json
import datetime
import math

config = wiz.model("portal/works/config")
orm = wiz.model("portal/season/orm")

db = orm.use("meeting", module="works")

user_id = wiz.session.get("id")
project_id = wiz.request.query("project_id", True)
project = wiz.model("portal/works/project").get(project_id)

def search():
    text = wiz.request.query("text", "")
    rows = project.meeting.search(text)
    wiz.response.status(200, rows)

def read():
    meeting_id = wiz.request.query("id", True)
    data = project.meeting.get(meeting_id)
    isEditable = project.member.accessLevel(['admin', 'manager', 'user'], False)
    versions = project.meeting.versions(meeting_id)
    wiz.response.status(200, data=data, isEditable=isEditable, versions=versions)

def readVersion():
    version_id = wiz.request.query("version", True)
    data = project.meeting.version(version_id)
    wiz.response.status(200, data=data, isEditable=False)

def update():
    data = wiz.request.query()
    try:
        data['attachment'] = json.loads(data['attachment'])
    except:
        data['attachment'] = []
    data = project.meeting.update(data)
    wiz.response.status(200, id=data['id'])

def delete():
    meeting_id = wiz.request.query("id", True)
    project.meeting.delete(meeting_id)
    wiz.response.status(200, True)

def revision():
    meeting_id = wiz.request.query("id", True)
    project.meeting.versioning(meeting_id)
    wiz.response.status(200, True)