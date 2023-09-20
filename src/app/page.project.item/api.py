projectModel = wiz.model("portal/works/project")

def get():
    data = None
    namespace = wiz.request.query("namespace", True)
    
    try:
        data = projectModel.get(namespace).data
    except:
        pass

    if data is None:
        wiz.response.status(404)

    wiz.response.status(200, data)