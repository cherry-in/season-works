import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("wiki")
config = wiz.model("portal/wiki/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "access"

    id = pw.CharField(max_length=32, primary_key=True)
    book_id = pw.CharField(max_length=32, index=True)
    type = pw.CharField(max_length=8, index=True)
    key = pw.CharField(max_length=32, index=True)
    role = pw.CharField(max_length=8, index=True)
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
