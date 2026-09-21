import { useEffect,useState,useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { BlockedAuthor, CONTENT_BLOCK_SCOPE,listBlockedAuthors,unblockAuthor } from '../lib/contentSafety';
import { notifyContentSafetyChanged } from './ContentSafetyActions';
export default function BlockedAuthors(){
 const {user}=useAuth();const copy=useReleaseCopy();const [open,setOpen]=useState(false);
 const owner=user?.id||null;
 const [state,setState]=useState<{owner:string|null;rows:BlockedAuthor[];error:string;loading:boolean;busy:string}>({owner:null,rows:[],error:'',loading:false,busy:''});
 const scope=useRef({owner,open,generation:0,mounted:true,busy:false});
 // Invalidate synchronously during an identity/visibility change, before effects.
 if(scope.current.owner!==owner||scope.current.open!==open){scope.current.owner=owner;scope.current.open=open;scope.current.generation++;scope.current.busy=false;}
 const visible=open&&owner!==null&&state.owner===owner;
 const rows=visible?state.rows:[],error=visible?state.error:'',busy=visible?state.busy:'',loading=!!owner&&open&&(!visible||state.loading);
 const current=(generation:number,actor:string)=>scope.current.mounted&&scope.current.open&&scope.current.owner===actor&&scope.current.generation===generation;
 function changeOpen(next:boolean){scope.current.generation++;scope.current.open=next;scope.current.busy=false;setOpen(next);}
 async function load(){
  const actor=scope.current.owner;if(!actor||!scope.current.open||!scope.current.mounted)return;
  const generation=++scope.current.generation;scope.current.busy=false;
  setState({owner:actor,rows:[],error:'',loading:true,busy:''});
  try{const result=await listBlockedAuthors();if(current(generation,actor))setState({owner:actor,rows:result,error:'',loading:false,busy:''});}
  catch(e){if(current(generation,actor))setState({owner:actor,rows:[],error:(e as Error).message,loading:false,busy:''});}
 }
 useEffect(()=>{scope.current.mounted=true;return()=>{scope.current.mounted=false;scope.current.generation++;}},[]);
 useEffect(()=>{if(open&&owner)void load();return()=>{scope.current.generation++;scope.current.busy=false;}},[open,owner]);
 async function unblock(id:string){
  const actor=scope.current.owner;if(!actor||!scope.current.open||!scope.current.mounted||scope.current.busy||state.owner!==actor||!state.rows.some(row=>row.id===id))return;
  const generation=++scope.current.generation;scope.current.busy=true;
  setState(previous=>({...previous,error:'',busy:id}));
  try{await unblockAuthor(id);if(current(generation,actor)){setState(previous=>previous.owner===actor?{...previous,rows:previous.rows.filter(row=>row.id!==id)}:previous);notifyContentSafetyChanged();}}
  catch(e){if(current(generation,actor))setState(previous=>({...previous,error:(e as Error).message}));}
  finally{if(current(generation,actor)){scope.current.busy=false;setState(previous=>({...previous,busy:''}));}}
 }
 return <section><button type="button" aria-expanded={open} onClick={()=>changeOpen(!open)}>{copy('Blocked authors')}</button>{open&&<div><p>{copy(CONTENT_BLOCK_SCOPE)}</p>{!user?<p>{copy('Sign in to manage content and blocked authors.')}</p>:<>{loading&&<p role="status">{copy('Loading…')}</p>}{!loading&&!error&&!rows.length&&<p>{copy('No blocked authors.')}</p>}{error&&<p role="alert">{error} <button onClick={load}>{copy('Try again')}</button></p>}{rows.map(row=><div key={row.id} className="blocked-row"><span>{row.displayName}</span><button disabled={!!busy} onClick={()=>unblock(row.id)}>{copy(busy===row.id?'Saving…':'Unblock')}</button></div>)}</>}</div>}<style jsx>{`section{padding:16px}button{font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:10px;min-height:44px;padding:8px 12px}p{line-height:1.5}.blocked-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0}`}</style></section>;
}
