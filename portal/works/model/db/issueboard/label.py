import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "issueboard_label"

    id = pw.CharField(max_length=32, primary_key=True)
    title = pw.CharField(max_length=32)
    project_id = pw.CharField(max_length=32, index=True)
    order = pw.IntegerField()
    issues = base.JSONArray()
    mode = pw.IntegerField()