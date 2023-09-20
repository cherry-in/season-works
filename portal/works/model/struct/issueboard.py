import datetime

config = wiz.model("portal/works/config")
Label = wiz.model("portal/works/struct/issueboard/label")
Issue = wiz.model("portal/works/struct/issueboard/issue")
Worker = wiz.model("portal/works/struct/issueboard/worker")
Message = wiz.model("portal/works/struct/issueboard/message")

class Model:
    def __init__(self, project):
        self.project = project
        self.project_id = project.data['id']

        self.issue = Issue(self)
        self.label = Label(self)
        self.worker = Worker(self)
        self.message = Message(self)

    def emit(self, event, data):
        socketio = wiz.server.app.socketio
        branch = wiz.branch()
        socketNamespace = f"/wiz/app/{branch}/portal.works.project.issueboard"
        socketio.emit(event, data, to=self.project_id, namespace=socketNamespace, broadcast=True)
        socketio.emit("updated", True, namespace=socketNamespace, broadcast=True)
