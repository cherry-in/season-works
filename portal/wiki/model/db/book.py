import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("wiki")
config = wiz.model("portal/wiki/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "book"

    id = pw.CharField(max_length=32, primary_key=True)
    namespace = pw.CharField(max_length=32, unique=True)
    title = pw.CharField(max_length=64)
    visibility = pw.CharField(max_length=16, index=True)
    description = pw.TextField()
    home = pw.CharField(max_length=32)
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
    extra = base.JSONObject()
    icon = pw.TextField()
