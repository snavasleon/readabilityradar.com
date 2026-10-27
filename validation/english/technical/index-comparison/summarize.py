from pathlib import Path
from datetime import datetime, timezone
import csv, hashlib, json, math, statistics

root=Path(__file__).parent
radar=json.loads((root/'radar-results.json').read_text(encoding='utf-8-sig'))
word=json.loads((root/'word-results.json').read_text(encoding='utf-8-sig'))
assert len(radar['records'])==len(word['records'])==100
lookup={r['text_id']:r for r in word['records']}
assert len(lookup)==100
installed = (root/'calculate-radar.mjs').exists()
out=root if installed else root/'output'
out.mkdir(exist_ok=True)
records=[]
for r in radar['records']:
    w=lookup[r['text_id']]
    score=float(r['radar_score']); reference=round(float(w['word_flesch_reading_ease']),1)
    assert math.isfinite(score) and math.isfinite(reference)
    records.append(dict(text_id=r['text_id'],expected_difficulty=r['expected_difficulty'],
        radar_words=r['words'],word_words=w['word_words'],words_difference=r['words']-w['word_words'],
        radar_sentences=r['sentences'],word_sentences=w['word_sentences'],sentences_difference=r['sentences']-w['word_sentences'],
        radar_syllables=r['syllables'],radar_flesch_reading_ease=score,word_flesch_reading_ease=reference,
        score_difference=score-reference,absolute_score_difference=abs(score-reference),
        radar_score_bounded_for_comparison=min(100,max(0,score)),bounded_score_difference=min(100,max(0,score))-reference,
        word_score_at_boundary=reference<=0 or reference>=100,radar_level=r['radar_level'],
        word_flesch_kincaid_grade=round(float(w['word_flesch_kincaid_grade']),1),text=r['text']))

def score_category(score):
    if score>=90: return 'Very easy'
    if score>=80: return 'Easy'
    if score>=70: return 'Fairly easy'
    if score>=60: return 'Plain English'
    if score>=50: return 'Fairly difficult'
    if score>=30: return 'Difficult'
    return 'Very difficult'

def summary(rows,group,bounded=False):
    # Primary comparison retains Radar's original scores, including negatives.
    # The bounded scale is supplementary because Word reports within 0..100.
    x=[r['radar_score_bounded_for_comparison'] if bounded else r['radar_flesch_reading_ease'] for r in rows];y=[r['word_flesch_reading_ease'] for r in rows]
    dx=[a-b for a,b in zip(x,y)]; n=len(rows);mx=statistics.mean(x);my=statistics.mean(y)
    vx=statistics.pvariance(x);vy=statistics.pvariance(y);cov=statistics.mean((a-mx)*(b-my) for a,b in zip(x,y))
    interior=[r for r in rows if 0<r['word_flesch_reading_ease']<100 and 0<r['radar_flesch_reading_ease']<100]
    return dict(group=group,texts_compared=n,mean_radar_score=mx,mean_word_score=my,
        mean_signed_difference=statistics.mean(dx),mean_absolute_difference=statistics.mean(abs(d) for d in dx),
        root_mean_squared_difference=math.sqrt(statistics.mean(d*d for d in dx)),
        difference_standard_deviation=statistics.stdev(dx),
        maximum_absolute_difference=max(abs(d) for d in dx),
        exact_score_agreement=sum(abs(d)<1e-9 for d in dx)/n,
        within_one_point=sum(abs(d)<=1 for d in dx)/n,
        within_two_points=sum(abs(d)<=2 for d in dx)/n,
        within_three_points=sum(abs(d)<=3 for d in dx)/n,
        within_five_points=sum(abs(d)<=5 for d in dx)/n,
        category_agreement=sum(score_category(a)==score_category(b) for a,b in zip(x,y))/n,
        discrepancies_at_one_decimal=sum(math.floor(a*10+.5)!=math.floor(b*10+.5) for a,b in zip(x,y)),
        pearson_correlation=cov/math.sqrt(vx*vy) if vx>0 and vy>0 else None,
        lins_concordance_correlation=2*cov/(vx+vy+(mx-my)**2) if vx+vy+(mx-my)**2>0 else None,
        score_agreement_at_one_decimal=sum(math.floor(a*10+.5)==math.floor(b*10+.5) for a,b in zip(x,y))/n,
        word_count_agreement=sum(r['words_difference']==0 for r in rows)/n,
        sentence_count_agreement=sum(r['sentences_difference']==0 for r in rows)/n,
        word_scores_at_zero=sum(b==0 for b in y),word_scores_at_hundred=sum(b==100 for b in y),
        interior_pairs=len(interior),interior_mean_absolute_difference=statistics.mean(r['absolute_score_difference'] for r in interior) if interior else None)

