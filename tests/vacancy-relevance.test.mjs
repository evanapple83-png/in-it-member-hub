import assert from 'node:assert/strict';
import test from 'node:test';
import { hasRelevanceProfile, rankVacancies, vacancyRelevance } from '../src/lib/vacancy-relevance.ts';
import { vacanciesHref } from '../src/lib/vacancy-filters.ts';
import { getAllVacancies } from '../src/lib/zzpdock.ts';

test('ranks skills above headline keywords and leaves ties in source order', () => {
  const profile = {skills:['Python'],headline:'Data engineer'};
  const rows = [{id:'a',title:'Data adviseur'}, {id:'b',title:'Python developer'}, {id:'c',title:'Python engineer'}, {id:'d',title:'Data adviseur'}];
  assert.deepEqual(rankVacancies(rows,profile).map(r=>r.vacancy.id),['c','b','a','d']);
  assert.deepEqual(vacancyRelevance(rows[1],profile).matches,['python']);
});
test('matches technical skills literally without partial word matches', () => {
  assert.equal(vacancyRelevance({title:'JavaScript developer'},{skills:['Java']}).score,0);
  assert.equal(vacancyRelevance({title:'C++ developer'},{skills:['C']}).score,0);
  for (const skill of ['C++','C#','.NET','React']) assert.ok(vacancyRelevance({title:`${skill} developer`},{skills:[skill]}).score > 0);
  assert.ok(vacancyRelevance({title:'Adviseur',extracted_requirements:['Python']},{skills:['Python']}).score > 0);
});
test('handles empty profiles and preserves sort in paginated filter links', () => {
  assert.equal(hasRelevanceProfile({skills:[],role:'Senior consultant'}),false);
  assert.equal(hasRelevanceProfile({skills:[],role:'Software developer'}),true);
  const url = new URL(vacanciesHref({q:'Python',sector:'ICT',province:''},2,'relevance'),'http://localhost');
  assert.equal(url.searchParams.get('sort'),'relevance'); assert.equal(url.searchParams.get('page'),'2'); assert.equal(url.searchParams.get('q'),'Python');
});
test('loads every API page before ranking and rejects incomplete feeds', async () => {
  const original = globalThis.fetch;
  const seen = [];
  try {
    globalThis.fetch = async (url, options) => {
      const params = new URL(url).searchParams, page = Number(params.get('page'));
      seen.push(page); assert.equal(params.get('sector'),'ICT'); assert.equal(options.next.revalidate,300);
      return Response.json({items:[{id:String(page),title:page === 3 ? 'Python developer' : 'Other'}],page,per_page:100,total:3,total_pages:3});
    };
    const all = await getAllVacancies({sector:'ICT'});
    assert.deepEqual(seen.sort(),[1,2,3]);
    assert.equal(rankVacancies(all,{skills:['Python']})[0].vacancy.id,'3');
    globalThis.fetch = async url => new URL(url).searchParams.get('page') === '1'
      ? Response.json({items:[],page:1,per_page:100,total:2,total_pages:2}) : new Response('',{status:503});
    await assert.rejects(getAllVacancies());
  } finally { globalThis.fetch = original; }
});
