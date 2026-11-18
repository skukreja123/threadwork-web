import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthForm, useAuth } from './auth';
import { PATHS } from './shapes';
const POINTS = [
  ['3D preview', 'Turn your piece around before you order.'],
  ['Print or embroidery', 'Choose the finish for every design.'],
  ['Front and back', 'Place a picture on the chest, shoulder, sleeve or back.'],
];
export default function AuthPage({ mode }) {
  const { user, setUser } = useAuth(),
    nav = useNavigate(),
    loc = useLocation();
  if (user) return <Navigate to="/" replace />;
  const done = (u) => {
    setUser(u);
    nav((loc.state && loc.state.from) || (['admin', 'staff'].includes(u.role) ? '/admin' : '/'), {
      replace: true,
    });
  };
  return (
    <div className="authpage">
      <aside className="authside">
        <Link to="/" className="logo light">
          thread<i>work</i>
        </Link>
        <div>
          <h1>Design it. See it. Wear it.</h1>
          <ul>
            {POINTS.map((p) => (
              <li key={p[0]}>
                <b>{p[0]}</b>
                <span>{p[1]}</span>
              </li>
            ))}
          </ul>
        </div>
        <svg viewBox="0 0 400 440" className="sideshirt" aria-hidden="true">
          <path d={PATHS.s} fill="rgba(255,255,255,.07)" />
          <path d={PATHS.s} className="stitchw" fill="none" />
          <circle cx="245" cy="140" r="27" fill="#fff" />
          <text
            x="245"
            y="151"
            textAnchor="middle"
            fontWeight="800"
            fontSize="28"
            fill="#12141a"
            fontFamily="Arial,sans-serif"
          >
            TW
          </text>
        </svg>
      </aside>
      <main className="authmain">
        <div className="authwrap">
          <Link to="/" className="logo mobonly">
            thread<i>work</i>
          </Link>
          <AuthForm
            mode={mode}
            onModeChange={(m) => nav('/' + m, { replace: true, state: loc.state })}
            onDone={done}
          />
          <Link to="/" className="backlink">
            ← Back to the shop
          </Link>
        </div>
      </main>
    </div>
  );
}