summaries=[summary(records,'all')]+[summary([r for r in records if r['expected_difficulty']==g],g) for g in ('easy','difficult')]
for s in summaries:
    rows=records if s['group']=='all' else [r for r in records if r['expected_difficulty']==s['group']]
    bounded=summary(rows,s['group'],bounded=True)
    s['comparison_scale']='Original Radar scores (unbounded) versus Word scores (0-100)'
    for field in ('mean_radar_score','mean_signed_difference','mean_absolute_difference','root_mean_squared_difference','pearson_correlation','lins_concordance_correlation','score_agreement_at_one_decimal','within_one_point','within_two_points','within_three_points','within_five_points','category_agreement'):
        s['bounded_'+field]=bounded[field]
meta=word['metadata']
snapshot=dict(language='en',reference_software=meta['software'],reference_version=meta['version'],reference_build=meta['build'],
    proofing_language=meta['proofing_language'],language_id=meta['language_id'],metric='Flesch Reading Ease',
    generated_at=datetime.now(timezone.utc).isoformat(),radar_server_sha256=radar['server_sha256'],
    corpus_sha256=hashlib.sha256(json.dumps([{'text_id':r['text_id'],'text':r['text']} for r in records],ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),
    groups=summaries)
def write_csv(name,rows):
    with (out/name).open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]),quoting=csv.QUOTE_ALL);writer.writeheader();writer.writerows(rows)
