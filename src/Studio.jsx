import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import Shirt3D from './Shirt3D';import PhotoStage from './PhotoStage';import {COLORS,fileToDataUrl,zonesFor} from './shapes';import {api,imgSrc} from './api';import {useAuth} from './auth';

export default function Studio(){
  const {id}=useParams(),{user,openLogin}=useAuth(),[p,setP]=useState(null),[err,setErr]=useState('');
  useEffect(()=>{api.products().then(l=>setP(l.find(x=>x.id===id)||false)).catch(e=>setErr(e.message==='Failed to fetch'?'Cannot reach the backend. Is it running?':e.message))},[id]);
  if(err)return <div className="wrap pad"><p className="err">{err}</p><Link to="/">Back home</Link></div>;
  if(p===null)return <div className="wrap pad">Loading…</div>;
  if(!p)return <div className="wrap pad">Product not found. <Link to="/">Back home</Link></div>;
  return <Inner key={p.id} p={p} user={user} openLogin={openLogin}/>;
}
function Inner({p,user,openLogin}){
  const nav=useNavigate(),pid=p.base,sl0=pid==='hoodie';
  const [photo,setPhoto]=useState(false),[color,setColor]=useState(p.color||'#ffffff'),[sleeve,setSleeve]=useState('short'),[view,setView]=useState('front');
  const [designs,setDesigns]=useState({front:null,back:null}),[gallery,setGallery]=useState([]),[prompt,setPrompt]=useState(''),[msg,setMsg]=useState('');
  const [step,setStep]=useState('design'),[f,setF]=useState({name:'',phone:'',address:'',size:'M',qty:1,note:''}),[done,setDone]=useState(null),[err,setErr]=useState('');
  const sl=sl0?'full':sleeve,zones=zonesFor(pid,sl,view),cur=designs[view];
  const put=patch=>setDesigns(d=>({...d,[view]:{...d[view],...patch}}));
  const add=src=>{setGallery(g=>[src,...g.filter(x=>x!==src)].slice(0,6));setDesigns(d=>d[view]?{...d,[view]:{...d[view],src}}:{...d,[view]:{src,x:zones[0].x,y:zones[0].y,size:90,mode:'print',zone:zones[0].k}})};
  const snap=z=>put({x:z.x,y:z.y,zone:z.k,size:z.k.includes('sleeve')?44:(/shoulder|chest/i.test(z.k)&&z.k!=='Center chest')?56:90});
  const drag=(side,x,y)=>setDesigns(d=>d[side]?{...d,[side]:{...d[side],x,y,zone:'Custom position'}}:d);
  const emb=Object.values(designs).filter(d=>d&&d.mode==='embroidery').length;
  const price=(p.price+(sl==='full'&&p.sleeves?300:0)+400*emb)*f.qty,has=designs.front||designs.back;
  const gen=async()=>{if(!user)return openLogin();try{const r=await api.ai(prompt);if(!r.imageUrl)throw new Error('No picture was returned');add(r.imageUrl);setMsg(r.remaining!=null?r.remaining+' AI picture(s) left on your plan.':'')}catch(e){setMsg(e.status===402?'You have used your free AI pictures. Upgrade your plan to make more.':e.message)}};
  const submit=async()=>{if(!user)return openLogin();setErr('');try{
    const ds=['front','back'].filter(s=>designs[s]).map(s=>({side:s,zone:designs[s].zone,method:designs[s].mode,x:designs[s].x,y:designs[s].y,size:designs[s].size,imageUrl:designs[s].src,photoX:s==='front'&&p.imageUrl?designs[s].x/4:null,photoY:s==='front'&&p.imageUrl?designs[s].y/4.4:null}));
    setDone(await api.order({productId:p.id,color,sleeve:sl,size:f.size,qty:f.qty,customer:{name:f.name,phone:f.phone,address:f.address,note:f.note},designs:ds}))}catch(e){setErr(e.message)}};
  if(done)return <div className="wrap pad center"><h2>Order placed</h2><p>Your order number is <b>{done.code}</b>. Total Rs. {done.total.toLocaleString()}.</p><button className="btn" onClick={()=>nav('/')}>Keep shopping</button></div>;
  const set=k=>e=>setF({...f,[k]:e.target.value});
  return <div className="wrap studio">
    <div className="stagebox">{p.imageUrl&&<div className="row c" style={{marginBottom:6}}><button className={'chip'+(!photo?' on':'')} onClick={()=>setPhoto(false)}>3D design</button><button className={'chip'+(photo?' on':'')} onClick={()=>{setPhoto(true);setView('front')}}>Product photo</button></div>}
      {photo&&p.imageUrl?<PhotoStage photo={imgSrc(p.imageUrl)} name={p.name} design={designs.front&&{...designs.front,px:designs.front.x/4,py:designs.front.y/4.4}} onMove={(px,py)=>setDesigns(d=>d.front?{...d,front:{...d.front,x:px*4,y:py*4.4,zone:'Custom position'}}:d)}/>:<Shirt3D pid={pid} color={color} sleeve={sleeve} view={view} designs={designs} onDrag={drag}/>}
      <div className="row c"><button className={'chip'+(view==='front'?' on':'')} onClick={()=>setView('front')}>Front</button><button className={'chip'+(view==='back'?' on':'')} onClick={()=>{setPhoto(false);setView('back')}}>Back</button></div>
      <p className="hint c">{photo?(designs.front?'Drag the picture to place it on the product photo.':'Add a picture, then drag it onto the photo.'):'Drag the picture to move it. Drag empty space to turn the '+p.name.toLowerCase()+'.'}</p>
      {p.imageUrl&&!photo&&designs.front&&<div className="live"><PhotoStage photo={imgSrc(p.imageUrl)} name={p.name} design={{...designs.front,px:designs.front.x/4,py:designs.front.y/4.4}}/><p className="hint c">Live preview on the real product</p></div>}</div>
    <div className="panel"><h2>{p.name}</h2>
    {step==='design'?<>
      <div className="box"><h4>Colour</h4><div className="row">{COLORS.map(c=><button key={c} aria-label={'Colour '+c} className={'sw'+(c===color?' on':'')} style={{background:c}} onClick={()=>setColor(c)}/>)}</div>
        {p.sleeves&&!sl0&&<><h4>Sleeves</h4><div className="row"><button className={'chip'+(sleeve==='short'?' on':'')} onClick={()=>setSleeve('short')}>Short</button><button className={'chip'+(sleeve==='full'?' on':'')} onClick={()=>setSleeve('full')}>Full (+Rs. 300)</button></div></>}</div>
      <div className="box"><h4>Picture for the {view}</h4><input type="file" accept="image/*" aria-label="Upload a picture" onChange={async e=>{const fl=e.target.files[0];if(fl)add(await fileToDataUrl(fl))}}/>
        <label htmlFor="ai">Or generate one with AI</label><div className="row nw"><input id="ai" placeholder="e.g. neon tiger" value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className="btn" disabled={!prompt.trim()} onClick={gen}>Generate</button></div>
        {msg&&<p className="hint">{msg}</p>}
        {gallery.length>0&&<div className="thumbs">{gallery.map(u=><button key={u} className={u===cur?.src?'on':''} onClick={()=>add(u)}><img src={u} alt="Your picture"/></button>)}</div>}</div>
      {cur&&<><div className="box"><h4>Where it goes ({view})</h4><div className="row">{zones.map(z=><button key={z.k} className={'chip'+(cur.zone===z.k?' on':'')} onClick={()=>snap(z)}>{z.k}</button>)}</div>
        <label htmlFor="sz">Size</label><input id="sz" type="range" min="30" max="200" value={cur.size} onChange={e=>put({size:+e.target.value})}/></div>
        <div className="box"><h4>How it’s applied</h4><div className="row"><button className={'chip'+(cur.mode==='print'?' on':'')} onClick={()=>put({mode:'print'})}>Print</button><button className={'chip'+(cur.mode==='embroidery'?' on':'')} onClick={()=>put({mode:'embroidery'})}>Embroidered (+Rs. 400)</button><button className="chip" onClick={()=>setDesigns(d=>({...d,[view]:null}))}>Remove this design</button></div></div></>}
      <div className="box"><div className="total"><span>Total</span><span>Rs. {price.toLocaleString()}</span></div><button className="btn full" disabled={!has} onClick={()=>setStep('checkout')}>Proceed to order</button>{!has&&<p className="hint">Add a picture first.</p>}</div>
    </>:<div className="box"><h4>Delivery details</h4>
      <label htmlFor="n">Full name</label><input id="n" value={f.name} onChange={set('name')}/><label htmlFor="ph">Phone</label><input id="ph" value={f.phone} onChange={set('phone')}/>
      <label htmlFor="ad">Address</label><textarea id="ad" rows="3" value={f.address} onChange={set('address')}/>
      <div className="row nw"><div className="fl"><label htmlFor="s2">Size</label><select id="s2" value={f.size} onChange={set('size')}>{['S','M','L','XL','XXL'].map(s=><option key={s}>{s}</option>)}</select></div><div className="fl"><label htmlFor="q">Quantity</label><input id="q" type="number" min="1" value={f.qty} onChange={e=>setF({...f,qty:Math.max(1,+e.target.value||1)})}/></div></div>
      <label htmlFor="nt">Note (optional)</label><input id="nt" value={f.note} onChange={set('note')}/>
      <div className="total"><span>Total</span><span>Rs. {price.toLocaleString()}</span></div>{err&&<p className="err">{err}</p>}
      <div className="row"><button className="btn ghost" onClick={()=>setStep('design')}>Back to design</button><button className="btn" disabled={!f.name||!f.phone||!f.address} onClick={submit}>{user?'Place order':'Log in to order'}</button></div></div>}
    </div></div>;
}
