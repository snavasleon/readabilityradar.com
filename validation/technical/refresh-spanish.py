from pathlib import Path
import csv, json, subprocess, os
root=Path(__file__).parent
csv_path=root.parent/'spanish/technical/index-comparison/index-comparison.csv'
with csv_path.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);headers=reader.fieldnames;rows=list(reader)
output=subprocess.run([os.environ.get('RADAR_NODE','node'),str(root/'calculate-texts.mjs')],input=json.dumps({'language':'es','texts':rows},ensure_ascii=False),text=True,encoding='utf-8',capture_output=True,check=True)
calculated=json.loads(output.stdout)
changes=[]
for before,after in zip(rows,calculated['records']):
    changes.append({'text_id':before['text_id'],'previous_score':float(before['index_raw']),'current_score':after['index_raw'],'score_change':after['index_raw']-float(before['index_raw']),'category_changed':before['inflesz_category']!=after['inflesz_category']})
with csv_path.open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=headers,quoting=csv.QUOTE_ALL);writer.writeheader()
    for row in calculated['records']: writer.writerow({key:row[key] for key in headers})
with (root/'spanish-processing-changes.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=list(changes[0]),quoting=csv.QUOTE_ALL);writer.writeheader();writer.writerows(changes)
(root/'spanish-processing-version.json').write_text(json.dumps({'server_sha256':calculated['server_sha256'],'texts':len(rows),'changed_scores':sum(abs(r['score_change'])>1e-10 for r in changes),'changed_categories':sum(r['category_changed'] for r in changes),'external_inflesz':'pending'},indent=2),encoding='utf-8')
print('Spanish texts recalculated:',len(rows),'changed scores:',sum(abs(r['score_change'])>1e-10 for r in changes))