write_csv('index-comparison.csv',records)
write_csv('agreement-summary.csv',[dict(**s,reference_software=meta['software'],reference_version=meta['version'],reference_build=meta['build'],proofing_language=meta['proofing_language'],generated_at=snapshot['generated_at'],radar_server_sha256=radar['server_sha256'],corpus_sha256=snapshot['corpus_sha256']) for s in summaries])
snapshot_path = root.parents[3]/'public/index-validation.json' if installed else out/'index-validation.json'
snapshot_path.write_text(json.dumps(snapshot,indent=2)+'\n',encoding='utf-8')
definitions={
 'difference_standard_deviation':'Sample standard deviation of original Radar minus Word paired differences, in points.',
 'maximum_absolute_difference':'Largest absolute original Radar minus Word difference, in points.',
 'exact_score_agreement':'Proportion of original-score pairs differing by less than 1e-9 points (floating-point tolerance).',
 'within_one_point':'Proportion with absolute original-score difference at most 1 point. Descriptive tolerance, not validated acceptance criterion.',
 'within_two_points':'Proportion with absolute original-score difference at most 2 points. Descriptive tolerance, not validated acceptance criterion.',
 'within_three_points':'Proportion with absolute original-score difference at most 3 points. Descriptive tolerance, not validated acceptance criterion.',
 'within_five_points':'Proportion with absolute original-score difference at most 5 points. Descriptive tolerance, not validated acceptance criterion.',
 'category_agreement':'Proportion with the same Flesch Reading Ease category after applying the application thresholds to original Radar and Word scores.',
 'discrepancies_at_one_decimal':'Number of original-score pairs not equal after rounding both scores to one decimal.',
 'text_id':'Stable synthetic-text identifier.', 'expected_difficulty':'Intended writing group, not an independently validated reading level.',
 'radar_words':'Words counted by Radar.', 'word_words':'Words returned by Microsoft Word ReadabilityStatistics.',
 'words_difference':'Radar words minus Word words.', 'radar_sentences':'Sentences counted by Radar.',
 'word_sentences':'Sentences returned by Word.', 'sentences_difference':'Radar sentences minus Word sentences.',
 'radar_syllables':'Estimated syllables from Radar. Word does not expose its syllable count in these statistics.',
 'radar_flesch_reading_ease':'Original Radar score: negative values retained; application caps values above 100.',
 'word_flesch_reading_ease':'Flesch Reading Ease returned by Word, normalized to its displayed one decimal to remove binary floating-point artifacts. Not Flesch-Kincaid Grade Level.',
 'score_difference':'Original Radar score minus Word score, in index points.', 'absolute_score_difference':'Absolute original score difference.',
 'radar_score_bounded_for_comparison':'Diagnostic copy bounded to 0..100 for a separate comparison. Does not change the original Radar score.',
 'bounded_score_difference':'Bounded diagnostic Radar score minus Word score.',
 'word_score_at_boundary':'TRUE when Word returns a score at or beyond 0 or 100; FALSE otherwise.',
 'radar_level':'Radar category derived from its score, not an independent outcome.',
 'word_flesch_kincaid_grade':'Separate Word school-grade metric, recorded as supplementary information; NOT used as the score reference.',
 'text':'Exact original English text passed unchanged to both systems.',
 'group':'all = all 100 texts; easy or difficult = the 50-text intended subgroup.',
 'texts_compared':'Number of paired observations in this group.', 'mean_radar_score':'Mean original Radar score.', 'mean_word_score':'Mean Word score.',
 'mean_signed_difference':'Mean of original Radar minus Word. Negative means Radar scores lower.',
 'mean_absolute_difference':'Mean absolute original Radar minus Word difference, in points.',
 'root_mean_squared_difference':'Square root of the mean squared original score difference, in points.',
 'pearson_correlation':'Pearson r for original paired scores. Association is not agreement. Blank if a series is constant.',
 'lins_concordance_correlation':"Lin's concordance correlation coefficient for original paired scores, using population variance and covariance. Combines association with location and scale agreement. Blank if undefined.",
 'score_agreement_at_one_decimal':'Proportion with scores equal after rounding to one decimal; denominator is texts_compared.',
 'word_count_agreement':'Proportion with identical word counts.', 'sentence_count_agreement':'Proportion with identical sentence counts.',
 'word_scores_at_zero':'Number of Word scores equal to 0.', 'word_scores_at_hundred':'Number of Word scores equal to 100.',
 'interior_pairs':'Number of pairs for which both original scores are strictly between 0 and 100.',
 'interior_mean_absolute_difference':'Mean absolute original score difference on interior_pairs only. Excludes boundary effects; blank if none.',
 'reference_software':'External comparator used: installed Microsoft Word desktop application.',
 'reference_version':'Word application version reported by automation.', 'reference_build':'Word application build reported by automation.',
 'proofing_language':'Document proofing language explicitly set to English (United States), language ID 1033.',
 'generated_at':'UTC time the paired summary was generated.', 'radar_server_sha256':'SHA-256 of the Radar server source used to calculate scores.',
 'corpus_sha256':'SHA-256 of canonical UTF-8 JSON containing ordered text_id/text objects (compact separators).'
}
definitions['comparison_scale']='Primary comparison uses original Radar scores, including negatives, versus Word scores. Bounded metrics are supplementary because Word reports within 0..100.'
for field in ('mean_radar_score','mean_signed_difference','mean_absolute_difference','root_mean_squared_difference','pearson_correlation','lins_concordance_correlation','score_agreement_at_one_decimal','within_one_point','within_two_points','within_three_points','within_five_points','category_agreement'):
    definitions['bounded_'+field]=definitions[field].replace('original ', '')+' Supplementary calculation after bounding Radar to 0..100.'
(out/'column-definitions.json').write_text(json.dumps(definitions,indent=2)+'\n',encoding='utf-8')
for name,rows in [('index-comparison',records),('agreement-summary',summaries)]:
    columns=list(rows[0])
    if name=='agreement-summary': columns=list(summaries[0])+['reference_software','reference_version','reference_build','proofing_language','generated_at','radar_server_sha256','corpus_sha256']
    assert all(c in definitions for c in columns)
    text=f'# {name}.csv\n\nUTF-8 with BOM; comma-separated, quoted fields; CRLF lines; dot decimals. Blank means unavailable, not zero. CSV does not store fonts or widths.\n\n| Column | Meaning |\n| --- | --- |\n'+ '\n'.join(f'| {c} | {definitions[c]} |' for c in columns)
    if not installed:
        (out/(name+'.README.md')).write_text(text+'\n',encoding='utf-8')
print(json.dumps(summaries,indent=2))
