import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';

const statusMap = {
  'Client':        { cls: 'badge-client',    label: 'Client',        order: 0 },
  'Répondu':       { cls: 'badge-repondu',   label: 'Répondu',       order: 1 },
  'Relance J+10':  { cls: 'badge-relance',   label: 'Relance J+10',  order: 2 },
  'Relance J+5':   { cls: 'badge-relance',   label: 'Relance J+5',   order: 3 },
  'Email envoyé':  { cls: 'badge-email',     label: 'Email envoyé',  order: 4 },
  'À contacter':   { cls: 'badge-contacter', label: 'À contacter',   order: 5 },
  'Pas intéressé': { cls: 'badge-non',       label: 'Pas intéressé', order: 6 },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [brand, setBrand] = useState('');
  const [sector, setSector] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function loadCRM() {
    setLoading(true);
    try {
      const r = await fetch('/api/crm');
      const data = await r.json();
      setContacts(data.contacts || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadCRM(); }, []);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== 'Tous') list = list.filter(c => c.statut === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.entreprise.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      let va, vb;
      if (sortBy === 'date') { va = a.date || ''; vb = b.date || ''; }
      else if (sortBy === 'marque') { va = a.entreprise.toLowerCase(); vb = b.entreprise.toLowerCase(); }
      else if (sortBy === 'statut') { va = statusMap[a.statut]?.order ?? 9; vb = statusMap[b.statut]?.order ?? 9; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [contacts, filter, search, sortBy, sortDir]);

  const stats = {
    total: contacts.length,
    clients: contacts.filter(c => c.statut === 'Client').length,
    repondu: contacts.filter(c => c.statut === 'Répondu').length,
    enCours: contacts.filter(c => ['Email envoyé','Relance J+5','Relance J+10','À contacter'].includes(c.statut)).length,
  };

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  async function submitBrand(e) {
    e.preventDefault();
    if (!brand.trim()) return;
    setSubmitting(true); setSuccessMsg(''); setErrorMsg('');
    try {
      const r = await fetch('/api/add-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, sector, reason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSuccessMsg(`✓ "${brand}" envoyée à Jérémy !`);
      setBrand(''); setSector(''); setReason('');
      setShowForm(false);
    } catch(e) { setErrorMsg('Erreur : ' + e.message); }
    setSubmitting(false);
  }

  const filters = ['Tous','Client','Répondu','Email envoyé','Relance J+5','Relance J+10','À contacter','Pas intéressé'];
  const SortIcon = ({ col }) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  return (
    <>
      <Head>
        <title>Mel & Fernande — Partenariats</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#F7F6F3;--surface:#FFFFFF;--surface2:#F0EFE9;
          --border:rgba(0,0,0,.07);--border2:rgba(0,0,0,.12);
          --text:#18171A;--muted:#7A7870;--accent:#C45D2E;
          --green:#2E7D32;--green-bg:#E8F5E9;
          --amber:#8B5E00;--amber-bg:#FFF8E1;
          --blue:#1565C0;--blue-bg:#E3F2FD;
          --red:#B71C1C;--red-bg:#FFEBEE;
          --teal:#00695C;--teal-bg:#E0F2F1;
          --orange:#E65100;--orange-bg:#FFF3E0;
          --radius:10px;--radius-lg:16px;
        }
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased}
        
        /* TOPBAR */
        .topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;backdrop-filter:blur(8px)}
        .logo{font-family:'DM Serif Display',serif;font-size:19px;letter-spacing:-.3px}
        .logo-amp{color:var(--accent)}
        .topbar-right{display:flex;align-items:center;gap:12px}
        .live-dot{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--green);font-weight:500}
        .live-dot::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .suggest-btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}
        .suggest-btn:hover{background:#a84d25}

        /* CONTAINER */
        .container{max-width:960px;margin:0 auto;padding:2rem 1.5rem}

        /* STATS */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:2rem}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;transition:transform .15s}
        .stat-card:hover{transform:translateY(-2px)}
        .stat-label{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px}
        .stat-value{font-size:32px;font-weight:300;font-family:'DM Serif Display',serif;line-height:1}
        .stat-value.accent{color:var(--accent)}
        .stat-sub{font-size:12px;color:var(--muted);margin-top:4px}

        /* MODAL FORM */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)}
        .modal{background:var(--surface);border-radius:var(--radius-lg);padding:2rem;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.2)}
        .modal-title{font-family:'DM Serif Display',serif;font-size:22px;margin-bottom:6px}
        .modal-sub{font-size:13px;color:var(--muted);margin-bottom:1.5rem}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .form-full{grid-template-columns:1fr!important}
        .field label{display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
        input[type=text],select,textarea{width:100%;padding:10px 12px;border:1.5px solid var(--border2);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);background:var(--bg);outline:none;transition:border-color .15s}
        input:focus,select:focus,textarea:focus{border-color:var(--accent)}
        .modal-actions{display:flex;gap:10px;margin-top:1.25rem}
        .btn-primary{flex:1;padding:11px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
        .btn-primary:hover{background:#a84d25}
        .btn-primary:disabled{background:var(--muted);cursor:not-allowed}
        .btn-secondary{padding:11px 16px;background:transparent;border:1.5px solid var(--border2);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--muted);cursor:pointer}
        .success-banner{background:var(--green-bg);color:var(--green);border-radius:8px;padding:12px 16px;font-size:14px;font-weight:500;margin-top:1rem}
        .error-banner{background:var(--red-bg);color:var(--red);border-radius:8px;padding:12px 16px;font-size:14px;margin-top:1rem}

        /* PIPELINE SECTION */
        .pipeline-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:10px}
        .section-title{font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
        .pipeline-controls{display:flex;gap:8px;align-items:center}
        .search-box{display:flex;align-items:center;background:var(--surface);border:1.5px solid var(--border2);border-radius:8px;padding:0 10px;gap:6px}
        .search-box input{border:none;background:transparent;font-size:13px;padding:8px 0;width:180px;outline:none;color:var(--text)}
        .search-icon{color:var(--muted);font-size:14px}
        .refresh-btn{background:none;border:1.5px solid var(--border2);border-radius:8px;padding:7px 12px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--muted);cursor:pointer;white-space:nowrap}
        .refresh-btn:hover{border-color:var(--text);color:var(--text)}

        /* FILTERS */
        .filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
        .filter-btn{padding:5px 14px;border-radius:20px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid var(--border2);background:var(--surface);color:var(--muted);font-weight:500;transition:all .15s;white-space:nowrap}
        .filter-btn:hover{border-color:var(--text);color:var(--text)}
        .filter-btn.active{background:var(--text);color:#fff;border-color:var(--text)}

        /* TABLE */
        .table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .col-header{display:grid;grid-template-columns:2.5fr 1.3fr 1.8fr 1fr;padding:10px 1.25rem;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;gap:10px;border-bottom:1px solid var(--border);background:var(--surface2)}
        .col-header span{cursor:pointer;user-select:none}
        .col-header span:hover{color:var(--text)}
        .pipeline{display:flex;flex-direction:column}
        .pipeline-row{display:grid;grid-template-columns:2.5fr 1.3fr 1.8fr 1fr;align-items:center;gap:10px;padding:13px 1.25rem;border-bottom:1px solid var(--border);transition:background .1s}
        .pipeline-row:last-child{border-bottom:none}
        .pipeline-row:hover{background:var(--surface2)}
        .brand-name{font-weight:500;font-size:14px;color:var(--text)}
        .contact-name{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .date-text{font-size:12px;color:var(--muted)}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
        .badge::before{content:'●';font-size:8px}
        .badge-client{background:var(--teal-bg);color:var(--teal)}
        .badge-repondu{background:var(--green-bg);color:var(--green)}
        .badge-email{background:var(--amber-bg);color:var(--amber)}
        .badge-contacter{background:var(--blue-bg);color:var(--blue)}
        .badge-non{background:var(--red-bg);color:var(--red)}
        .badge-relance{background:var(--orange-bg);color:var(--orange)}
        .empty{text-align:center;padding:3rem;color:var(--muted);font-size:14px}
        .result-count{font-size:12px;color:var(--muted);margin-bottom:8px}

        /* SUCCESS TOAST */
        .toast{position:fixed;bottom:2rem;right:2rem;background:var(--green);color:#fff;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:500;box-shadow:0 8px 30px rgba(0,0,0,.2);z-index:300;animation:slideUp .3s ease}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}

        @media(max-width:640px){
          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .col-header,.pipeline-row{grid-template-columns:1.5fr 1fr}
          .col-header>*:nth-child(3),.col-header>*:nth-child(4),.pipeline-row>*:nth-child(3),.pipeline-row>*:nth-child(4){display:none}
          .form-grid{grid-template-columns:1fr}
          .search-box input{width:120px}
          .topbar{padding:0 1rem}
          .container{padding:1rem}
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo">Mel <span className="logo-amp">&</span> Fernande</div>
        <div className="topbar-right">
          <div className="live-dot">Live</div>
          <button className="suggest-btn" onClick={() => setShowForm(true)}>+ Suggérer une marque</button>
        </div>
      </div>

      <div className="container">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Contacts total</div>
            <div className="stat-value">{loading ? '—' : stats.total}</div>
            <div className="stat-sub">dans le CRM</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Clients actifs</div>
            <div className="stat-value accent">{loading ? '—' : stats.clients}</div>
            <div className="stat-sub">contrats signés</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ont répondu</div>
            <div className="stat-value">{loading ? '—' : stats.repondu}</div>
            <div className="stat-sub">en discussion</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">En cours</div>
            <div className="stat-value">{loading ? '—' : stats.enCours}</div>
            <div className="stat-sub">emails envoyés</div>
          </div>
        </div>

        {/* PIPELINE */}
        <div className="pipeline-header">
          <div className="section-title">Pipeline partenariats</div>
          <div className="pipeline-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une marque..." />
            </div>
            <button className="refresh-btn" onClick={loadCRM}>↻ Actualiser</button>
          </div>
        </div>

        <div className="filters">
          {filters.map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {!loading && <div className="result-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}{search ? ` pour "${search}"` : ''}</div>}

        <div className="table-wrap">
          <div className="col-header">
            <span onClick={() => toggleSort('marque')}>Marque <SortIcon col="marque" /></span>
            <span onClick={() => toggleSort('statut')}>Statut <SortIcon col="statut" /></span>
            <span>Contact</span>
            <span onClick={() => toggleSort('date')}>Date <SortIcon col="date" /></span>
          </div>
          <div className="pipeline">
            {loading ? <div className="empty">Chargement...</div>
            : filtered.length === 0 ? <div className="empty">Aucun résultat.</div>
            : filtered.map(c => {
              const s = statusMap[c.statut] || { cls: 'badge-email', label: c.statut };
              return (
                <div key={c.id} className="pipeline-row">
                  <div className="brand-name">{c.entreprise}</div>
                  <div><span className={`badge ${s.cls}`}>{s.label}</span></div>
                  <div className="contact-name">{c.nom}</div>
                  <div className="date-text">{fmtDate(c.date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL SUGGESTION */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-title">Suggérer une marque</div>
            <div className="modal-sub">Tu veux qu'on contacte quelqu'un ? Jérémy s'occupe du reste.</div>
            <form onSubmit={submitBrand}>
              <div className="form-grid">
                <div className="field">
                  <label>Nom de la marque *</label>
                  <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="ex: Sephora" />
                </div>
                <div className="field">
                  <label>Secteur</label>
                  <select value={sector} onChange={e => setSector(e.target.value)}>
                    <option value="">Choisir...</option>
                    {['Beauté / Cosmétique','Mode / Luxe','Alimentation / Boissons','Maison / Déco','Tech / Digital','Santé / Bien-être','Finance / Banque','Sport / Loisirs','Autre'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid form-full">
                <div className="field">
                  <label>Pourquoi cette marque ?</label>
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="ex: Correspond à notre univers intergénérationnel" />
                </div>
              </div>
              {errorMsg && <div className="error-banner">{errorMsg}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer à Jérémy →'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="toast" onClick={() => setSuccessMsg('')}>{successMsg}</div>
      )}
    </>
  );
}
