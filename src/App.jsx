import {Link,Route,Routes,useLocation} from 'react-router-dom';
import Home from './Home';import Studio from './Studio';import Admin from './Admin';import {useAuth} from './auth';
export const go=id=>{const e=document.getElementById(id);if(e)e.scrollIntoView({behavior:'smooth'})};
function Header(){
  const {user,logout,openLogin}=useAuth();const home=useLocation().pathname==='/';const staff=user&&['admin','staff'].includes(user.role);
  return <header className="nav"><div className="wrap navin"><Link to="/" className="logo">thread<i>work</i></Link>
    <nav>{home&&['collection','plans','contact'].map(s=><button key={s} className="lnk" onClick={()=>go(s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}
    {staff&&<Link to="/admin" className="btn ghost sm">Admin portal</Link>}
    {user?<button className="btn ghost sm" onClick={logout}>Log out ({user.name})</button>:<button className="btn sm" onClick={openLogin}>Log in</button>}</nav></div></header>;
}
export default function App(){
  return <><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/design/:id" element={<Studio/>}/><Route path="/admin" element={<Admin/>}/></Routes></>;
}
