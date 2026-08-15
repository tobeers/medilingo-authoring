import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';

type Profile = { id: string; role: 'viewer'|'author'|'reviewer'|'publisher'|'admin'; display_name: string | null };
type Organ = { id:string; code:string; organ_system_translations:{locale:string;name:string}[] };
type Chapter = { id:string; organ_system_id:string; chapter_translations:{locale:string;title:string}[] };
type Pool = { id:string; organ_system_id:string; chapter_id:string|null; case_pool_translations:{locale:string;title:string}[] };

const title = (items:any[]|undefined, locale='de') => items?.find(x=>x.locale===locale)?.title || items?.find(x=>x.locale==='de')?.title || '';

function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [message,setMessage]=useState('');
  const submit=async(mode:'login'|'signup')=>{
    setMessage('');
    const result = mode==='login'
      ? await supabase.auth.signInWithPassword({email,password})
      : await supabase.auth.signUp({email,password});
    if(result.error) setMessage(result.error.message);
    else if(mode==='signup' && !result.data.session) setMessage('Account erstellt. Bitte bestätige ggf. die E-Mail.');
  };
  return <div className="login-shell">
    <section className="brand-panel"><div className="logo">M</div><h1>Medilingo Authoring</h1><p>Clinical Cases, Kapitel und Lerninhalte strukturiert erstellen und veröffentlichen.</p></section>
    <section className="login-card"><h2>Anmelden</h2><label>E-Mail<input value={email} onChange={e=>setEmail(e.target.value)} type="email"/></label><label>Passwort<input value={password} onChange={e=>setPassword(e.target.value)} type="password"/></label>{message&&<div className="notice">{message}</div>}<button className="primary" onClick={()=>submit('login')}>Einloggen</button><button className="secondary" onClick={()=>submit('signup')}>Account anlegen</button></section>
  </div>
}

