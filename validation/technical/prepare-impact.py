from pathlib import Path
import json,csv
root=Path(__file__).parent
with (root.parent/'spanish/technical/index-comparison/index-comparison.csv').open(encoding='utf-8-sig',newline='') as f:
    es=[{'text_id':r['text_id'],'text':r['text']} for r in csv.DictReader(f)]
en=json.loads((root.parent/'english/technical/index-comparison/radar-results.json').read_text())['records']
(root/'impact-input.json').write_text(json.dumps({'es':es,'en':[{'text_id':r['text_id'],'text':r['text']} for r in en]},ensure_ascii=False),encoding='utf-8')
