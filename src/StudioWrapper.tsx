import { useState } from 'react';
import App from './App';
import ContentStudio from './ContentStudio';

export default function StudioWrapper(){
  const[open,setOpen]=useState(false);
  return <><App/><button className="studio-launch" onClick={()=>setOpen(true)}>Content Studio</button>{open&&<ContentStudio onClose={()=>setOpen(false)}/>}</>;
}
