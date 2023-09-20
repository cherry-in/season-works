import math
import json

bookModel = wiz.model("portal/wiki/book")
projectModel = wiz.model("portal/works/project")

def search():
    page = int(wiz.request.query("page", 1))
    text = wiz.request.query("text", "")
    dump = 10

    membership = wiz.session.get("membership")
    visibility = ["public"]
    if membership in ["staff"]:
        visibility = ["public", "internal"]
    if membership in ["admin"]:
        visibility = ["public", "internal", "private"]

    wikiRange = wiz.request.query("range", "all")

    def query(db, qs):
        joined = projectModel.workin(['admin', 'manager', 'user'])
        projectref = bookModel.workin(["admin"], joined, "project")
        userref = bookModel.workin(["admin", "user", "guest"])
        
        ref = projectref + userref
        ref = dict.fromkeys(ref)
        ref = list(ref)        
        base = (db.visibility.in_(visibility) | db.id.in_(ref))
        common = (db.title.contains(text))

        if wikiRange == 'manage':
            base = (db.id.in_(bookModel.workin(["admin"])))
        elif wikiRange == 'join':
            base = (db.id.in_(ref))

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
    wiz.response.status(200, book.data)
