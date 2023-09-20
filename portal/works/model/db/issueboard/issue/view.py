import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "issueboard_issue_view"

    id = pw.CharField(max_length=32, primary_key=True)
    user_id = pw.CharField(max_length=32, index=True)
    issue_id = pw.CharField(max_length=32, index=True)
    last_viewed = pw.DateTimeField(index=True)
