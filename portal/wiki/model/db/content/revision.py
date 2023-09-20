import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("wiki")
config = wiz.model("portal/wiki/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "content_revision"

    id = pw.CharField(max_length=32, primary_key=True)
    user_id = pw.CharField(max_length=32, index=True)
    name = pw.CharField(max_length=64, index=True)
    content_id = pw.CharField(max_length=32, index=True)
    content = pw.TextField()
    created = pw.DateTimeField(index=True)
