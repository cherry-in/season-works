import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("wiki")
config = wiz.model("portal/wiki/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "content"

    id = pw.CharField(max_length=32, primary_key=True)
    type = pw.CharField(max_length=8, index=True)
    root_id = pw.CharField(max_length=32, index=True)
    book_id = pw.CharField(max_length=32, index=True)
    title = pw.CharField(max_length=192)
    content = pw.TextField()
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