export default function App(){
  const [session,setSession]=useState<any>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [page,setPage]=useState<'dashboard'|'cases'>('dashboard');
  const [organs,setOrgans]=useState<Organ[]>([]);
  const [chapters,setChapters]=useState<Chapter[]>([]);
  const [pools,setPools]=useState<Pool[]>([]);
  const [cases,setCases]=useState<any[]>([]);
  const [message,setMessage]=useState('');
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState<any>({organ:'',chapter:'',pool:'',difficulty:2,purpose:'practice',scenario:'',titleDe:'',presentationDe:'',hintsDe:'',debriefDe:'',titleEn:'',presentationEn:'',hintsEn:'',debriefEn:'',diagnosis:'',endpoints:'',note:''});

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>subscription.unsubscribe();
  },[]);

  const load = async()=>{
    if(!session) return;
    const [p,o,c,po,ca] = await Promise.all([
      supabase.from('profiles').select('id,role,display_name').eq('id',session.user.id).single(),
      supabase.from('organ_systems').select('id,code,organ_system_translations(locale,name)').order('sequence'),
      supabase.from('chapters').select('id,organ_system_id,chapter_translations(locale,title)').order('sequence'),
      supabase.from('case_pools').select('id,organ_system_id,chapter_id,case_pool_translations(locale,title)'),
      supabase.from('cases').select('id,case_code,difficulty,purpose,status,created_at,case_translations(locale,title)').order('created_at',{ascending:false}),
    ]);
    if(p.data) setProfile(p.data as Profile);
    setOrgans((o.data||[]) as any); setChapters((c.data||[]) as any); setPools((po.data||[]) as any); setCases(ca.data||[]);
  };
  useEffect(()=>{load()},[session]);

  const visibleChapters=useMemo(()=>chapters.filter(c=>!form.organ||c.organ_system_id===form.organ),[chapters,form.organ]);
  const visiblePools=useMemo(()=>pools.filter(p=>(!form.organ||p.organ_system_id===form.organ)&&(!form.chapter||!p.chapter_id||p.chapter_id===form.chapter)),[pools,form.organ,form.chapter]);
  const canCreate=profile && ['author','reviewer','publisher','admin'].includes(profile.role);

  const saveCase=async()=>{
    try{
      setMessage('');
      if(!profile) throw new Error('Profil nicht geladen.');
      if(!canCreate) throw new Error('Deine Rolle darf noch keine Cases erstellen.');
      if(!form.organ) throw new Error('Bitte ein Organsystem auswählen.');
      if(!form.titleDe.trim()) throw new Error('Deutscher Titel fehlt.');
      const result=await supabase.from('cases').insert({
        organ_system_id:form.organ,
        chapter_id:form.chapter||null,
        scenario_code:form.scenario.trim()||null,
        difficulty:Number(form.difficulty),
        purpose:form.purpose,
        status:'draft',
        medical_logic:{target_diagnosis_id:form.diagnosis.trim()||null,hard_endpoints:form.endpoints.split(',').map((x:string)=>x.trim()).filter(Boolean),author_note:form.note.trim()||null},
        created_by:profile.id,
        updated_by:profile.id,
      }).select('id,case_code').single();
      if(result.error) throw result.error;
      const translations:any[]=[{case_id:result.data.id,locale:'de',title:form.titleDe.trim(),patient_presentation:form.presentationDe.trim()||null,payload:{hints:form.hintsDe.split('\n').map((x:string)=>x.trim()).filter(Boolean),debrief:form.debriefDe.trim()||null},status:'draft'}];
      if(form.titleEn.trim()) translations.push({case_id:result.data.id,locale:'en',title:form.titleEn.trim(),patient_presentation:form.presentationEn.trim()||null,payload:{hints:form.hintsEn.split('\n').map((x:string)=>x.trim()).filter(Boolean),debrief:form.debriefEn.trim()||null},status:'draft'});
      const tr=await supabase.from('case_translations').insert(translations); if(tr.error) throw tr.error;
      if(form.pool){const link=await supabase.from('case_pool_members').insert({case_pool_id:form.pool,case_id:result.data.id}); if(link.error) throw link.error;}
      setMessage(`Gespeichert: ${result.data.case_code}`); setOpen(false); await load();
    }catch(error:any){setMessage(error.message||String(error))}
  };

  if(!session) return <Login/>;
  if(!profile) return <div className="splash">Medilingo wird geladen…</div>;

  return <div className="shell">
    <aside><div className="brand"><div className="logo small">M</div><div><b>Medilingo</b><span>Authoring</span></div></div><nav><button className={page==='dashboard'?'active':''} onClick={()=>setPage('dashboard')}>Dashboard</button><button className={page==='cases'?'active':''} onClick={()=>setPage('cases')}>Clinical Cases</button></nav><div className="account"><span>{session.user.email}</span><b>{profile.role}</b><button onClick={()=>supabase.auth.signOut()}>Logout</button></div></aside>
    <main>
      {page==='dashboard' ? <><header><div><h1>Dashboard</h1><p>Medilingo Content Workbench</p></div></header><div className="stats"><div className="card"><span>Clinical Cases</span><b>{cases.length}</b></div><div className="card"><span>Kapitel</span><b>{chapters.length}</b></div><div className="card"><span>Case Pools</span><b>{pools.length}</b></div><div className="card"><span>Rolle</span><b>{profile.role}</b></div></div><div className="card"><h3>Workflow</h3><p>Draft → Validation → Review → Approved → Published</p></div></> : <><header><div><h1>Clinical Cases</h1><p>Cases strukturiert erfassen und Case Pools zuordnen.</p></div><button className="primary" disabled={!canCreate} onClick={()=>setOpen(true)}>+ Neuer Case</button></header>{message&&<div className="notice">{message}</div>}<div className="card">{cases.length===0?<div className="empty">Noch keine Cases vorhanden.</div>:<div className="table"><div className="row head"><span>Case</span><span>Titel</span><span>Purpose</span><span>Status</span></div>{cases.map(c=><div className="row" key={c.id}><b>{c.case_code}</b><span>{title(c.case_translations)||'Ohne Titel'}</span><span>{c.purpose}</span><span>{c.status}</span></div>)}</div>}</div></>}
    </main>
    {open&&<div className="modal-bg"><div className="modal"><div className="modal-title"><div><h2>Neuen Clinical Case anlegen</h2><p>UUID und Case-Code vergibt Supabase automatisch.</p></div><button onClick={()=>setOpen(false)}>×</button></div><div className="grid3"><label>Organsystem<select value={form.organ} onChange={e=>setForm({...form,organ:e.target.value,chapter:'',pool:''})}><option value="">Auswählen…</option>{organs.map(o=><option key={o.id} value={o.id}>{o.organ_system_translations.find(x=>x.locale==='de')?.name||o.code}</option>)}</select></label><label>Kapitel<select value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value,pool:''})}><option value="">Kein Kapitel</option>{visibleChapters.map(c=><option key={c.id} value={c.id}>{title(c.chapter_translations)}</option>)}</select></label><label>Case Pool<select value={form.pool} onChange={e=>setForm({...form,pool:e.target.value})}><option value="">Später zuordnen</option>{visiblePools.map(p=><option key={p.id} value={p.id}>{title(p.case_pool_translations)}</option>)}</select></label></div><div className="grid3"><label>Schwierigkeit<select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})}>{[1,2,3,4,5].map(x=><option key={x}>{x}</option>)}</select></label><label>Verwendung<select value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}><option value="practice">Practice</option><option value="curriculum_gate">Curriculum Gate</option><option value="weekly_challenge">Weekly Challenge</option></select></label><label>Scenario-Code<input value={form.scenario} onChange={e=>setForm({...form,scenario:e.target.value})} placeholder="acute_chest_pain"/></label></div><div className="split"><section><h3>Deutsch</h3><label>Titel<input value={form.titleDe} onChange={e=>setForm({...form,titleDe:e.target.value})}/></label><label>Patientenvorstellung<textarea value={form.presentationDe} onChange={e=>setForm({...form,presentationDe:e.target.value})}/></label><label>Hints<textarea value={form.hintsDe} onChange={e=>setForm({...form,hintsDe:e.target.value})}/></label><label>Debrief<textarea value={form.debriefDe} onChange={e=>setForm({...form,debriefDe:e.target.value})}/></label></section><section><h3>English</h3><label>Title<input value={form.titleEn} onChange={e=>setForm({...form,titleEn:e.target.value})}/></label><label>Patient presentation<textarea value={form.presentationEn} onChange={e=>setForm({...form,presentationEn:e.target.value})}/></label><label>Hints<textarea value={form.hintsEn} onChange={e=>setForm({...form,hintsEn:e.target.value})}/></label><label>Debrief<textarea value={form.debriefEn} onChange={e=>setForm({...form,debriefEn:e.target.value})}/></label></section></div><h3>Medizinische Logik · sprachneutral</h3><div className="grid2"><label>Zieldiagnose-ID<input value={form.diagnosis} onChange={e=>setForm({...form,diagnosis:e.target.value})} placeholder="stemi"/></label><label>Hard Endpoints<input value={form.endpoints} onChange={e=>setForm({...form,endpoints:e.target.value})} placeholder="diagnosis_stemi, aspirin, reperfusion"/></label></div><label>Interne Notiz<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><div className="actions"><button className="secondary" onClick={()=>setOpen(false)}>Abbrechen</button><button className="primary" onClick={saveCase}>Als Draft speichern</button></div></div></div>}
  </div>
}
