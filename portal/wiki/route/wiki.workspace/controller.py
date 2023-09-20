from PIL import Image

import math 
import season
import time
import datetime
import os
import urllib

segment = wiz.request.match("/api/wiki/attachment/<action>/<book_id>/<path:path>")
action = segment.action
book_id = segment.book_id

if wiz.session.get("access_book", None) != book_id:
    book = wiz.model("portal/wiki/book").get(book_id)
    book.access.accessLevel(["admin", "user", "guest", "visitor"])
    wiz.session.set(access_book=book_id)

fs = wiz.model("portal/wiki/fs").use(f"book/{book_id}/attachment")
cachefs = wiz.model("portal/wiki/fs").use(f"book/{book_id}/cache")

if action == 'upload':
    try:
        orm = wiz.model("portal/season/orm")
        book = wiz.model("portal/wiki/book").get(book_id)
        file = wiz.request.file("upload")
        if file is None: 
            wiz.response.status(404)

        filename = file.filename
        filepath = book.content.update(dict(type="attachment", root_id="", title=filename))
        fs.makedirs(".")
        fs.write.file(filepath, file)
        urlfilename = urllib.parse.quote(file.filename)
    except Exception as e:
        wiz.response.json(dict(code=500))

    wiz.response.json(dict(
        code=200,
        filename=filename,
        book_id=book_id,
        id=filepath,
        url=f'/api/wiki/attachment/download/{book_id}/{filepath}/{urlfilename}'
    ))

elif action == 'download':
    segment = wiz.request.match("/api/wiki/attachment/<action>/<project_id>/<filepath>/<filename>")

    filepath = segment.filepath
    filename = segment.filename
    filename = urllib.parse.unquote(filename)

    if fs.isfile(filepath) == False:
        wiz.response.abort(404)
        
    filepath = fs.abspath(filepath)
    wiz.response.download(filepath, as_attachment=False, filename=filename)

elif action == 'thumbnail':
    segment = wiz.request.match("/api/wiki/attachment/<action>/<project_id>/<filepath>/<filename>")

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
