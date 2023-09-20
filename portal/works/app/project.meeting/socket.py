class Controller:
    def __init__(self, server):
        self.server = server

    def connect(self):
        pass

    def join(self, data, io):
        meeting_id = data['meeting_id']
        io.join(meeting_id)

    def leave(self, data, io):
        meeting_id = data['meeting_id']
        io.leave(meeting_id)

    def disconnect(self, flask, io):
        pass