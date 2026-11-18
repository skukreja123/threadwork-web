export const PATHS = {
  s: 'M130 62L90 77L40 132L75 162L105 137L105 400L295 400L295 137L325 162L360 132L310 77L270 62Q200 100 130 62Z',
  l: 'M130 70L85 85L35 330L75 340L108 170L108 400L292 400L292 170L325 340L365 330L315 85L270 70Q200 110 130 70Z',
  w: 'M135 62L100 75L60 120L90 145L110 125L115 300L285 300L290 125L310 145L340 120L300 75L265 62Q200 95 135 62Z',
  ds: 'M125 70L75 85L30 175L68 195L92 160L92 400L308 400L308 160L332 195L370 175L325 85L275 70Q200 108 125 70Z',
  dl: 'M125 70L75 85L25 340L65 350L92 190L92 400L308 400L308 190L335 350L375 340L325 85L275 70Q200 108 125 70Z',
};
export function pathFor(pid, sleeve) {
  if (pid === 'wtop') return PATHS.w;
  const long = pid === 'hoodie' || sleeve === 'full';
  return pid === 'drop' ? (long ? PATHS.dl : PATHS.ds) : long ? PATHS.l : PATHS.s;
}
export function zonesFor(pid, sleeve, view) {
  const long = pid === 'hoodie' || sleeve === 'full';
  const sy = pid === 'drop' ? (long ? 260 : 140) : long ? 250 : 122;
  const sx = pid === 'drop' ? (long ? 58 : 55) : 72;
  const sl = [
    { k: 'Left sleeve', x: 400 - sx, y: sy },
    { k: 'Right sleeve', x: sx, y: sy },
  ];
  if (view === 'front')
    return [
      { k: 'Center chest', x: 200, y: 185 },
      { k: 'Left chest', x: 245, y: 140 },
      { k: 'Right chest', x: 155, y: 140 },
      { k: 'Left shoulder', x: 255, y: 92 },
      { k: 'Right shoulder', x: 145, y: 92 },
      ...sl,
    ];
  return [
    { k: 'Upper back', x: 200, y: 135 },
    { k: 'Center back', x: 200, y: 215 },
    { k: 'Lower back', x: 200, y: 330 },
    ...sl,
  ];
}
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, c + amt));
  return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')';
}
export function isLight(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 > 150;
}

