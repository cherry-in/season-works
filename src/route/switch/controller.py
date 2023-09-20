role = wiz.session.get('membership')
if role not in 'admin':
    wiz.response.status(401)

segment = wiz.request.match("/switch/<path:path>")
user_id = segment.path

orm = wiz.model("portal/season/orm")
db = orm.use("user")

user = db.get(id=user_id)
if user is None:
    user = db.get(email=user_id)

if user is None:
    wiz.response.status(404)

user_id = user['id']
wiz.session.create(user_id)
wiz.session.set(membership="admin")

wiz.response.status(200, wiz.session.get())
