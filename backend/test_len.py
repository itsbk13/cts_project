from main import get_analytics
import json

res = get_analytics("hosp_335078")
s = json.dumps(res, default=str)
print("Length of get_analytics JSON:", len(s))
print("Overview keys:", res.get("overview").keys())
