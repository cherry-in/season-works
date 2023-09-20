import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "attachment"

    id = pw.CharField(max_length=32, primary_key=True)
    project_id = pw.CharField(max_length=32, index=True)
    namespace = pw.CharField(max_length=192, index=True)
    user_id = pw.CharField(max_length=32, index=True)
    filename = pw.CharField(max_length=255, index=True)
    created = pw.DateTimeField(index=True)
