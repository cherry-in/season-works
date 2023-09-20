import peewee as pw
orm = wiz.model("portal/season/orm")
base = orm.base("works")
config = wiz.model("portal/works/config")
prefix = config.db_prefix

class Model(base):
    class Meta:
        db_table = prefix + "user_project_config"

    id = pw.CharField(max_length=32, primary_key=True)
    user_id = pw.CharField(max_length=32)
    project_id = pw.CharField(max_length=32)
    key = pw.CharField(max_length=32)
    value = pw.CharField(max_length=192)
