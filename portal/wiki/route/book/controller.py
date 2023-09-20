import json

segment = wiz.request.match("/api/wiki/book/<book_id>/<path:path>")
action = segment.path
book_id = segment.book_id
bookModel = wiz.model("portal/wiki/book")
book = bookModel.get(book_id)

if action.startswith("load"):
    if book is None:
        wiz.response.status(404)
    wiz.response.status(200, book.data)

if action.startswith("update"):
    data = wiz.request.query("data", True)
    data = json.loads(data)
    data['id'] = book.data['id']
    
    namespaceChanged = False
    if book.data['namespace'] != data['namespace']:
        try:
            exists = bookModel.get(data['namespace'])
            if exists is not None:
                raise Excpetion("Exists Namespace")
        except:
            wiz.response.status(400, 'Namespace가 사용중입니다')
        namespaceChanged = True
    
    book.update(data)
    book = bookModel.get(book_id)
    wiz.response.status(200, data=book.data, namespaceChanged=namespaceChanged)

if action.startswith("content/load"):
    segment = wiz.request.match("/api/wiki/book/<book_id>/content/load/<content_id>")
    content_id = segment.content_id
    content = book.content.load(content_id)
    wiz.response.status(200, content)

if action.startswith("content/update"):
    data = wiz.request.query()
    content_id = book.content.update(data)
    wiz.response.status(200, content_id)

if action.startswith("content/delete"):
    content_id = wiz.request.query("id", True)
    book.content.delete(content_id)
    wiz.response.status(200)

if action.startswith("tree"):
    segment = wiz.request.match("/api/wiki/book/<book_id>/tree/<node_id>")
    node_id = segment.node_id
    if node_id is None: node_id = ""
    rows = book.content.tree(node_id)
    wiz.response.status(200, rows)

if action.startswith("revision/load"):
    segment = wiz.request.match("/api/wiki/book/<book_id>/revision/load/<content_id>")
    content_id = segment.content_id
    revisions = book.revision.load(content_id)
    wiz.response.status(200, revisions)

if action.startswith("revision/read"):
    segment = wiz.request.match("/api/wiki/book/<book_id>/revision/read/<revision_id>")
    revision_id = segment.revision_id
    res = book.revision.read(revision_id)
    wiz.response.status(200, res)

if action.startswith("revision/commit"):
    tag = wiz.request.query("tag", "")
    segment = wiz.request.match("/api/wiki/book/<book_id>/revision/commit/<content_id>")
    content_id = segment.content_id
    book.revision.commit(content_id, tag)
    wiz.response.status(200)

# Access API
if action.startswith("access/load"):
    members = book.access.list()
    wiz.response.status(200, members)

if action.startswith("access/create"):
    try:
        data = wiz.request.query()
        book.access.create(data['role'], data['key'], data['type'])
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

if action.startswith("access/remove"):
    try:
        data = wiz.request.query()
        book.access.remove(data)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

if action.startswith("access/update"):
    try:
        data = wiz.request.query()
        book.access.update(data)
    except Exception as e:
        wiz.response.status(500, str(e))
    wiz.response.status(200)

wiz.response.status(404)