import json
from datetime import datetime

d1 = json.load(open('ceo-real-response.json', encoding='utf-8'))
d2 = json.load(open('ceo-real-response-2.json', encoding='utf-8'))
c1 = d1['ceo']
c2 = d2['ceo']

def fmt_decision(d):
    return f"- {d['id']} ({d['source']}) -> {d['decision']}\n  reason: {d['reason'][:200]}"

out = []
out.append('# CEO REAL RUN EXTRACT')
out.append('')
out.append('## CYCLE 1')
out.append(f"Date: {d1.get('date')}")
out.append(f"Mode: {c1['mode']}")
out.append(f"Autonomy: {c1['autonomyScore']}/{c1['autonomyMax']}")
out.append(f"Autonomy report: {json.dumps(c1['autonomyReport'], ensure_ascii=False)}")
out.append(f"Repaired: {c1['repaired']}")
out.append(f"Pending human: {c1['pendingHuman']}")
out.append(f"Failed repairs: {c1['failedRepairs']}")
out.append(f"Decisions: {len(c1['decisions'])}")
out.append(f"Learnings: {len(c1['learnings'])}")
out.append('')
out.append('### WHAT I SAW')
for o in c1.get('whatISaw', []):
    out.append(f"- [{o['source']}] {o['status']}: {o['note']}")
out.append('')
out.append('### BUSINESS SAW')
b1 = c1.get('business', {})
for k, v in b1.items():
    out.append(f"- {k}: {v}")
out.append('')
out.append('### WHAT I DECIDED')
for dec in c1.get('whatIDecided', []):
    out.append(fmt_decision(dec))
out.append('')
out.append('### WHAT I DID')
out.append(f"Repaired: {c1.get('whatIDid',{}).get('repaired',[])}")
out.append(f"Queued for human: {len(c1.get('whatIDid',{}).get('queued',[]))}")
out.append(f"Failed: {c1.get('whatIDid',{}).get('failed',[])}")
out.append('')
out.append('### WHAT I LEARNED')
for l in c1.get('whatILearned', [])[:5]:
    out.append(f"- {l['decisionId']} ({l['decision']}): {l['impact']} confidence={l['confidence']}")
out.append('')
out.append('## CYCLE 2')
out.append(f"Date: {d2.get('date')}")
out.append(f"Mode: {c2['mode']}")
out.append(f"Autonomy: {c2['autonomyScore']}/{c2['autonomyMax']}")
out.append(f"Autonomy report: {json.dumps(c2['autonomyReport'], ensure_ascii=False)}")
out.append(f"Repaired: {c2['repaired']}")
out.append(f"Pending human: {c2['pendingHuman']}")
out.append(f"Failed repairs: {c2['failedRepairs']}")
out.append(f"Decisions: {len(c2['decisions'])}")
out.append(f"Learnings: {len(c2['learnings'])}")
out.append('')
out.append('### BUSINESS SAW')
b2 = c2.get('business', {})
for k, v in b2.items():
    out.append(f"- {k}: {v}")
out.append('')

open('ceo-real-extract.md','w',encoding='utf-8').write('\n'.join(out))
print('written ceo-real-extract.md')
