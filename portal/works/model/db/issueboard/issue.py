import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "issueboard_issue"

    id = pw.CharField(max_length=32, primary_key=True)
    project_id = pw.CharField(max_length=32, index=True)
    label_id = pw.CharField(max_length=32, index=True)
    user_id = pw.CharField(max_length=32, index=True)
    process = pw.IntegerField()
    level = pw.IntegerField(index=True)
    title = pw.CharField(max_length=128)
    status = pw.CharField(max_length=8, index=True)
    description = pw.TextField()
    planstart = pw.DateTimeField(index=True)
    planend = pw.DateTimeField(index=True)
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
    todo = base.JSONArray()
    worker = base.JSONArray()
