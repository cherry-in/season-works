import math
import json

project_id = wiz.request.query("project_id", True)
projectModel = wiz.model("portal/works/project")

project = projectModel.get(project_id)
bookModel = wiz.model("portal/wiki/book")

def search():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    dump = 10

    def query(db, qs):
        base = (db.id.in_(bookModel.workin(["admin", "user"], project_id, "project")))
        common = (db.title.contains(text))
        qs = qs.where(base & common)
        return qs

    total, rows = bookModel.search(query=query, page=page, dump=dump)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)

def create():
    data = wiz.request.query("data", True)
    data = json.loads(data)

    namespace = data['namespace']
    exists = bookModel.get(namespace)
    if exists is not None:
        wiz.response.status(400, 'Namespace가 사용중입니다')
    book_id = bookModel.create(data)
    book = bookModel.get(book_id)
    book.access.create("user", project_id, "project")
    wiz.response.status(200, book.data)

def connectWiki():
    wiki_ns = wiz.request.query("wiki_ns", True)
    wiki = bookModel.get(wiki_ns)
    wiki.access.accessLevel(["admin", "user"])
    wiki.access.create("user", project_id, "project")
    wiz.response.status(200, True)

def searchWiki():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    dump = 5

    membership = wiz.session.get("membership")
    visibility = ["public"]
    if membership in ["staff"]:
        visibility = ["public", "internal"]
    if membership in ["admin"]:
        visibility = ["public", "internal", "private"]

    wikiRange = wiz.request.query("range", "all")

    def query(db, qs):
        joined = projectModel.workin(['admin', 'manager', 'user'])
        projectref = bookModel.workin(["admin", "user"], joined, "project")
        userref = bookModel.workin(["admin", "user", "guest"])
        
        ref = projectref + userref
        ref = dict.fromkeys(ref)
        ref = list(ref)
        base = (db.id.in_(ref))
        base = base & (db.id.not_in(bookModel.workin(["admin", "user"], project_id, "project")))

        common = (db.title.contains(text))
        qs = qs.where(base & common)
        return qs

    total, rows = bookModel.search(query=query, page=page, dump=dump)
    wiz.response.status(200, rows=rows, lastpage=math.ceil(total/dump), page=page)