export function fileToDataUrl(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const m = Math.min(1, 520 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = im.width * m;
        c.height = im.height * m;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/png'));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

export function genArt(prompt) {
  let h = 0;
  for (const ch of prompt) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 4294967296;
  };
  const hue = Math.floor(rnd() * 360);
  let s =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="hsl(' +
    hue +
    ',70%,18%)"/>';
  for (let i = 0; i < 9; i++) {
    const x = 40 + rnd() * 220,
      y = 40 + rnd() * 220,
      r = 18 + rnd() * 60,
      c = 'hsl(' + (((hue + rnd() * 140) % 360) | 0) + ',80%,' + ((45 + rnd() * 25) | 0) + '%)';
    s +=
      i % 3 === 0
        ? '<polygon points="' +
          x +
          ',' +
          (y - r) +
          ' ' +
          (x + r) +
          ',' +
          (y + r * 0.7) +
          ' ' +
          (x - r) +
          ',' +
          (y + r * 0.7) +
          '" fill="' +
          c +
          '" opacity=".85"/>'
        : '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '" opacity=".8"/>';
  }
  const t = prompt.trim().slice(0, 14).replace(/[<>&]/g, '');
  s +=
    '<text x="150" y="160" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="26" fill="#fff" stroke="#000" stroke-width=".8">' +
    t +
    '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
}

export function Studio({ pid: productId, go, onOrder }) {
  const p = api.products().find((x) => x.id === productId);
  const pid = p.base;
  const [color, setColor] = useState('#ffffff');
  const [sleeve, setSleeve] = useState('short');
  const [view, setView] = useState('front');
  const [src, setSrc] = useState(null);
  const [pos, setPos] = useState({ x: 200, y: 185 });
  const [size, setSize] = useState(90);
  const [mode, setMode] = useState('print');
  const [zone, setZone] = useState('Center chest');
  const [prompt, setPrompt] = useState('');
  const [gallery, setGallery] = useState([]);
  const [step, setStep] = useState('design');
  const [f, setF] = useState({ name: '', phone: '', address: '', size: 'M', qty: 1, note: '' });
  const drag = useRef(false);
  const done = useRef(false);
  const [gl, setGl] = useState(true);
  const onDrag3 = (x, y) => {
    setPos({ x, y });
    setZone('Custom position');
  };
  const zones = zonesFor(pid, sleeve, view);
  const price =
    (p.price +
      (src && mode === 'embroidery' ? EMB_EXTRA : 0) +
      (pid !== 'hoodie' && sleeve === 'full' ? 300 : 0)) *
    f.qty;
  const add = (u) => {
    setSrc(u);
    setGallery((g) => (g.includes(u) ? g : [u, ...g].slice(0, 6)));
  };
  const [limitMsg, setLimitMsg] = useState('');
  const gen = () => {
    const n = LS.get('tw-gen', 0);
    if (n >= 2) {
      setLimitMsg('You have used your 2 free AI pictures. Upgrade your plan to make more.');
      return;
    }
    LS.set('tw-gen', n + 1);
    setLimitMsg(1 - n + ' free AI picture(s) left.');
    add(genArt(prompt));
  };
  const snap = (z) => {
    setZone(z.k);
    setPos({ x: z.x, y: z.y });
    setSize(
      z.k.includes('sleeve')
        ? 44
        : z.k.includes('shoulder') || z.k === 'Left chest' || z.k === 'Right chest'
          ? 56
          : 90
    );
  };
  const changeView = (v) => {
    setView(v);
    const z = zonesFor(pid, sleeve, v)[0];
    snap(z);
  };
  const onMove = (e, end) => {
    if (end) {
      drag.current = false;
      return;
    }
    if (!drag.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(20, Math.min(380, ((e.clientX - r.left) * 400) / r.width));
    const y = Math.max(20, Math.min(420, ((e.clientY - r.top) * 440) / r.height));
    setPos({ x, y });
    setZone('Custom position');
  };
  const onDown = (e) => {
    drag.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const design = src ? { src, x: pos.x, y: pos.y, size, mode } : null;
  const submit = () => {
    if (!f.name || !f.phone || !f.address) return;
    onOrder({
      id: 'TW-' + Date.now().toString().slice(-6),
      at: new Date().toISOString(),
      product: p.name,
      pid,
      color,
      sleeve: pid === 'hoodie' ? 'full' : sleeve,
      view,
      zone,
      mode,
      design: src,
      x: pos.x,
      y: pos.y,
      size,
      total: price,
      customer: f,
    });
  };
  return html`<div class="wrap">
    <header class="top">
      <button class="logo" onClick=${() => go('')}>thread<i>work</i></button
      ><button class="back" onClick=${() => go('')}>Back to products</button>
    </header>
    <div class="studio">
      <div class="stage">
        ${gl ? html`<${Shirt3D} pid=${pid} color=${color} sleeve=${sleeve} view=${view} design=${design} onDrag=${onDrag3} onFail=${() => setGl(false)} />` : html`<${Shirt} pid=${pid} color=${color} sleeve=${sleeve} view=${view} design=${design} onMove=${onMove} onDown=${onDown} />`}
        <div class="row" style=${{ justifyContent: 'center', marginTop: 8 }}>
          <button
            class=${'chip' + (view === 'front' ? ' on' : '')}
            onClick=${() => changeView('front')}
          >
            Front
          </button>
          <button
            class=${'chip' + (view === 'back' ? ' on' : '')}
            onClick=${() => changeView('back')}
          >
            Back
          </button>
          <button class=${'chip' + (gl ? ' on' : '')} onClick=${() => setGl(!gl)}>
            ${gl ? '3D view' : 'Flat view'}
          </button>
        </div>
        <p class="hint" style=${{ textAlign: 'center' }}>
          ${src ? (gl ? 'Drag the picture to move it. Drag empty space to spin the ' + p.name.toLowerCase() + '.' : 'Drag the picture anywhere on the ' + p.name.toLowerCase() + '.') : gl ? 'Drag to spin it. Add a picture to start placing it.' : 'Add a picture to start placing it.'}
        </p>
      </div>
      <div class="panel">
        <h2 style=${{ margin: 0, fontSize: 30, letterSpacing: '-.03em' }}>${p.name}</h2>
        ${
          step === 'design'
            ? html`<${React.Fragment}>
                <div class="box">
                  <h4>Colour</h4>
                  <div class="row">
                    ${COLORS.map((c) => html`<button key=${c} aria-label=${'Colour ' + c} class=${'sw' + (c === color ? ' on' : '')} style=${{ background: c }} onClick=${() => setColor(c)} />`)}
                  </div>
                  ${
                    p.sleeves &&
                    html`<h4 style=${{ marginTop: 14 }}>Sleeves</h4>
                      <div class="row">
                        <button
                          class=${'chip' + (sleeve === 'short' ? ' on' : '')}
                          onClick=${() => setSleeve('short')}
                        >
                          Short</button
                        ><button
                          class=${'chip' + (sleeve === 'full' ? ' on' : '')}
                          onClick=${() => setSleeve('full')}
                        >
                          Full (+Rs. 300)
                        </button>
                      </div>`
                  }
                </div>
                <div class="box">
                  <h4>Your picture</h4>
                  <input
                    type="file"
                    accept="image/*"
                    aria-label="Upload a picture"
                    onChange=${async (e) => {
                      const fl = e.target.files[0];
                      if (fl) add(await fileToDataUrl(fl));
                    }}
                  />
                  <label class="f" for="ai">Or generate one with AI</label>
                  <div class="row" style=${{ flexWrap: 'nowrap' }}>
                    <input
                      id="ai"
                      type="text"
                      placeholder="e.g. neon tiger"
                      value=${prompt}
                      onInput=${(e) => setPrompt(e.target.value)}
                    /><button class="btn" disabled=${!prompt.trim()} onClick=${gen}>
                      Generate
                    </button>
                  </div>
                  <p class="hint">
                    ${limitMsg || 'Free plan: 2 AI pictures. Preview artwork only until the backend is connected.'}
                  </p>
                  ${gallery.length > 0 && html`<div class="thumbs">${gallery.map((u) => html`<button key=${u} class=${u === src ? 'on' : ''} onClick=${() => setSrc(u)}><img src=${u} alt="Your picture" /></button>`)}</div>`}
                </div>
                ${
                  src &&
                  html`<${React.Fragment}>
                    <div class="box">
                      <h4>Where it goes</h4>
                      <div class="row">
                        ${zones.map((z) => html`<button key=${z.k} class=${'chip' + (zone === z.k ? ' on' : '')} onClick=${() => snap(z)}>${z.k}</button>`)}
                      </div>
                      <label class="f" for="sz">Size</label
                      ><input
                        id="sz"
                        type="range"
                        min="30"
                        max="200"
                        value=${size}
                        onInput=${(e) => setSize(+e.target.value)}
                      />
                      <p class="hint">
                        Quick spots above, or drag the picture for any custom spot. Switch to Back
                        for back placement.
                      </p>
                    </div>
                    <div class="box">
                      <h4>How it’s applied</h4>
                      <div class="row">
                        <button
                          class=${'chip' + (mode === 'print' ? ' on' : '')}
                          onClick=${() => setMode('print')}
                        >
                          Print</button
                        ><button
                          class=${'chip' + (mode === 'embroidery' ? ' on' : '')}
                          onClick=${() => setMode('embroidery')}
                        >
                          Embroidered (+Rs. ${EMB_EXTRA})
                        </button>
                      </div>
                    </div></${React.Fragment}
                  >`
                }
                <div class="box">
                  <div class="total">
                    <span>Total</span><span>Rs. ${price.toLocaleString()}</span>
                  </div>
                  <button
                    class="btn"
                    style=${{ width: '100%', marginTop: 10 }}
                    disabled=${!src}
                    onClick=${() => setStep('checkout')}
                  >
                    Proceed to order</button
                  >${!src && html`<p class="hint">Add a picture first.</p>`}
                </div>
              <//>`
            : html`<div class="box">
                <h4>Delivery details</h4>
                <label class="f" for="n">Full name</label
                ><input
                  id="n"
                  type="text"
                  value=${f.name}
                  onInput=${(e) => setF({ ...f, name: e.target.value })}
                />
                <label class="f" for="ph">Phone</label
                ><input
                  id="ph"
                  type="tel"
                  value=${f.phone}
                  onInput=${(e) => setF({ ...f, phone: e.target.value })}
                />
                <label class="f" for="ad">Address</label
                ><textarea
                  id="ad"
                  rows="3"
                  value=${f.address}
                  onInput=${(e) => setF({ ...f, address: e.target.value })}
                ></textarea>
                <div class="row" style=${{ flexWrap: 'nowrap' }}>
                  <div style=${{ flex: 1 }}>
                    <label class="f" for="sz2">Size</label
                    ><select
                      id="sz2"
                      value=${f.size}
                      onChange=${(e) => setF({ ...f, size: e.target.value })}
                    >
                      ${['S', 'M', 'L', 'XL', 'XXL'].map((s) => html`<option key=${s}>${s}</option>`)}
                    </select>
                  </div>
                  <div style=${{ flex: 1 }}>
                    <label class="f" for="q">Quantity</label
                    ><input
                      id="q"
                      type="number"
                      min="1"
                      value=${f.qty}
                      onInput=${(e) => setF({ ...f, qty: Math.max(1, +e.target.value || 1) })}
                    />
                  </div>
                </div>
                <label class="f" for="nt">Note for the printer (optional)</label
                ><input
                  id="nt"
                  type="text"
                  value=${f.note}
                  onInput=${(e) => setF({ ...f, note: e.target.value })}
                />
                <div class="total" style=${{ margin: '14px 0 10px' }}>
                  <span>Total</span><span>Rs. ${price.toLocaleString()}</span>
                </div>
                <div class="row">
                  <button class="btn ghost" onClick=${() => setStep('design')}>
                    Back to design</button
                  ><button
                    class="btn"
                    disabled=${!f.name || !f.phone || !f.address}
                    onClick=${submit}
                  >
                    Place order
                  </button>
                </div>
              </div>`
        }
      </div>
    </div>
  </div>`;
}

export function Orders() {
  const [orders, setOrders] = useState(readOrders);
  const del = (id) => {
    const n = orders.filter((o) => o.id !== id);
    setOrders(n);
    saveOrders(n);
  };
  return html`<div class="wrap">
    <h2 style=${{ fontSize: 34, letterSpacing: '-.03em', margin: '10px 0 16px' }}>
      Orders (${orders.length})
    </h2>
    ${orders.length === 0 && html`<div class="box"><p style=${{ margin: 0 }}>No orders yet. Place a test order from any product and it will show up here.</p></div>`}
    <div class="orders">
      ${orders.map(
        (o) =>
          html`<article key=${o.id} class="order">
            <div>
              <${Shirt}
                pid=${o.pid}
                color=${o.color}
                sleeve=${o.sleeve}
                view=${o.view}
                design=${{ src: o.design, x: o.x, y: o.y, size: o.size, mode: o.mode }}
              />
              <p class="cap">Product with design (${o.view})</p>
            </div>
            <div>
              <img class="dz" src=${o.design} alt="Design file" />
              <p class="cap">Design only</p>
            </div>
            <div class="info">
              <h3 style=${{ margin: '0 0 4px' }}>
                ${o.id}
                <span class="tag">${o.mode === 'embroidery' ? 'Embroidered' : 'Print'}</span>
              </h3>
              <p style=${{ margin: '0 0 8px', color: 'var(--mute)' }}>
                ${new Date(o.at).toLocaleString()}
              </p>
              <p style=${{ margin: 0 }}>
                <b>${o.product}</b>, ${o.sleeve === 'full' ? 'full sleeves' : 'short sleeves'}, size
                ${o.customer.size}, qty ${o.customer.qty}
              </p>
              <p style=${{ margin: '4px 0' }}>Placement: ${o.zone} (${o.view})</p>
              <p style=${{ margin: '4px 0' }}>
                Colour:
                <span
                  style=${{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: o.color, border: '1px solid var(--line)', verticalAlign: 'middle' }}
                ></span>
                ${o.color}
              </p>
              <p style=${{ margin: '4px 0' }}>
                ${o.customer.name}, ${o.customer.phone}<br />${o.customer.address}
              </p>
              ${o.customer.note && html`<p style=${{ margin: '4px 0' }}>Note: ${o.customer.note}</p>`}
              <p style=${{ margin: '8px 0', fontWeight: 800 }}>Rs. ${o.total.toLocaleString()}</p>
              <button class="btn ghost" onClick=${() => del(o.id)}>Delete order</button>
            </div>
          </article>`
      )}
    </div>
  </div>`;
}

export const COLORS = ['#ffffff', '#1b1b1f', '#2b59ff', '#c0392b', '#2e7d5b', '#f2c14e', '#8e8e93'];
