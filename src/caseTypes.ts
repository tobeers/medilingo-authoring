export type Relevance='critical'|'important'|'supportive'|'optional';

export type HistoryRow={topic_id:string;aliases_de:string;aliases_en:string;response_de:string;response_en:string;relevance:Relevance};
export type ExamRow={exam_id:string;aliases_de:string;aliases_en:string;finding_de:string;finding_en:string;relevance:Relevance};
export type VitalRow={measurement_id:string;value:string;unit:string;time_offset_sec:number;relevance:Relevance};
export type DiagnosticRow={diagnostic_id:string;aliases_de:string;aliases_en:string;result_de:string;result_en:string;delay_sec:number;relevance:Relevance};
export type TreatmentRow={action_id:string;aliases_de:string;aliases_en:string;effect_de:string;effect_en:string;required:boolean;notes:string};
export type EndpointRow={endpoint_id:string;category:'diagnosis'|'treatment';required:boolean;description_de:string;description_en:string};
export type DifferentialRow={diagnosis_id:string;label_de:string;label_en:string;priority:string};

export type CaseDraft={
  source_upload_id?:string;
  organ:string;chapter:string;pool:string;
  scenario:string;purpose:'practice'|'curriculum_gate'|'weekly_challenge';difficulty:number;duration:number;medical_region:string;
  title_de:string;title_en:string;presentation_de:string;presentation_en:string;
  age:string;sex:string;setting:string;arrival_mode:string;chief_complaint_de:string;chief_complaint_en:string;
  target_diagnosis_id:string;target_diagnosis_label_de:string;target_diagnosis_label_en:string;
  pathophysiology_de:string;pathophysiology_en:string;endpoint_policy:string;case_truth_note:string;
  background:string;medications:string;allergies:string;
  history_topics:HistoryRow[];examinations:ExamRow[];vitals:VitalRow[];diagnostics:DiagnosticRow[];
  differential_diagnoses:DifferentialRow[];treatments:TreatmentRow[];hard_endpoints:EndpointRow[];
  hints_de:string;hints_en:string;debrief_de:string;debrief_en:string;learning_objectives_de:string;learning_objectives_en:string;
  author_notes:string;
};

export const emptyHistory=():HistoryRow=>({topic_id:'',aliases_de:'',aliases_en:'',response_de:'',response_en:'',relevance:'important'});
export const emptyExam=():ExamRow=>({exam_id:'',aliases_de:'',aliases_en:'',finding_de:'',finding_en:'',relevance:'important'});
export const emptyVital=():VitalRow=>({measurement_id:'',value:'',unit:'',time_offset_sec:0,relevance:'important'});
export const emptyDiagnostic=():DiagnosticRow=>({diagnostic_id:'',aliases_de:'',aliases_en:'',result_de:'',result_en:'',delay_sec:0,relevance:'important'});
export const emptyTreatment=():TreatmentRow=>({action_id:'',aliases_de:'',aliases_en:'',effect_de:'',effect_en:'',required:false,notes:''});
export const emptyEndpoint=():EndpointRow=>({endpoint_id:'',category:'treatment',required:true,description_de:'',description_en:''});
export const emptyDifferential=():DifferentialRow=>({diagnosis_id:'',label_de:'',label_en:'',priority:'reasonable'});

export const newCaseDraft=():CaseDraft=>({
  organ:'',chapter:'',pool:'',scenario:'',purpose:'practice',difficulty:2,duration:15,medical_region:'de-DE',
  title_de:'',title_en:'',presentation_de:'',presentation_en:'',age:'',sex:'',setting:'Notaufnahme',arrival_mode:'',chief_complaint_de:'',chief_complaint_en:'',
  target_diagnosis_id:'',target_diagnosis_label_de:'',target_diagnosis_label_en:'',pathophysiology_de:'',pathophysiology_en:'',endpoint_policy:'diagnosis_and_treatment',case_truth_note:'',
  background:'',medications:'',allergies:'',history_topics:[emptyHistory()],examinations:[emptyExam()],vitals:[emptyVital()],diagnostics:[emptyDiagnostic()],differential_diagnoses:[emptyDifferential()],treatments:[emptyTreatment()],hard_endpoints:[emptyEndpoint()],
  hints_de:'',hints_en:'',debrief_de:'',debrief_en:'',learning_objectives_de:'',learning_objectives_en:'',author_notes:''
});

const joined=(v:any)=>Array.isArray(v)?v.join(' | '):'';
const lines=(v:any)=>Array.isArray(v)?v.join('\n'):String(v||'');

