import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import Flat from './Flat';import {api,imgSrc} from './api';import {useAuth} from './auth';
function useLoad(fn){const [d,setD]=useState(null),[e,setE]=useState('');const run=()=>fn().then(setD).catch(x=>setE(x.message));useEffect(()=>{run()},[]);return [d,e,run]}
const STATUS=['new','in_production','shipped','delivered','cancelled'];
const SHAPES={tee:'T-shirt',polo:'Polo',drop:'Drop shoulder',hoodie:'Hoodie',wtop:'Women’s top'};
const guessBase=n=>{n=n.toLowerCase();return /hood|sweat/.test(n)?'hoodie':/polo/.test(n)?'polo':/drop/.test(n)?'drop':/\btop\b|crop/.test(n)?'wtop':/t-?shirt|tee/.test(n)?'tee':''};

function Orders(){
  const [o,e,run]=useLoad(api.admin.orders);
  if(e)return <p className="err">{e}</p>;if(!o)return <p>Loading…</p>;if(!o.length)return <div className="box">No orders yet.</div>;
  return <div className="orders">{o.map(x=>{const fr=x.designs.find(d=>d.side==='front'),bk=x.designs.find(d=>d.side==='back'),dz=d=>d&&{src:d.image_url,x:d.x,y:d.y,size:d.size};
    const base=x.product_base||'tee';
    return <article key={x.id} className="order box">
      <div className="prev">{x.product_image&&fr&&fr.photo_x!=null?<div className="photobox"><img className="photo" src={imgSrc(x.product_image)} alt="Product photo"/><img className="overlay" src={fr.image_url} alt="Design" style={{left:fr.photo_x+'%',top:fr.photo_y+'%',width:fr.size/4+'%'}}/></div>:<Flat pid={base} color={x.color} sleeve={x.sleeve} side="front" design={dz(fr)}/>}<span className="cap">Front{x.product_image&&fr&&fr.photo_x!=null?' (on the product photo)':''}</span></div>
      <div className="prev"><Flat pid={base} color={x.color} sleeve={x.sleeve} side="back" design={dz(bk)}/><span className="cap">Back</span></div>
      <div className="prev">{x.designs.map(d=><div key={d.id}><img className="dz" src={d.image_url} alt={d.side+' design'}/><span className="cap">{d.side} design · {d.zone} · {d.method}</span></div>)}</div>
      <div><h3>{x.code}</h3><p>{x.product_name}, {x.sleeve} sleeves, size {x.size}, qty {x.qty}<br/>{x.customer.name}, {x.customer.phone}<br/>{x.customer.address}</p><p><b>Rs. {x.total.toLocaleString()}</b></p>
        <select aria-label="Status" value={x.status} onChange={async ev=>{await api.admin.status(x.id,ev.target.value);run()}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></div></article>})}</div>;
}
function Products(){
  const blank={name:'',price:1500,section:'Men',base:'tee',color:'#1b1b1f',sleeves:true,active:true,imageUrl:''};
  const [l,e,run]=useLoad(api.admin.products),[f,setF]=useState(blank),[eid,setEid]=useState(null),[er,setEr]=useState(''),[touched,setTouched]=useState(false);
  const set=k=>ev=>{const v=ev.target.type==='checkbox'?ev.target.checked:ev.target.value;if(k==='base')setTouched(true);setF(x=>({...x,[k]:v,...(k==='name'&&!touched&&guessBase(v)?{base:guessBase(v)}:{})}))};
  const save=async()=>{try{const b={...f,price:+f.price,sleeves:!['hoodie','wtop'].includes(f.base)&&f.sleeves};eid?await api.admin.saveProduct(eid,b):await api.admin.addProduct(b);setF(blank);setEid(null);setTouched(false);setEr('');run()}catch(x){setEr(x.message)}};
  if(e)return <p className="err">{e}</p>;if(!l)return <p>Loading…</p>;
  return <div className="stack"><div className="box"><h4>{eid?'Edit product':'Add a product'}</h4><div className="row end">
    <div className="fl2"><label htmlFor="pn">Name</label><input id="pn" value={f.name} onChange={set('name')}/></div><div className="fl"><label htmlFor="pp">Price (Rs.)</label><input id="pp" type="number" value={f.price} onChange={set('price')}/></div>
    <div className="fl"><label htmlFor="ps">Section</label><select id="ps" value={f.section} onChange={set('section')}><option>Men</option><option>Women</option></select></div>
    <div className="fl"><label htmlFor="pb">Shape</label><select id="pb" value={f.base} onChange={set('base')}>{[['tee','T-shirt'],['polo','Polo'],['drop','Drop shoulder'],['hoodie','Hoodie'],['wtop','Women’s top']].map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></div>
    <div><label htmlFor="pc">Colour</label><input id="pc" type="color" value={f.color} onChange={set('color')} style={{width:60,height:42,padding:2}}/></div>
    <div className="fl2"><label htmlFor="pi">Product photo (JPG, PNG or WebP)</label><input id="pi" type="file" accept="image/png,image/jpeg,image/webp" onChange={async ev=>{const fl=ev.target.files[0];if(!fl)return;try{const r=await api.admin.upload(fl);setF(x=>({...x,imageUrl:r.url}));setEr('')}catch(x){setEr(x.message)}}}/>{f.imageUrl&&<div><img className="pimg" src={imgSrc(f.imageUrl)} alt="Product photo"/> <button className="chip" onClick={()=>setF({...f,imageUrl:''})}>Remove photo</button></div>}</div></div>
    <div className="row"><label><input type="checkbox" checked={f.sleeves} onChange={set('sleeves')}/> Full-sleeve option</label><label><input type="checkbox" checked={f.active} onChange={set('active')}/> Visible in shop</label></div>
    {er&&<p className="err">{er}</p>}<div className="row"><button className="btn" onClick={save}>{eid?'Save changes':'Add product'}</button>{eid&&<button className="btn ghost" onClick={()=>{setF(blank);setEid(null);setTouched(false)}}>Cancel</button>}</div></div>
    <div className="box tbl"><table><thead><tr><th></th><th>Name</th><th>Section</th><th>Shape</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>{l.map(p=><tr key={p.id}><td>{p.imageUrl?<img className="tthumb" src={imgSrc(p.imageUrl)} alt={p.name}/>:<Flat pid={p.base} color={p.color}/>}</td><td>{p.name}</td><td>{p.section}</td><td>{SHAPES[p.base]||p.base}</td><td>Rs. {p.price.toLocaleString()}</td><td>{p.active?'Visible':'Hidden'}</td>
      <td><div className="row"><button className="chip" onClick={()=>{setF({name:p.name,price:p.price,section:p.section,base:p.base,color:p.color,sleeves:p.sleeves,active:p.active,imageUrl:p.imageUrl||''});setEid(p.id);setTouched(true)}}>Edit</button><button className="chip" onClick={async()=>{await api.admin.delProduct(p.id);run()}}>Delete</button></div></td></tr>)}</tbody></table></div></div>;
}
function Users({me}){
  const [u,e,run]=useLoad(api.admin.users);if(e)return <p className="err">{e}</p>;if(!u)return <p>Loading…</p>;
  return <div className="box tbl"><table><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Role</th></tr></thead><tbody>{u.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.email}</td><td>{x.plan}</td><td><select aria-label={'Role for '+x.name} value={x.role} disabled={x.id===me.id} onChange={async ev=>{await api.admin.role(x.id,ev.target.value);run()}}>{['customer','staff','admin'].map(r=><option key={r}>{r}</option>)}</select></td></tr>)}</tbody></table></div>;
}
function Messages(){
  const [m,e]=useLoad(api.admin.messages);if(e)return <p className="err">{e}</p>;if(!m)return <p>Loading…</p>;
  return <div className="stack">{!m.length&&<div className="box">No messages yet.</div>}{m.map(x=><div key={x.id} className="box"><b>{x.name}</b> ({x.email})<p className="cap">{new Date(x.created_at).toLocaleString()}</p><p>{x.body}</p></div>)}</div>;
}
export default function Admin(){
  const {user,openLogin}=useAuth(),[tab,setTab]=useState('orders');
  if(!user||!['admin','staff'].includes(user.role))return <div className="wrap pad"><div className="box"><h3>Staff area</h3><p>Log in with an admin or staff account to continue.</p><button className="btn" onClick={openLogin}>Log in</button> <Link to="/" className="btn ghost">Back home</Link></div></div>;
  const tabs=user.role==='admin'?['orders','products','users','messages']:['orders'];
  return <div className="wrap pad"><h2>Admin portal <span className="mu">({user.role})</span></h2>
    <div className="row" style={{margin:'12px 0 18px'}}>{tabs.map(t=><button key={t} className={'chip'+(tab===t?' on':'')} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
    {tab==='orders'&&<Orders/>}{tab==='products'&&<Products/>}{tab==='users'&&<Users me={user}/>}{tab==='messages'&&<Messages/>}</div>;
}
