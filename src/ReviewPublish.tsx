import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

type Kind='cases'|'chapters'|'content'|'weekly'|'resolver';
type Role='viewer'|'author'|'reviewer'|'publisher'|'admin';

type Props={onClose:()=>void};

const labels:Record<Kind,string>={cases:'Clinical Cases',chapters:'Kapitel',content:'Lerninhalte',weekly:'Case of the Week',resolver:'Resolver'};

export default function ReviewPublish({onClose}:Props){
  const[kind,setKind]=useState<Kind>('cases');
  const[role,setRole]=useState<Role>('viewer');
  const[rows,setRows]=useState<any[]>([]);
  const[msg,setMsg]=useState('');
  const[busy,setBusy]=useState('');

  const canReview=['reviewer','publisher','admin'].includes(role);
  const canPublish=['publisher','admin'].includes(role);

  const load=async()=>{
    const u=await supabase.auth.getUser();
    if(u.data.user){const p=await supabase.from('profiles').select('role').eq('id',u.data.user.id).single();if(p.data?.role)setRole(p.data.role as Role)}
    const q=kind==='cases'
      ? supabase.from('cases').select('id,case_code,scenario_code,purpose,status,updated_at,case_translations(locale,title,status)').neq('status','archived').order('updated_at',{ascending:false})
      : kind==='chapters'
      ? supabase.from('chapters').select('id,code,status,content_version,updated_at,chapter_translations(locale,title,status)').neq('status','archived').order('updated_at',{ascending:false})
      : kind==='content'
      ? supabase.from('content_items').select('id,content_code,content_type,status,content_version,updated_at,content_translations(locale,payload,status)').neq('status','archived').order('updated_at',{ascending:false})
      : kind==='weekly'
      ? supabase.from('weekly_cases').select('id,week_start,status,bonus_xp,updated_at,weekly_case_translations(locale,title)').order('week_start',{ascending:false})
      : supabase.from('resolver_lexicons').select('id,locale,version,status,minimum_app_version,published_at').order('locale').order('version',{ascending:false});
    const r=await q;if(r.error)setMsg(r.error.message);else setRows(r.data||[]);
  };
  useEffect(()=>{load()},[kind]);

  const title=(r:any)=>{
    if(kind==='cases')return r.case_translations?.find((x:any)=>x.locale==='de')?.title||r.case_code;
    if(kind==='chapters')return r.chapter_translations?.find((x:any)=>x.locale==='de')?.title||r.code;
    if(kind==='content')return r.content_translations?.find((x:any)=>x.locale==='de')?.payload?.title||r.content_code;
    if(kind==='weekly')return r.weekly_case_translations?.find((x:any)=>x.locale==='de')?.title||r.week_start;
    return `${r.locale} · v${r.version}`;
  };
  const code=(r:any)=>kind==='cases'?r.case_code:kind==='chapters'?r.code:kind==='content'?r.content_code:kind==='weekly'?r.week_start:`${r.locale} / v${r.version}`;

  const updateStatus=async(r:any,status:'in_review'|'approved'|'published')=>{
    setBusy(r.id+status);setMsg('');
    try{
      if(status==='approved'&&!canReview)throw new Error('Freigabe erfordert Reviewer-, Publisher- oder Admin-Rolle.');
      if(status==='published'&&!canPublish)throw new Error('Veröffentlichen erfordert Publisher- oder Admin-Rolle.');
      const table=kind==='cases'?'cases':kind==='chapters'?'chapters':kind==='content'?'content_items':kind==='weekly'?'weekly_cases':'resolver_lexicons';
      const u=await supabase.from(table).update({status}).eq('id',r.id);if(u.error)throw u.error;
      if(kind==='cases'){const t=await supabase.from('case_translations').update({status}).eq('case_id',r.id);if(t.error)throw t.error}
      if(kind==='chapters'){const t=await supabase.from('chapter_translations').update({status}).eq('chapter_id',r.id);if(t.error)throw t.error}
      if(kind==='content'){const t=await supabase.from('content_translations').update({status}).eq('content_item_id',r.id);if(t.error)throw t.error}
      setMsg(`${code(r)} → ${status}`);await load();
    }catch(e:any){setMsg(e.message||String(e))}finally{setBusy('')}
  };

  const runtimeCheck=async(r:any)=>{
    setBusy(r.id+'runtime');setMsg('');try{
      if(kind==='cases'){
        const x=await supabase.rpc('get_runtime_case_package_v1',{p_case_code:r.case_code,p_locale:'de'});if(x.error)throw x.error;if(!x.data)throw new Error('Kein Runtime-Paket verfügbar.');setMsg(`✓ ${r.case_code}: Runtime-Paket DE ist abrufbar.`)
      }else if(kind==='resolver'){
        const x=await supabase.rpc('get_runtime_resolver_lexicon_v1',{p_locale:r.locale});if(x.error)throw x.error;if(!x.data)throw new Error('Kein veröffentlichtes Runtime-Lexikon verfügbar.');setMsg(`✓ Resolver ${r.locale}: Runtime-Lexikon v${x.data.version} ist abrufbar.`)
      }
    }catch(e:any){setMsg(e.message||String(e))}finally{setBusy('')}
  };

  const counts=useMemo(()=>({review:rows.filter(r=>r.status==='in_review').length,approved:rows.filter(r=>r.status==='approved').length,published:rows.filter(r=>r.status==='published').length}),[rows]);

  return <div className="studio-overlay"><div className="studio-shell"><header className="studio-head"><div><span className="eyebrow">Review & Publish</span><h2>Freigabezentrum</h2><p>Drafts einreichen, fachlich freigeben, veröffentlichen und Runtime prüfen.</p></div><button className="secondary" onClick={onClose}>Schließen</button></header>
    {msg&&<div className="notice studio-notice">{msg}</div>}
    <div className="publisher-summary"><div><b>{counts.review}</b><span>In Review</span></div><div><b>{counts.approved}</b><span>Approved</span></div><div><b>{counts.published}</b><span>Published</span></div><div><b>{role}</b><span>Deine Rolle</span></div></div>
    <div className="studio-tabs">{(Object.keys(labels) as Kind[]).map(k=><button key={k} className={kind===k?'active':''} onClick={()=>setKind(k)}>{labels[k]}</button>)}</div>
    <div className="publisher-list">{rows.length===0?<div className="empty-box">Keine Einträge.</div>:rows.map(r=><div className="publisher-row" key={r.id}><div><b>{title(r)}</b><span>{code(r)} · {r.status}</span></div><div className="publisher-actions">
      {r.status==='draft'&&<button className="secondary" disabled={!!busy} onClick={()=>updateStatus(r,'in_review')}>Zum Review</button>}
      {r.status==='in_review'&&<button className="secondary" disabled={!canReview||!!busy} onClick={()=>updateStatus(r,'approved')}>Freigeben</button>}
      {r.status==='approved'&&<button className="primary" disabled={!canPublish||!!busy} onClick={()=>updateStatus(r,'published')}>Veröffentlichen</button>}
      {r.status==='published'&&(kind==='cases'||kind==='resolver')&&<button className="secondary" disabled={!!busy} onClick={()=>runtimeCheck(r)}>Runtime prüfen</button>}
    </div></div>)}</div>
    <div className="callout"><b>Workflow</b><p>Author → Review → Approved → Published. Published Inhalte werden erst nach Freigabe an die Apps ausgeliefert. Case-spezifische Resolver-Aliase sind nur Overrides; globale Synonyme gehören ins Resolver-Lexikon.</p></div>
  </div></div>
}
