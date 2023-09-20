import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "project"

    id = pw.CharField(max_length=32, primary_key=True)
    namespace = pw.CharField(max_length=32, unique=True)
    visibility = pw.CharField(max_length=16, index=True)
    title = pw.CharField(max_length=64)
    short = pw.CharField(max_length=16)
    status = pw.CharField(max_length=6, index=True)
    start = pw.DateField(index=True)
    end = pw.DateField(index=True)
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
    extra = base.JSONObject()
    icon = pw.TextField()
