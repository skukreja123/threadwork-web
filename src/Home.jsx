import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shirt3D from './Shirt3D';
import Flat from './Flat';
import { api, imgSrc } from './api';
import { useAuth } from './auth';
import { go } from './App';

const MARK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff"/><circle cx="50" cy="50" r="44" fill="none" stroke="#2f4bff" stroke-width="5" stroke-dasharray="9 6"/><text x="50" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="34" fill="#12141a">TW</text></svg>'
  );
const SPOTS = [
  { k: 'Left chest', x: 245, y: 140, s: 54 },
  { k: 'Centre chest', x: 200, y: 195, s: 104 },
  { k: 'Right shoulder', x: 145, y: 96, s: 48 },
  { k: 'Sleeve', x: 328, y: 122, s: 42 },
];
const STEPS = [
  [
    'Choose a piece',
    'T-shirt, polo, drop shoulder tee, hoodie or women’s top, in the colour you like.',
  ],
  [
    'Add and place your art',
    'Upload a picture or generate one, then drag it to the chest, shoulder, sleeve or back.',
  ],
  [
    'Pick the finish and order',
    'Print or embroidery for each design. We make it and send it to the address you give us.',
  ],
];
const PLANS = [
  { n: 'Free', p: 'Rs. 0', f: ['2 AI pictures', 'Upload your own pictures', 'Print on any piece'] },
  {
    n: 'Creator',
    p: 'Rs. 999',
    per: '/month',
    f: ['30 AI pictures a month', 'Embroidery previews', 'Priority production'],
    hot: 1,
  },
  {
    n: 'Studio',
    p: 'Rs. 2,499',
    per: '/month',
    f: ['Unlimited AI pictures', 'Bulk order pricing', 'Dedicated support'],
  },
];
const FAQ = [
  [
    'Can I put a design on the front and the back?',
    'Yes. Switch between Front and Back in the designer and add one picture to each side.',
  ],
  [
    'What is the difference between print and embroidery?',
    'Print is pressed onto the fabric. Embroidery is stitched thread with a raised finish and costs Rs. 400 more per design.',
  ],
  [
    'Can I upload my own picture?',
    'Yes, any image from your device. You can also generate one with AI. Free accounts get 2 AI pictures.',
  ],
  [
    'Do I need an account to order?',
    'You need to log in to place an order, so you can follow it and find it later.',
  ],
];

