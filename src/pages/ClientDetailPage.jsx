// src/pages/ClientDetailPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, MapPin, Mail, Phone, Building2,
  AlertTriangle, CheckCircle, Plus, X, ToggleLeft,
  ToggleRight, FileText, Wallet,
} from 'lucide-react';
import { clientsApi } from '../services/api';
import api from '../services/api';

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─────────────────────────────────────────────────────────────
// SiteFormModal — create or edit a site
// ─────────────────────────────────────────────────────────────
function SiteFormModal({ clientId, site, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name:        site?.name        ?? '',
    adresse:     site?.adresse     ?? '',
    ville:       site?.ville       ?? '',
    description: site?.description ?? '',
    contact_nom: site?.contact_nom ?? '',
    contact_tel: site?.contact_tel ?? '',
    latitude:    site?.latitude    ?? '',
    longitude:   site?.longitude   ?? '',
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) =>
      site
        ? api.put(`/sites/${site.id}`, data)
        : api.post('/sites', { ...data, client_id: clientId }),
    onSuccess,
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-xl">
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">
            {site ? 'Modifier le site' : 'Nouveau site'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-2 gap-4">
            {/* Name — full width */}
            <div className="col-span-2">
              <label className="form-label">Nom du site *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ex: Agence Douala Akwa"
                className={`form-input ${errors.name ? 'border-red-300' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="form-label">Ville</label>
              <input value={form.ville} onChange={e => set('ville', e.target.value)}
                placeholder="Ex: Douala" className="form-input" />
            </div>

            <div>
              <label className="form-label">Adresse</label>
              <input value={form.adresse} onChange={e => set('adresse', e.target.value)}
                placeholder="Ex: Rue de la Paix, Bonanjo" className="form-input" />
            </div>

            <div className="col-span-2">
              <label className="form-label">Description / Notes</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={2} className="form-input resize-none"
                placeholder="Informations complémentaires sur ce site..." />
            </div>

            <div>
              <label className="form-label">Contact sur site (Nom)</label>
              <input value={form.contact_nom} onChange={e => set('contact_nom', e.target.value)}
                placeholder="Ex: Jean Mbarga" className="form-input" />
            </div>

            <div>
              <label className="form-label">Contact sur site (Tél)</label>
              <input value={form.contact_tel} onChange={e => set('contact_tel', e.target.value)}
                placeholder="Ex: +237 6XX XXX XXX" className="form-input" />
            </div>

            <div>
              <label className="form-label">Latitude GPS</label>
              <input type="number" step="0.0000001" value={form.latitude}
                onChange={e => set('latitude', e.target.value)}
                placeholder="Ex: 4.0511" className="form-input" />
            </div>

            <div>
              <label className="form-label">Longitude GPS</label>
              <input type="number" step="0.0000001" value={form.longitude}
                onChange={e => set('longitude', e.target.value)}
                placeholder="Ex: 9.7679" className="form-input" />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Enregistrement...' : site ? 'Mettre à jour' : 'Créer le site'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ClientEditModal — edit all client fields
// ─────────────────────────────────────────────────────────────
function ClientEditModal({ client, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nom:              client.nom              ?? '',
    prenom:           client.prenom           ?? '',
    raison_sociale:   client.raison_sociale   ?? '',
    nature:           client.nature           ?? 'physique',
    type:             client.type             ?? 'ordinaire',
    email:            client.email            ?? '',
    telephone:        client.telephone        ?? '',
    adresse:          client.adresse          ?? '',
    ville:            client.ville            ?? '',
    pays:             client.pays             ?? 'Cameroun',
    ninea:            client.ninea            ?? '',
    rccm:             client.rccm             ?? '',
    commercial_email: client.commercial_email ?? '',
    notes:            client.notes            ?? '',
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) => clientsApi.update(client.id, data),
    onSuccess,
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const Field = ({ label, name, type = 'text', textarea }) => (
    <div>
      <label className="form-label">{label}</label>
      {textarea
        ? <textarea value={form[name]} onChange={e => set(name, e.target.value)}
            rows={2} className={`form-input resize-none ${errors[name] ? 'border-red-300' : ''}`} />
        : <input type={type} value={form[name]} onChange={e => set(name, e.target.value)}
            className={`form-input ${errors[name] ? 'border-red-300' : ''}`} />
      }
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">Modifier le client</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Nature & type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nature</label>
              <select value={form.nature} onChange={e => set('nature', e.target.value)} className="form-input">
                <option value="physique">Personne physique</option>
                <option value="morale">Personne morale</option>
              </select>
            </div>
            <div>
              <label className="form-label">Type de facturation</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="form-input">
                <option value="ordinaire">Ordinaire (Prepaid)</option>
                <option value="grand_compte">Grand compte (Postpaid)</option>
              </select>
            </div>
          </div>

          {/* Identity */}
          {form.nature === 'morale'
            ? <Field label="Raison sociale" name="raison_sociale" />
            : <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom" name="prenom" />
                <Field label="Nom *" name="nom" />
              </div>
          }
          {form.nature === 'morale' && <Field label="Représentant (Nom)" name="nom" />}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" name="email" type="email" />
            <Field label="Téléphone" name="telephone" />
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville" name="ville" />
            <Field label="Pays" name="pays" />
          </div>
          <Field label="Adresse" name="adresse" />

          {/* Legal — morale only */}
          {form.nature === 'morale' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="NINEA / Numéro fiscal" name="ninea" />
              <Field label="RCCM" name="rccm" />
            </div>
          )}

          {/* Commercial */}
          <div className="pt-2 border-t border-slate-100">
            <Field label="Email du commercial (notifications) *" name="commercial_email" type="email" />
          </div>

          <Field label="Notes internes" name="notes" textarea />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ClientDetailPage — main page
// ─────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const [showEditClient, setShowEditClient] = useState(false);
  const [showSiteForm,   setShowSiteForm]   = useState(false);
  const [editSite,       setEditSite]       = useState(null);
  const [activeTab,      setActiveTab]      = useState('sites');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn:  () => clientsApi.get(id).then(r => r.data),
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ['client-sites', id],
    queryFn:  () => api.get(`/clients/${id}/sites`).then(r => r.data),
    enabled:  !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries(['client', id]);
    qc.invalidateQueries(['client-sites', id]);
    qc.invalidateQueries(['clients']);
  };

  const suspendMutation = useMutation({
    mutationFn: () => clientsApi.suspend(id),
    onSuccess:  invalidate,
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => clientsApi.unsuspend(id),
    onSuccess:  invalidate,
  });

  const toggleSiteMutation = useMutation({
    mutationFn: ({ siteId, active }) =>
      active
        ? api.patch(`/sites/${siteId}/restore`)
        : api.delete(`/sites/${siteId}`),
    onSuccess: invalidate,
  });

  if (isLoading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-24 text-slate-400">Client introuvable.</div>
  );

  const displayName = client.nature === 'morale'
    ? (client.raison_sociale ?? client.nom)
    : `${client.prenom ?? ''} ${client.nom}`.trim();

  const totalPaid = (client.invoices ?? [])
    .filter(i => i.status === 'payee')
    .reduce((acc, i) => acc + parseFloat(i.total ?? 0), 0);

  const statusCls = {
    prospect: 'badge-amber',
    client:   'badge-green',
    inactif:  'badge-slate',
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Back ──────────────────────────────────────────── */}
      <Link to="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft size={15} /> Retour aux clients
      </Link>

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{displayName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`badge ${statusCls[client.status] ?? 'badge-slate'}`}>
                  {client.status}
                </span>
                <span className={`badge ${client.type === 'grand_compte' ? 'badge-purple' : 'badge-blue'}`}>
                  {client.type === 'grand_compte' ? 'Grand compte' : 'Ordinaire'}
                </span>
                {client.is_suspended && <span className="badge badge-red">Suspendu</span>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEditClient(true)}
              className="flex items-center gap-2 text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} /> Modifier
            </button>
            {client.status === 'client' && (
              client.is_suspended ? (
                <button
                  onClick={() => unsuspendMutation.mutate()}
                  disabled={unsuspendMutation.isPending}
                  className="flex items-center gap-2 text-sm px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle size={14} /> Réactiver
                </button>
              ) : (
                <button
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                  className="flex items-center gap-2 text-sm px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <AlertTriangle size={14} /> Suspendre
                </button>
              )
            )}
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
              <Mail size={13} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.telephone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone size={13} className="text-slate-400 flex-shrink-0" />
              {client.telephone}
            </div>
          )}
          {client.ville && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={13} className="text-slate-400 flex-shrink-0" />
              {[client.ville, client.pays].filter(Boolean).join(', ')}
            </div>
          )}
          {client.raison_sociale && (
            <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
              <Building2 size={13} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{client.raison_sociale}</span>
            </div>
          )}
          {client.ninea && (
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-600">NINEA : </span>{client.ninea}
            </div>
          )}
          {client.rccm && (
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-600">RCCM : </span>{client.rccm}
            </div>
          )}
          {client.commercial_email && (
            <div className="text-sm text-slate-500 col-span-2 md:col-span-1">
              <span className="font-medium text-slate-600">Commercial : </span>
              {client.commercial?.name ?? client.commercial_email}
            </div>
          )}
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Notes internes</p>
            <p className="text-sm text-slate-600 whitespace-pre-line">{client.notes}</p>
          </div>
        )}
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
            <MapPin size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{sites.length}</p>
            <p className="text-xs text-slate-500">Sites installés</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg flex-shrink-0">
            <FileText size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{client.invoices?.length ?? 0}</p>
            <p className="text-xs text-slate-500">Factures</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
            <Wallet size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 leading-tight">{fmt(totalPaid)}</p>
            <p className="text-xs text-slate-500">Total encaissé</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'sites',    label: `Sites (${sites.length})` },
          { key: 'invoices', label: `Factures (${client.invoices?.length ?? 0})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-sm px-4 py-1.5 rounded-lg transition-colors font-medium ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SITES TAB ─────────────────────────────────────── */}
      {activeTab === 'sites' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Sites du client</h2>
            <button
              onClick={() => { setEditSite(null); setShowSiteForm(true); }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={14} /> Ajouter un site
            </button>
          </div>

          {sitesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <MapPin size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Aucun site enregistré</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Ajoutez le premier site de ce client pour démarrer.
              </p>
              <button
                onClick={() => { setEditSite(null); setShowSiteForm(true); }}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus size={14} /> Ajouter un site
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {sites.map(site => (
                <div
                  key={site.id}
                  className={`flex items-start justify-between px-5 py-4 hover:bg-slate-50 transition-colors ${!site.is_active ? 'opacity-55' : ''}`}
                >
                  {/* Site info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${site.is_active ? 'bg-blue-50' : 'bg-slate-100'}`}>
                      <MapPin size={15} className={site.is_active ? 'text-blue-600' : 'text-slate-400'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800">{site.name}</p>
                        {!site.is_active && (
                          <span className="badge badge-slate text-xs">Inactif</span>
                        )}
                      </div>

                      {(site.ville || site.adresse) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          📍 {[site.adresse, site.ville].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {site.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{site.description}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 mt-1">
                        {(site.contact_nom || site.contact_tel) && (
                          <p className="text-xs text-slate-500">
                            👤 {[site.contact_nom, site.contact_tel].filter(Boolean).join(' — ')}
                          </p>
                        )}
                        {site.latitude && site.longitude && (
                          <p className="text-xs text-slate-400 font-mono">
                            🌍 {parseFloat(site.latitude).toFixed(4)}, {parseFloat(site.longitude).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Site action buttons */}
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <button
                      onClick={() => { setEditSite(site); setShowSiteForm(true); }}
                      title="Modifier ce site"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleSiteMutation.mutate({ siteId: site.id, active: !site.is_active })}
                      title={site.is_active ? 'Désactiver ce site' : 'Réactiver ce site'}
                      disabled={toggleSiteMutation.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        site.is_active
                          ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                          : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {site.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVOICES TAB ──────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Factures</h2>
            <Link
              to={`/invoices/new?client_id=${id}`}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus size={14} /> Nouvelle facture
            </Link>
          </div>

          {!client.invoices?.length ? (
            <p className="text-center py-12 text-slate-400 text-sm">Aucune facture pour ce client.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Type</th>
                  <th>Montant TTC</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {client.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs font-medium text-slate-700">{inv.number}</td>
                    <td>
                      <span className={`badge ${
                        inv.type === 'pro_forma'  ? 'badge-amber'  :
                        inv.type === 'definitive' ? 'badge-blue'   :
                        'bg-teal-50 text-teal-700'
                      }`}>
                        {inv.type === 'pro_forma' ? 'Pro-forma' : inv.type === 'definitive' ? 'Définitive' : 'Redevance'}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-800">{fmt(inv.total)}</td>
                    <td className="text-slate-500">{fmtDate(inv.issue_date)}</td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'payee'       ? 'badge-green'  :
                        inv.status === 'annulee'     ? 'badge-red'    :
                        inv.status === 'verrouillee' ? 'badge-purple' : 'badge-amber'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/invoices/${inv.id}`}
                        className="text-xs text-blue-600 hover:underline">
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODALS ────────────────────────────────────────── */}
      {showEditClient && (
        <ClientEditModal
          client={client}
          onClose={() => setShowEditClient(false)}
          onSuccess={() => { setShowEditClient(false); invalidate(); }}
        />
      )}

      {showSiteForm && (
        <SiteFormModal
          clientId={id}
          site={editSite}
          onClose={() => { setShowSiteForm(false); setEditSite(null); }}
          onSuccess={() => { setShowSiteForm(false); setEditSite(null); invalidate(); }}
        />
      )}
    </div>
  );
}
