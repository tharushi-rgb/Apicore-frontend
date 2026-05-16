import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './styles/index.css';

const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('redirect');
if (redirectPath) {
  window.history.replaceState(null, '', redirectPath);
}

// If no explicit `redirect` param, attempt to restore the last visited path
// saved per-tab in sessionStorage. This ensures that a cold reload (or a
// back/forward navigation) returns the user to the page they were last on
// without relying on server-side rewrite rules.
if (!redirectPath) {
  try {
    const last = sessionStorage.getItem('apicore_last_path');
    if (last && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
      window.history.replaceState(null, '', last);
    }
  } catch {
    // ignore sessionStorage failures
  }
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
