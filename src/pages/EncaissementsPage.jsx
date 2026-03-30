// src/pages/EncaissementsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { encaissementsApi, clientsApi, invoicesApi } from '../services/api';
import { Plus, Send, X, Upload, FileText, CheckCircle } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

const METHODS = [
  { value: 'virement',     label: 'Virement bancaire' },
  { value: 'especes',      label: 'Espèces' },
  { value: 'cheque',       label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'autre',        label: 'Autre' },
];

// ─── 2-step encaissement modal ────────────────────────────────
function EncaissementModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    client_id: '', invoice_id: '', redevance_id: '',
    amount: '', payment_method: 'virement',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '', proof: null,
  });
  const [errors, setErrors]     = useState({});
  const [clientSearch, setClientSearch] = useState('');

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const { data: clientsData } = useQuery({
    queryKey: ['clients-enc', clientSearch],
    queryFn:  () => clientsApi.list({ search: clientSearch, status: 'client' }).then(r => r.data),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-enc', form.client_id],
    queryFn:  () => invoicesApi.list({ client_id: form.client_id }).then(r => r.data),
    enabled:  !!form.client_id,
  });

  // Filter to only unpaid locked invoices
  const payableInvoices = (invoicesData?.data ?? []).filter(
    i => i.status === 'verrouillee' || i.status === 'validee'
  );

  const selectedClient  = (clientsData?.data ?? []).find(c => String(c.id) === String(form.client_id));
  const selectedInvoice = (invoicesData?.data ?? []).find(i => String(i.id) === String(form.invoice_id));

  const mutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData();
      fd.append('client_id',      String(data.client_id));
      fd.append('invoice_id',     String(data.invoice_id));
      fd.append('amount',         String(data.amount));
      fd.append('payment_method', data.payment_method);
      fd.append('payment_date',   data.payment_date);
      if (data.redevance_id) fd.append('redevance_id', String(data.redevance_id));
      if (data.notes)        fd.append('notes', data.notes);
      fd.append('proof', data.proof);
      return encaissementsApi.create(fd);
    },
    onSuccess,
    onError: (err) => {
      const errs = err.response?.data?.errors ?? {};
      setErrors(errs);
      if (errs.client_id || errs.invoice_id) setStep(1);
      else setStep(2);
    },
  });

  const canNext   = form.client_id && form.invoice_id;
  const canSubmit = form.amount && form.payment_date && form.proof;

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-lg">
        <div className="modal-header">
          <div>
            <h2 className="font-semibold text-slate-800">Nouvel encaissement</h2>
            <p className="text-xs text-slate-400 mt-0.5">Étape {step} sur 2</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>

        {/* Progress bar */}
        <div className="flex px-6 pt-4 gap-2">
          {[1,2].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`}/>
          ))}
        </div>

        {/* ── Step 1: Select client & invoice ── */}
        {step === 1 && (
          <div className="modal-body">
            <div className="space-y-4">
              <div>
                <label className="form-label">Client *</label>
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                  className="form-input mb-2" placeholder="Tapez le nom du client..." />
                {(clientsData?.data ?? []).length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {(clientsData.data).map(c => {
                      const name = c.raison_sociale ?? `${c.prenom ?? ''} ${c.nom}`.trim();
                      const active = String(form.client_id) === String(c.id);
                      return (
                        <button key={c.id} onClick={() => {
                          set('client_id', String(c.id));
                          set('invoice_id', '');
                          set('amount', '');
                          setClientSearch(name);
                        }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                        >
                          <span>{name}</span>
                          {active && <CheckCircle size={14} className="text-blue-600 flex-shrink-0"/>}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.client_id && <p className="text-xs text-red-500 mt-1">{errors.client_id[0]}</p>}
              </div>

              {form.client_id && (
                <div>
                  <label className="form-label">Facture à régler *</label>
                  {payableInvoices.length === 0 ? (
                    <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
                      Aucune facture en attente de paiement pour ce client.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      {payableInvoices.map(inv => {
                        const active = String(form.invoice_id) === String(inv.id);
                        return (
                          <button key={inv.id} onClick={() => {
                            set('invoice_id', String(inv.id));
                            set('amount', String(inv.total));
                          }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors ${active ? 'bg-blue-50' : ''}`}
                          >
                            <div>
                              <p className={`font-mono font-medium ${active ? 'text-blue-700' : 'text-slate-800'}`}>{inv.number}</p>
                              <p className="text-xs text-slate-400 capitalize">{inv.type?.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-800">{fmt(inv.total)}</p>
                              {active && <CheckCircle size={14} className="text-blue-600 ml-auto mt-1"/>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {errors.invoice_id && <p className="text-xs text-red-500 mt-1">{errors.invoice_id[0]}</p>}
                </div>
              )}

              {selectedClient && selectedInvoice && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm space-y-1">
                  <p className="text-green-700 font-medium">
                    {selectedClient.raison_sociale ?? `${selectedClient.prenom ?? ''} ${selectedClient.nom}`}
                  </p>
                  <p className="text-green-600 text-xs">
                    Facture <strong>{selectedInvoice.number}</strong> — <strong>{fmt(selectedInvoice.total)}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Payment details ── */}
        {step === 2 && (
          <div className="modal-body">
            <div className="space-y-4">
              {/* Summary pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                <p className="font-medium text-slate-700">
                  {selectedClient?.raison_sociale ?? selectedClient?.nom}
                </p>
                <p className="text-slate-500 text-xs font-mono">{selectedInvoice?.number} — {fmt(selectedInvoice?.total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Montant encaissé (FCFA) *</label>
                  <input type="number" min="1" value={form.amount}
                    onChange={e => set('amount', e.target.value)}
                    className={`form-input ${errors.amount ? 'border-red-300' : ''}`}
                    placeholder="Ex: 45000" />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
                </div>
                <div>
                  <label className="form-label">Date de paiement *</label>
                  <input type="date" value={form.payment_date}
                    onChange={e => set('payment_date', e.target.value)}
                    className={`form-input ${errors.payment_date ? 'border-red-300' : ''}`}/>
                  {errors.payment_date && <p className="text-xs text-red-500 mt-1">{errors.payment_date[0]}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Méthode de paiement *</label>
                <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className="form-input">
                  {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              {/* Proof upload */}
              <div>
                <label className="form-label">Preuve de paiement * (PDF, JPG, PNG)</label>
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
                  form.proof ? 'border-green-400 bg-green-50' : errors.proof ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }`}>
                  {form.proof ? (
                    <>
                      <FileText size={20} className="text-green-600"/>
                      <span className="text-sm font-medium text-green-700">{form.proof.name}</span>
                      <span className="text-xs text-green-500">{(form.proof.size / 1024).toFixed(0)} Ko</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-slate-400"/>
                      <span className="text-sm text-slate-500">Cliquez pour choisir un fichier</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => set('proof', e.target.files[0] || null)}/>
                </label>
                {errors.proof && <p className="text-xs text-red-500 mt-1">{errors.proof[0]}</p>}
                {!form.proof && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ L'enregistrement est impossible sans preuve de paiement.
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Notes (optionnel)</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={2} className="form-input resize-none"
                  placeholder="Réf. virement, n° chèque, observations..."/>
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="btn-secondary mr-auto">← Retour</button>
          )}
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!canNext} className="btn-primary disabled:opacity-50">
              Suivant →
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate(form)}
              disabled={!canSubmit || mutation.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function EncaissementsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['encaissements', search, filterDate, page],
    queryFn:  () => encaissementsApi.list({ search, date: filterDate, page }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const receiptMutation = useMutation({
    mutationFn: (id) => encaissementsApi.sendReceipt(id),
  });

  const cancelMutation = useMutation({
    mutationFn:  (id) => encaissementsApi.cancel(id),
    onSuccess:   () => qc.invalidateQueries(['encaissements']),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Encaissements</h1>
          <p className="text-sm text-slate-500">Paiements reçus enregistrés</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-green-600 font-medium">Total du jour</p>
            <p className="text-lg font-bold text-green-700">{fmt(data?.daily_total ?? 0)}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16}/> Nouvel encaissement
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par référence..." className="form-input flex-1 min-w-48"/>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-sm text-slate-500 hover:text-red-500 px-2">✕</button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Facture</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Date</th>
              <th>Enregistré par</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-400">Chargement...</td></tr>
            )}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={9} className="text-center py-12 text-slate-400">Aucun encaissement trouvé.</td></tr>
            )}
            {data?.data?.map(enc => (
              <tr key={enc.id} className={enc.status === 'annule' ? 'opacity-50' : ''}>
                <td className="font-mono text-xs font-medium text-slate-700">{enc.reference}</td>
                <td className="font-medium text-slate-800">
                  {enc.client?.raison_sociale ?? enc.client?.nom ?? '—'}
                </td>
                <td className="font-mono text-xs text-slate-500">{enc.invoice?.number ?? '—'}</td>
                <td className="font-semibold text-slate-800">{fmt(enc.amount)}</td>
                <td className="text-slate-600 text-xs capitalize">{enc.payment_method?.replace('_', ' ')}</td>
                <td className="text-slate-500 text-xs">{fmtDate(enc.payment_date)}</td>
                <td className="text-slate-500 text-xs">{enc.creator?.name ?? '—'}</td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className={`badge ${enc.status === 'valide' ? 'badge-green' : 'badge-red'}`}>
                      {enc.status}
                    </span>
                    {enc.status === 'valide' && (
                      <span className={`badge text-xs ${enc.is_complete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {enc.is_complete ? '✓ Complet' : '⚠ Incomplet'}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    {enc.status === 'valide' && (
                      <>
                        <button onClick={() => receiptMutation.mutate(enc.id)}
                          title="Envoyer le reçu"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Send size={14}/>
                        </button>
                        <button
                          onClick={() => { if (confirm('Annuler cet encaissement ?')) cancelMutation.mutate(enc.id); }}
                          title="Annuler"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <X size={14}/>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(data?.last_page ?? 1) > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>{data.from}–{data.to} sur {data.total}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50">Précédent</button>
              <span className="px-2 py-1">{page}</span>
              <button onClick={() => setPage(p => p + 1)}
                disabled={!data?.next_page_url}
                className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <EncaissementModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['encaissements']); }}
        />
      )}
    </div>
  );
}
