import { useState } from 'react';
import App from './App';
import ContentStudio from './ContentStudio';
import ReviewPublish from './ReviewPublish';

export default function StudioWrapper(){
  const[studioOpen,setStudioOpen]=useState(false);
  const[publishOpen,setPublishOpen]=useState(false);
  return <><App/><div className="workspace-launchers"><button className="studio-launch" onClick={()=>setStudioOpen(true)}>Content Studio</button><button className="publish-launch" onClick={()=>setPublishOpen(true)}>Review & Publish</button></div>{studioOpen&&<ContentStudio onClose={()=>setStudioOpen(false)}/>} {publishOpen&&<ReviewPublish onClose={()=>setPublishOpen(false)}/>}</>;
}
