import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type DeviceCase={case_code:string;status:string;scenario_code:string|null;case_translations:{locale:string;title:string}[]};

export default function DeviceTestPublish(){
  const[role,setRole]=useState<string>('');
  const[item,setItem]=useState<DeviceCase|null>(null);
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState('');
  const[runtimeReady,setRuntimeReady]=useState(false);

  const load=async()=>{
    const{data:{session}}=await supabase.auth.getSession();
    if(!session){setRole('');setItem(null);return;}
    const p=await supabase.from('profiles').select('role').eq('id',session.user.id).single();
    const r=String(p.data?.role||'');setRole(r);
    if(!['publisher','admin'].includes(r)){setItem(null);return;}
    const c=await supabase.from('cases').select('case_code,status,scenario_code,case_translations(locale,title)').in('status',['draft','validated','in_review','approved','published']).order('created_at',{ascending:false}).limit(1).maybeSingle();
    setItem((c.data as any)||null);
    if(c.data?.status==='published')await verifyRuntime(c.data.case_code);
  };

  const verifyRuntime=async(caseCode:string)=>{
    const r=await supabase.rpc('get_runtime_case_package_v1',{p_case_code:caseCode,p_locale:'de'});
    setRuntimeReady(!r.error&&!!r.data);
  };

  useEffect(()=>{load();const{data:{subscription}}=supabase.auth.onAuthStateChange(()=>load());return()=>subscription.unsubscribe()},[]);

  const publish=async()=>{
    if(!item||busy)return;setBusy(true);setMsg('');setRuntimeReady(false);
    try{
      const r=await supabase.rpc('publish_case_for_device_test_v1',{p_case_code:item.case_code});
      if(r.error)throw r.error;
      if(!r.data?.ok)throw new Error((r.data?.errors||['Validierung fehlgeschlagen.']).join(' '));
      await verifyRuntime(item.case_code);
      setMsg('Für Gerätetest veröffentlicht.');
      await load();
    }catch(e:any){setMsg(e.message||String(e))}finally{setBusy(false)}
  };

  if(!item||!['publisher','admin'].includes(role))return null;
  const title=item.case_translations?.find(x=>x.locale==='de')?.title||item.scenario_code||item.case_code;
  return <div style={{position:'fixed',right:18,bottom:18,zIndex:90,width:340,maxWidth:'calc(100vw - 36px)',background:'#111',color:'#fff',borderRadius:16,padding:16,boxShadow:'0 16px 44px rgba(0,0,0,.32)',fontFamily:'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
    <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'.09em',color:'#d77b72',fontWeight:900}}>iPhone / Android Device Test</div>
    <div style={{fontWeight:850,fontSize:17,marginTop:5}}>{title}</div>
    <div style={{fontSize:12,color:'#aaa',marginTop:3}}>{item.case_code} · {item.status}</div>
    {item.status!=='published'?<><p style={{fontSize:12,lineHeight:1.45,color:'#ccc'}}>Veröffentlicht nur diesen validierten Testfall für den Runtime-Vertrag. Andere Drafts bleiben unsichtbar.</p><button disabled={busy} onClick={publish} style={{width:'100%',border:0,borderRadius:9,padding:'10px 12px',fontWeight:850,cursor:'pointer',background:'#9b251d',color:'#fff',opacity:busy?.65:1}}>{busy?'Prüfe & veröffentliche…':'Für iPhone-Test veröffentlichen'}</button></>:<div style={{marginTop:10,padding:10,borderRadius:9,background:runtimeReady?'#183c22':'#4b3215',fontSize:12,fontWeight:800}}>{runtimeReady?'✓ Runtime-Paket DE ist abrufbar':'Published · Runtime-Paket wird geprüft'}</div>}
    {msg&&<div style={{fontSize:11,color:'#ddd',marginTop:9}}>{msg}</div>}
  </div>
}
