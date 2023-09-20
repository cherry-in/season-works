import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "member"

    id = pw.CharField(max_length=32, primary_key=True)
    project_id = pw.CharField(max_length=32, index=True)
    user = pw.CharField(max_length=255)
    role = pw.CharField(max_length=16)
    created = pw.DateTimeField()