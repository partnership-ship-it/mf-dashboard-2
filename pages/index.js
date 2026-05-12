import { useState, useEffect } from 'react';
import Head from 'next/head';

const statusMap = {
  'Client':        { cls: 'badge-client',    label: 'Client' },
  'Répondu':       { cls: 'badge-repondu',   label: 'Répondu' },
  'Email envoyé':  { cls: 'badge-email',     label: 'Email envoyé' },
  'Relance J+5':   { cls: 'badge-relance',   label: 'Relance J+5' },
  'Relance J+10':  { cls: 'badge-relance',   label: 'Relance J+10' },
  'À contacter':   { cls: 'badge-contacter', label: 'À contacter' },
  'Pas intéressé': { cls: 'badge-non',       label: 'Pas intéressé' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Home() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Tous');
  const [brand, setBrand] = useState('');
  const [sector, setSector] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function loadCRM() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/crm');
      const data = await r.json();
      setContacts(data.contacts || []);
    } catch (e) { setError('Erreur de chargement'); }
    setLoading(false);
  }

  useEffect(() => { loadCRM(); }, []);

  const filtered = filter === 'Tous' ? contacts : contacts.filter(c => c.statut === filter);
  const stats = {
    total: contacts.length,
    clients: contacts.filter(c => c.statut === 'Client').length,
    repondu: contacts.filter(c => c.statut === 'Répondu').length,
    enCours: contacts.filter(c => ['Email envoyé','Relance J+5','Relance J+10','À contacter'].includes(c.statut)).length,
  };

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
      setSuccessMsg(`✓ "${brand}" ajoutée — Jérémy en sera notifié.`);
      setBrand(''); setSector(''); setReason('');
      loadCRM();
    } catch(e) { setErrorMsg('Erreur : ' + e.message); }
    setSubmitting(false);
  }

  const filters = ['Tous','Client','Répondu','Email envoyé','À contacter','Pas intéressé'];

  return (
    <>
      <Head>
        <title>Mel & Fernande — Partenariats</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#FAFAF8;--surface:#fff;--border:rgba(0,0,0,.08);--border2:rgba(0,0,0,.14);--text:#1A1917;--muted:#7A7870;--accent:#C45D2E;--green:#3B6D11;--green-light:#EAF3DE;--amber:#854F0B;--amber-light:#FAEEDA;--blue:#185FA5;--blue-light:#E6F1FB;--red:#A32D2D;--red-light:#FCEBEB;--teal:#0F6E56;--teal-light:#E1F5EE}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
        .topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:0 1.5rem;height:56px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
        .logo{font-family:'DM Serif Display',serif;font-size:18px}
        .logo-amp{color:var(--accent)}
        .badge-live{background:var(--green-light);color:var(--green);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px}
        .container{max-width:900px;margin:0 auto;padding:2rem 1.25rem}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:2rem}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1rem 1.25rem}
        .stat-label{font-size:12px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
        .stat-value{font-size:28px;font-weight:300;font-family:'DM Serif Display',serif}
        .stat-value.accent{color:var(--accent)}
        .add-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem;margin-bottom:2rem}
        .add-title{font-family:'DM Serif Display',serif;font-size:18px;margin-bottom:4px}
        .add-subtitle{font-size:13px;color:var(--muted);margin-bottom:1.25rem}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .form-full{grid-template-columns:1fr}
        .field label{display:block;font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
        input,select{width:100%;padding:10px 12px;border:1px solid var(--border2);border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--text);background:var(--bg);outline:none}
        input:focus,select:focus{border-color:var(--accent)}
        .submit-btn{width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-top:4px}
        .submit-btn:disabled{background:var(--muted);cursor:not-allowed}
        .success{background:var(--green-light);color:var(--green);border-radius:8px;padding:12px 16px;font-size:14px;margin-top:12px}
        .error{background:var(--red-light);color:var(--red);border-radius:8px;padding:12px 16px;font-size:14px;margin-top:12px}
        .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .section-title{font-size:13px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px}
        .filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem}
        .filter-btn{padding:5px 14px;border-radius:20px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1px solid var(--border2);background:var(--surface);color:var(--muted);font-weight:500}
        .filter-btn.active{background:var(--text);color:#fff;border-color:var(--text)}
        .col-header{display:grid;grid-template-columns:2fr 1.2fr 1.8fr 1fr;padding:0 1rem 8px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;gap:10px}
        .pipeline{display:flex;flex-direction:column;gap:6px}
        .pipeline-row{display:grid;grid-template-columns:2fr 1.2fr 1.8fr 1fr;align-items:center;gap:10px;padding:12px 1rem;background:var(--surface);border:1px solid var(--border);border-radius:10px}
        .brand-name{font-weight:500;font-size:14px}
        .contact-name{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .date-text{font-size:12px;color:var(--muted)}
        .badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
        .badge-client{background:var(--teal-light);color:var(--teal)}
        .badge-repondu{background:var(--green-light);color:var(--green)}
        .badge-email{background:var(--amber-light);color:var(--amber)}
        .badge-contacter{background:var(--blue-light);color:var(--blue)}
        .badge-non{background:var(--red-light);color:var(--red)}
        .badge-relance{background:#FFF3E0;color:#E65100}
        .empty{text-align:center;padding:3rem;color:var(--muted);font-size:14px}
        .refresh-btn{background:none;border:1px solid var(--border2);border-radius:8px;padding:5px 10px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--muted);cursor:pointer}
        @media(max-width:600px){.col-header,.pipeline-row{grid-template-columns:1.5fr 1fr}.col-header>*:nth-child(3),.col-header>*:nth-child(4),.pipeline-row>*:nth-child(3),.pipeline-row>*:nth-child(4){display:none}.form-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>

      <div className="topbar">
        <div className="logo">Mel <span className="logo-amp">&</span> Fernande</div>
        <span className="badge-live">● Live</span>
      </div>

      <div className="container">
        <div className="stats-grid">
          {[['Total', stats.total, ''], ['Clients', stats.clients, 'accent'], ['Réponses', stats.repondu, ''], ['En cours', stats.enCours, '']].map(([label, val, cls]) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className={`stat-value ${cls}`}>{loading ? '—' : val}</div>
            </div>
          ))}
        </div>

        <div className="add-card">
          <div className="add-title">Suggérer une marque</div>
          <div className="add-subtitle">Tu veux qu'on contacte une marque ? Ajoute-la ici, Jérémy s'occupe du reste.</div>
          <form onSubmit={submitBrand}>
            <div className="form-grid">
              <div className="field"><label>Nom de la marque *</label><input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="ex: Sephora" /></div>
              <div className="field"><label>Secteur</label>
                <select value={sector} onChange={e=>setSector(e.target.value)}>
                  <option value="">Choisir...</option>
                  {['Beauté / Cosmétique','Mode / Luxe','Alimentation / Boissons','Maison / Déco','Tech / Digital','Santé / Bien-être','Finance / Banque','Sport / Loisirs','Autre'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid form-full">
              <div className="field"><label>Pourquoi cette marque ?</label><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="ex: Correspond à notre univers intergénérationnel" /></div>
            </div>
            <button className="submit-btn" type="submit" disabled={submitting}>{submitting ? 'Ajout...' : 'Ajouter →'}</button>
          </form>
          {successMsg && <div className="success">{successMsg}</div>}
          {errorMsg && <div className="error">{errorMsg}</div>}
        </div>

        <div className="section-header">
          <div className="section-title">Pipeline partenariats</div>
          <button className="refresh-btn" onClick={loadCRM}>↻ Actualiser</button>
        </div>

        <div className="filters">
          {filters.map(f => <button key={f} className={`filter-btn${filter===f?' active':''}`} onClick={()=>setFilter(f)}>{f}</button>)}
        </div>

        <div className="col-header"><div>Marque</div><div>Statut</div><div>Contact</div><div>Date</div></div>
        <div className="pipeline">
          {loading ? <div className="empty">Chargement...</div>
          : error ? <div className="empty">{error}</div>
          : filtered.length === 0 ? <div className="empty">Aucune marque dans cette catégorie.</div>
          : filtered.map(c => {
            const s = statusMap[c.statut] || { cls: 'badge-email', label: c.statut };
            return (
              <div key={c.id} className="pipeline-row">
                <div className="brand-name">{c.entreprise}</div>
                <div><span className={`badge ${s.cls}`}>● {s.label}</span></div>
                <div className="contact-name">{c.nom}</div>
                <div className="date-text">{fmtDate(c.date)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
