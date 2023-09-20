class Controller:
    def __init__(self, server):
        self.server = server

    def connect(self):
        pass

    def join(self, data, io):
        project_id = data['project_id']
        io.join(project_id)

    def leave(self, data, io):
        project_id = data['project_id']
        io.leave(project_id)

    def disconnect(self, flask, io):
        pass