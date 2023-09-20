import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "issueboard_message"

    id = pw.BigIntegerField(primary_key=True)
    parent_id = pw.BigIntegerField(index=True)
    type = pw.CharField(max_length=12, index=True)
    issue_id = pw.CharField(max_length=32, index=True)
    user_id = pw.CharField(max_length=32, index=True)
    message = pw.TextField()
    attachment = base.JSONArray()
    images = base.JSONArray()
    created = pw.DateTimeField(index=True)
    updated = pw.DateTimeField(index=True)
    favorite = pw.IntegerField(index=True)
