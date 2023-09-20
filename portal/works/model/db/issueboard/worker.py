import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "issueboard_worker"

    id = pw.CharField(max_length=32, primary_key=True)
    type = pw.CharField(max_length=32, index=True)
    user_id = pw.CharField(max_length=32, index=True)
    issue_id = pw.CharField(max_length=32, index=True)
    role = pw.CharField(max_length=16, index=True)
    created = pw.DateTimeField(index=True)
