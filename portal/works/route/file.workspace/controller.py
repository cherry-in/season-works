from PIL import Image

import math 
import season
import time
import datetime
import os
import urllib

segment = wiz.request.match("/api/works/attachment/<action>/<project_id>/<path:path>")
action = segment.action
project_id = segment.project_id

if wiz.session.get("access_project", None) != project_id:
    project = wiz.model("portal/works/project").get(project_id)
    project.member.accessLevel(["admin", "manager", "user", "guest", "visitor"])
    wiz.session.set(access_project=project_id)

fs = wiz.model("portal/works/fs").use(f"project/{project_id}/attachment")
cachefs = wiz.model("portal/works/fs").use(f"project/{project_id}/cache")

if action == 'upload':
    try:
        orm = wiz.model("portal/season/orm")
        attachmentdb = orm.use("attachment", module="works")
        config = wiz.model("portal/works/config")

        segment = wiz.request.match("/api/works/attachment/<action>/<project_id>/<namespace>/<path:path>")
        namespace = segment.namespace
        file = wiz.request.file("upload")
        if file is None: 
            wiz.response.status(404)

        filepath = str(int(time.time()*1000000)) + orm.random(16)
        while attachmentdb.get(id=filepath) is not None:
            filepath = str(int(time.time()*1000000)) + orm.random(16)

        fs.write.file(filepath, file)
        filename = file.filename
        urlfilename = urllib.parse.quote(file.filename)

        obj = dict()
        obj['id'] = filepath
        obj['project_id'] = project_id
        obj['namespace'] = namespace
        obj['user_id'] = config.session_user_id()
        obj['filename'] = filename
        obj['created'] = datetime.datetime.now()
        attachmentdb.insert(obj)
    except:
        wiz.response.json(dict(code=500))

    wiz.response.json(dict(
        code=200,
        filename=filename,
        project_id=project_id,
        id=filepath,
        url=f'/api/works/attachment/download/{project_id}/{filepath}/{urlfilename}'
    ))

elif action == 'download':
    segment = wiz.request.match("/api/works/attachment/<action>/<project_id>/<filepath>/<filename>")

    filepath = segment.filepath
    filename = segment.filename
    filename = urllib.parse.unquote(filename)

    if fs.isfile(filepath) == False:
        wiz.response.abort(404)
        
    filepath = fs.abspath(filepath)
    wiz.response.download(filepath, as_attachment=False, filename=filename)

elif action == 'thumbnail':
    segment = wiz.request.match("/api/works/attachment/<action>/<project_id>/<filepath>/<filename>")

    filepath = segment.filepath
    filename = segment.filename
    filename = urllib.parse.unquote(filename)

    if fs.isfile(filepath) == False:
        wiz.response.abort(404)
    
    resfilepath = fs.abspath(filepath)

    try:
        ext = os.path.splitext(filename)[-1]
        if ext.lower() in ['.png', '.jpg', '.jpeg']:
            cachefs.makedirs()
            cachefilepath = f"{filepath}{ext}"
            
            if cachefs.isfile(cachefilepath) == False:
                cachefs.copy(fs.abspath(filepath), cachefilepath)
                im = Image.open(cachefs.abspath(cachefilepath))
                ratio = 512 / im.size[0]
                size = (int(im.size[0] * ratio), int(im.size[1] * ratio))
                im.thumbnail(size)
                im.save(cachefs.abspath(cachefilepath))
            
            resfilepath = cachefs.abspath(cachefilepath)
    except Exception as e:
        pass

    wiz.response.download(resfilepath, as_attachment=False, filename=filename)