function Progress() {
  const r = useRef(null);
  useEffect(() => {
    const f = () => {
      r.current.style.transform =
        'scaleX(' +
        Math.min(1, scrollY / Math.max(1, document.body.scrollHeight - innerHeight)) +
        ')';
    };
    f();
    addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  return <div className="prog" ref={r} aria-hidden="true" />;
}
export default function Home() {
  const nav = useNavigate(),
    { user, openLogin } = useAuth();
  const [list, setList] = useState(null),
    [loadErr, setLoadErr] = useState(''),
    [sec, setSec] = useState('All'),
    [i, setI] = useState(0),
    [toast, setToast] = useState('');
  const [cf, setCf] = useState({ name: '', email: '', body: '' }),
    [sent, setSent] = useState('');
  const load = () => {
    setLoadErr('');
    api
      .products()
      .then(setList)
      .catch((e) =>
        setLoadErr(
          e.message === 'Failed to fetch' ? 'Cannot reach the backend. Is it running?' : e.message
        )
      );
  };
  useEffect(load, []);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SPOTS.length), 3200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.rv').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [list, sec]);
  const q = SPOTS[i],
    emb = i % 2 === 1,
    designs = {
      front: { src: MARK, x: q.x, y: q.y, size: q.s, mode: emb ? 'embroidery' : 'print' },
      back: null,
    };
  const shown = (list || []).filter(
    (p) => p.active !== false && (sec === 'All' || p.section === sec)
  );
  const send = async () => {
    try {
      await api.message(cf);
      setSent('Thanks, we’ve got your message and will reply by email.');
    } catch (e) {
      setSent('Could not send: ' + e.message);
    }
  };
  const pick = (p) => {
    if (!user) return openLogin();
    setToast(p.n + ' plan selected. Payments will be switched on soon.');
    setTimeout(() => setToast(''), 3200);
  };
  return (
    <main>
      <Progress />
      <div className="ann">Design in 3D. Print or embroider. Front and back.</div>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">Custom apparel studio</p>
          <h1>
            {'Design it. See it. Wear it.'.split(' ').map((w, k) => (
              <span className="w" key={k}>
                <span style={{ animationDelay: k * 110 + 'ms' }}>{w}&nbsp;</span>
              </span>
            ))}
          </h1>
          <p className="lead">
            Pick a piece, add your own picture or an AI-made one, and place it exactly where you
            want. Turn it around in 3D before you order.
          </p>
          <div className="row">
            <button className="btn lg" onClick={() => go('collection')}>
              Start designing
            </button>
            <button className="btn ghost lg" onClick={() => go('how')}>
              How it works
            </button>
          </div>
          <ul className="facts">
            <li>3D preview</li>
            <li>Print or embroidery</li>
            <li>Front and back designs</li>
          </ul>
        </div>
        <div className="stage">
          <Shirt3D pid="tee" color="#14213d" designs={designs} view="front" animate />
          <div className="spots" aria-live="off">
            {SPOTS.map((s, k) => (
              <span key={s.k} className={'spot' + (k === i ? ' on' : '')}>
                {s.k}
              </span>
            ))}
          </div>
          <p className="cap">
            {emb ? 'Embroidered' : 'Printed'} on the {q.k.toLowerCase()}. Drag to turn it.
          </p>
        </div>
      </section>
      <section id="collection" className="wrap sec">
        <div className="head">
          <div>
            <h2 className="rv">The collection</h2>
            <p className="sub rv">Open any piece to customise it.</p>
          </div>
          <div className="tabs rv">
            {['All', 'Men', 'Women'].map((t) => (
              <button
                key={t}
                className={'chip' + (sec === t ? ' on' : '')}
                onClick={() => setSec(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {loadErr && (
          <div className="box">
            <p className="err">{loadErr}</p>
            <button className="btn ghost" onClick={load}>
              Try again
            </button>
          </div>
        )}
        {!loadErr && !list && (
          <div className="grid">
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} className="skel" />
            ))}
          </div>
        )}
        {list && !shown.length && <p className="mu">No products here yet.</p>}
        <div className="grid">
          {shown.map((p) => (
            <button key={p.id} className="pcard rv" onClick={() => nav('/design/' + p.id)}>
              <div className="pic">
                {p.imageUrl ? (
                  <img src={imgSrc(p.imageUrl)} alt={p.name} />
                ) : (
                  <Flat pid={p.base} color={p.color} />
                )}
              </div>
              <div className="meta">
                <div>
                  <h3>{p.name}</h3>
                  <span className="mu">{p.section}</span>
                </div>
                <div className="pr">
                  <b>Rs. {Number(p.price).toLocaleString()}</b>
                  <span className="go">Customise →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section id="how" className="wrap sec">
        <h2 className="rv">How it works</h2>
        <div className="cols">
          {STEPS.map((t, k) => (
            <div key={k} className="box rv">
              <span className="num">{k + 1}</span>
              <h3>{t[0]}</h3>
              <p className="mu">{t[1]}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap sec">
        <div className="split rv">
          <div>
            <h2>Print or embroidery, for every design</h2>
            <p className="sub">Choose the finish separately for the front and the back.</p>
          </div>
          <div className="cols two">
            <div className="box">
              <h3>Print</h3>
              <p className="mu">
                Colour-rich artwork pressed into the fabric. Best for detailed pictures and photos.
              </p>
            </div>
            <div className="box">
              <h3>Embroidery</h3>
              <p className="mu">
                Stitched thread with a raised, textured finish. Best for logos and bold shapes. +Rs.
                400 per design.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="plans" className="wrap sec">
        <h2 className="rv">Plans</h2>
        <p className="sub rv">Free accounts get 2 AI pictures. Upgrade when you want more.</p>
        <div className="cols">
          {PLANS.map((p) => (
            <div key={p.n} className={'box rv plan' + (p.hot ? ' hot' : '')}>
              {p.hot && <span className="badge">Most popular</span>}
              <h3>{p.n}</h3>
              <div className="price">
                {p.p}
                <small>{p.per}</small>
              </div>
              <ul>
                {p.f.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <button className={'btn full' + (p.hot ? '' : ' ghost')} onClick={() => pick(p)}>
                Choose {p.n}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="wrap sec narrow">
        <h2 className="rv">Questions</h2>
        {FAQ.map((f) => (
          <details key={f[0]} className="rv">
            <summary>{f[0]}</summary>
            <p className="mu">{f[1]}</p>
          </details>
        ))}
      </section>
      <section id="contact" className="wrap sec">
        <div className="split rv">
          <div>
            <h2>Contact us</h2>
            <p className="sub">
              Questions about an order or a bulk quote? Send us a message and we’ll reply by email.
            </p>
          </div>
          <div className="box">
            {sent ? (
              <p>{sent}</p>
            ) : (
              <>
                <label htmlFor="cn">Name</label>
                <input
                  id="cn"
                  value={cf.name}
                  onChange={(e) => setCf({ ...cf, name: e.target.value })}
                />
                <label htmlFor="ce">Email</label>
                <input
                  id="ce"
                  value={cf.email}
                  onChange={(e) => setCf({ ...cf, email: e.target.value })}
                />
                <label htmlFor="cm">Message</label>
                <textarea
                  id="cm"
                  rows="4"
                  value={cf.body}
                  onChange={(e) => setCf({ ...cf, body: e.target.value })}
                />
                <button
                  className="btn full"
                  disabled={!cf.name || !cf.email || !cf.body}
                  onClick={send}
                >
                  Send message
                </button>
              </>
            )}
          </div>
        </div>
      </section>
      <footer className="foot">
        <div className="wrap footin">
          <span className="logo">
            thread<i>work</i>
          </span>
          <nav>
            {[
              ['collection', 'Collection'],
              ['plans', 'Plans'],
              ['contact', 'Contact'],
            ].map((l) => (
              <button key={l[0]} className="lnk" onClick={() => go(l[0])}>
                {l[1]}
              </button>
            ))}
          </nav>
          <span className="mu">© {new Date().getFullYear()} Threadwork</span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
