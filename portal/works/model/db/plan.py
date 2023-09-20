import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "plan"

    id = pw.CharField(max_length=32, primary_key=True)
    parent = pw.CharField(max_length=32)
    order = pw.IntegerField()
    status = pw.CharField(max_length=8)
    project_id = pw.CharField(max_length=32, index=True)
    title = pw.CharField(max_length=64)
    mm = pw.FloatField()
    period = pw.IntegerField()
    user = pw.CharField(max_length=255)
    start = pw.DateField()
    end = pw.DateField()
    created = pw.DateTimeField()
    updated = pw.DateTimeField()
    extra = base.JSONObject()
