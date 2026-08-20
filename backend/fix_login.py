with open(r"x:\login\backend\main.py", "r", encoding="utf-8") as f:
    content = f.read()

bad_login = """        cursor.execute(
            \"\"\"SELECT l.hospital_id, l.user_name, l.hospital_name, l.hashed_password, r.role 
               FROM patient_analytics.login_credential.hospital_login l
               LEFT JOIN patient_analytics.login_credential.hospital_roles r ON l.hospital_id = r.hospital_id
               WHERE l.hospital_id = ?\"\"\",
            (hospital_id_expected,)
        )"""

good_login = """        cursor.execute(
            \"\"\"SELECT l.hospital_id, l.user_name, l.hospital_name, l.hashed_password, r.role 
               FROM patient_analytics.login_credential.hospital_login l
               LEFT JOIN patient_analytics.login_credential.hospital_roles r ON l.hospital_id = r.hospital_id
               WHERE l.hospital_id = ? OR l.email = ?\"\"\",
            (hospital_id_expected, credentials.user_id)
        )"""

content = content.replace(bad_login, good_login)

with open(r"x:\login\backend\main.py", "w", encoding="utf-8") as f:
    f.write(content)
