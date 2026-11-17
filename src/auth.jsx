import {createContext,useContext,useState} from 'react';
import {api,getUser} from './api';
const Ctx=createContext();export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}){
  const [user,setUser]=useState(getUser);const [open,setOpen]=useState(false);
  const logout=()=>{api.logout();setUser(null)};
  return <Ctx.Provider value={{user,logout,openLogin:()=>setOpen(true)}}>{children}{open&&<AuthModal close={()=>setOpen(false)} done={u=>{setUser(u);setOpen(false)}}/>}</Ctx.Provider>;
}
function AuthModal({close,done}){
  const [mode,setMode]=useState('login');const [f,setF]=useState({name:'',email:'',password:''});const [err,setErr]=useState('');
  const set=k=>e=>setF({...f,[k]:e.target.value});
  const go=async()=>{try{const r=mode==='login'?await api.login(f.email,f.password):await api.signup(f.name,f.email,f.password);done(r.user)}catch(e){setErr(e.message)}};
  return <div className="modal" onClick={close}><div className="box" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Account">
    <h3>{mode==='login'?'Log in':'Create your account'}</h3>
    {mode==='signup'&&<><label htmlFor="an">Name</label><input id="an" value={f.name} onChange={set('name')}/></>}
    <label htmlFor="ae">Email</label><input id="ae" value={f.email} onChange={set('email')}/>
    <label htmlFor="ap">Password (8+ characters)</label><input id="ap" type="password" value={f.password} onChange={set('password')}/>
    {err&&<p className="err">{err}</p>}
    <div className="row"><button className="btn" onClick={go}>{mode==='login'?'Log in':'Sign up'}</button>
    <button className="btn ghost" onClick={()=>{setMode(mode==='login'?'signup':'login');setErr('')}}>{mode==='login'?'New here? Sign up':'Have an account?'}</button></div>
  </div></div>;
}