export function draftFromParsed(parsed:any,target:any={}):CaseDraft{
  const d=newCaseDraft(); const m=parsed?.meta||{}; const ml=parsed?.medical_logic||{}; const loc=parsed?.localized||{}; const demo=parsed?.demographics||{};
  return {...d,source_upload_id:parsed?.source_upload_id,
    organ:target?.organ_system_id||'',chapter:target?.chapter_id||'',pool:target?.case_pool_id||'',scenario:m.scenario_code||'',purpose:m.purpose||'practice',difficulty:Number(m.difficulty)||2,duration:Number(m.estimated_duration_minutes)||15,medical_region:m.medical_region||'de-DE',
    title_de:loc.de?.title||'',title_en:loc.en?.title||'',presentation_de:loc.de?.patient_presentation||'',presentation_en:loc.en?.patient_presentation||'',
    age:String(demo.age_years||''),sex:demo.sex||'',setting:demo.setting||'',arrival_mode:demo.arrival_mode||'',chief_complaint_de:demo.chief_complaint_de||'',chief_complaint_en:demo.chief_complaint_en||'',
    target_diagnosis_id:ml.target_diagnosis_id||'',target_diagnosis_label_de:ml.target_diagnosis_label_de||'',target_diagnosis_label_en:ml.target_diagnosis_label_en||'',pathophysiology_de:ml.pathophysiology_de||'',pathophysiology_en:ml.pathophysiology_en||'',endpoint_policy:ml.endpoint_policy||'diagnosis_and_treatment',case_truth_note:ml.case_truth_note||'',
    background:(ml.background||[]).map((x:any)=>`${x.type}: ${x.entry}${x.details?` — ${x.details}`:''}`).join('\n'),
    history_topics:(ml.history_topics||[]).map((x:any)=>({topic_id:x.topic_id||'',aliases_de:joined(x.aliases_de),aliases_en:joined(x.aliases_en),response_de:x.response_de||'',response_en:x.response_en||'',relevance:x.relevance||'important'})),
    examinations:(ml.examinations||[]).map((x:any)=>({exam_id:x.exam_id||'',aliases_de:joined(x.aliases_de),aliases_en:joined(x.aliases_en),finding_de:x.finding_de||'',finding_en:x.finding_en||'',relevance:x.relevance||'important'})),
    vitals:(ml.vitals||[]).map((x:any)=>({measurement_id:x.measurement_id||'',value:String(x.value||''),unit:x.unit||'',time_offset_sec:Number(x.time_offset_sec)||0,relevance:x.relevance||'important'})),
    diagnostics:(ml.diagnostics||[]).map((x:any)=>({diagnostic_id:x.diagnostic_id||'',aliases_de:joined(x.aliases_de),aliases_en:joined(x.aliases_en),result_de:x.result_de||'',result_en:x.result_en||'',delay_sec:Number(x.delay_sec)||0,relevance:x.relevance||'important'})),
    differential_diagnoses:(ml.differential_diagnoses||[]).map((x:any)=>({diagnosis_id:x.id||x.diagnosis_id||'',label_de:x.label_de||'',label_en:x.label_en||'',priority:x.priority||'reasonable'})),
    treatments:(ml.treatments||[]).map((x:any)=>({action_id:x.action_id||'',aliases_de:joined(x.aliases_de),aliases_en:joined(x.aliases_en),effect_de:x.effect_de||'',effect_en:x.effect_en||'',required:!!x.required,notes:x.notes||''})),
    hard_endpoints:(ml.hard_endpoints||[]).map((x:any)=>({endpoint_id:x.endpoint_id||'',category:x.category||'treatment',required:!!x.required,description_de:x.description_de||'',description_en:x.description_en||''})),
    hints_de:lines(loc.de?.hints),hints_en:lines(loc.en?.hints),debrief_de:loc.de?.debrief||'',debrief_en:loc.en?.debrief||'',learning_objectives_de:lines(loc.de?.learning_objectives),learning_objectives_en:lines(loc.en?.learning_objectives)
  };
}

export function validateCaseDraft(d:CaseDraft){
  const errors:string[]=[]; const warnings:string[]=[];
  if(!d.organ)errors.push('Organsystem fehlt.'); if(!d.scenario.trim())errors.push('Scenario-Code fehlt.'); if(!d.title_de.trim())errors.push('Deutscher Titel fehlt.'); if(!d.presentation_de.trim())errors.push('Patientenvorstellung fehlt.'); if(!d.target_diagnosis_id.trim())errors.push('Zieldiagnose-ID fehlt.');
  if(!d.history_topics.some(x=>x.topic_id.trim()&&x.response_de.trim()))errors.push('Mindestens ein nutzbares Anamnese-Topic fehlt.');
  if(!d.diagnostics.some(x=>x.diagnostic_id.trim()&&x.result_de.trim()))errors.push('Mindestens eine Diagnostik fehlt.');
  if(!d.hard_endpoints.some(x=>x.endpoint_id.trim()&&x.required))errors.push('Mindestens ein erforderlicher Hard Endpoint fehlt.');
  if(!d.treatments.some(x=>x.action_id.trim()&&x.required))warnings.push('Keine erforderliche Therapieaktion markiert.');
  if(!d.title_en.trim())warnings.push('Englische Übersetzung fehlt.');
  return {ok:errors.length===0,errors,warnings};
}
