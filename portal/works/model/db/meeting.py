import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "meeting"

    id = pw.CharField(max_length=32, primary_key=True)
    project_id = pw.CharField(max_length=32, index=True)
    user_id = pw.CharField(max_length=32, index=True)
    status = pw.CharField(max_length=8, index=True)
    meetdate = pw.DateTimeField()
    title = pw.CharField(max_length=192)
    content = pw.TextField()
    attachment = base.JSONArray()
    created = pw.DateTimeField()
    updated = pw.DateTimeField()
