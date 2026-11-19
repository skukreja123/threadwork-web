import {useRef} from 'react';
/** The real product photo with the customer's picture on top. Drag the picture to place it; positions are saved as % of the photo. */
export default function PhotoStage({photo,name,design,onMove}){
  const box=useRef(null),drag=useRef(false);
  const start=e=>{if(!onMove)return;e.preventDefault();drag.current=true;try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}};
  const move=e=>{if(!drag.current||!onMove)return;const r=box.current.getBoundingClientRect();
    onMove(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100)))};
  const end=()=>{drag.current=false};
  return <div className="photobox" ref={box}><img className="photo" src={photo} alt={name} draggable={false}/>
    {design&&design.src&&<img className={'overlay'+(design.mode==='embroidery'?' emb':'')+(onMove?'':' still')} src={design.src} alt="Your design" draggable={false}
      style={{left:design.px+'%',top:design.py+'%',width:design.size/4+'%'}} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/>}</div>;
}
