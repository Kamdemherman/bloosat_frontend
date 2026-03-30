// src/pages/InvoiceDetailPage.jsx
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, clientsApi, productsApi } from '../services/api';
import { ArrowLeft, CheckCircle, Printer, X, Edit3, Save, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';
const TYPE_LABEL = {
  pro_forma: 'Facture Pro-forma',
  definitive: 'Facture Définitive',
  redevance: 'Facture de Redevance',
};
const STATUS_CLS = {
  brouillon: 'badge-slate',
  validee: 'badge-blue',
  verrouillee: 'badge-purple',
  payee: 'badge-green',
  annulee: 'badge-red',
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({ client_id: '', type: 'pro_forma', issue_date: '', due_date: '', notes: '', discount_amount: 0 });
  const [editItems, setEditItems] = useState([]);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id).then(r => r.data),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all-for-invoice'],
    queryFn: () => clientsApi.list({ per_page: 1000 }).then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all-for-invoice'],
    queryFn: () => productsApi.list({ trashed: 0, per_page: 1000 }).then(r => r.data),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['client-sites-for-invoice', editFields.client_id],
    queryFn: () => editFields.client_id ? clientsApi.get(editFields.client_id).then(r => r.data.sites) : Promise.resolve([]),
    enabled: !!editFields.client_id,
  });

  useEffect(() => {
    if (invoice) {
      setEditFields({
        client_id: invoice.client_id || '',
        type: invoice.type || 'pro_forma',
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        notes: invoice.notes || '',
        discount_amount: invoice.discount_amount || 0,
      });

      setEditItems((invoice.items || []).map(item => ({
        id: item.id,
        product_id: item.product_id || '',
        site_id: item.site_id || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        tax_rate: item.tax_rate || 0,
        discount: item.discount || 0,
      })));
    }
  }, [invoice]);

  const validateMutation = useMutation({
    mutationFn: () => invoicesApi.validate(id),
    onSuccess: () => qc.invalidateQueries(['invoice', id]),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => invoicesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['invoice', id]);
      setIsEditing(false);
    },
  });

  const setItemField = (index, key, value) => {
    setEditItems(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: value } : item));
  };

  const addLineItem = () => {
    setEditItems(prev => [...prev, {
      product_id: '', site_id: '', description: '', quantity: 1,
      unit_price: 0, tax_rate: 19.25, discount: 0,
    }]);
  };

  const removeLineItem = (index) => {
    setEditItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const calcSubtotal = () => {
    return editItems.reduce((sum, item) => {
      const base = (item.quantity || 0) * (item.unit_price || 0);
      const discounted = base - (base * ((item.discount || 0) / 100));
      return sum + discounted;
    }, 0);
  };

  const calcTax = () => {
    return editItems.reduce((sum, item) => {
      const base = (item.quantity || 0) * (item.unit_price || 0);
      const discounted = base - (base * ((item.discount || 0) / 100));
      return sum + discounted * ((item.tax_rate || 0) / 100);
    }, 0);
  };

  const calcTotal = () => calcSubtotal() + calcTax() - (parseFloat(editFields.discount_amount || 0) || 0);

  // Print only the invoice, hiding the rest of the page including sidebar
  const handlePrint = () => {
    const printStyle = document.createElement('style');
    printStyle.id = '__inv_print';
    printStyle.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #inv-printable, #inv-printable * { visibility: visible !important; }
        #inv-printable { position: fixed !important; left: 0 !important; top: 0 !important;
          width: 100% !important; background: white !important; padding: 20px !important;
          border: 2px solid #000 !important; margin: 0 !important; }
        .badge { display: none !important; }
        table { font-size: 12px !important; }
        .text-xs { font-size: 10px !important; }
        .text-sm { font-size: 11px !important; }
        .text-lg { font-size: 14px !important; }
        .text-2xl { font-size: 18px !important; }
        .text-3xl { font-size: 24px !important; }
      }
    `;
    document.head.appendChild(printStyle);
    window.print();
    setTimeout(() => document.getElementById('__inv_print')?.remove(), 500);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
    </div>
  );
  if (!invoice) return <div className="text-center py-24 text-slate-400">Facture introuvable.</div>;

  const clientName = invoice.client?.raison_sociale
    ?? `${invoice.client?.prenom ?? ''} ${invoice.client?.nom ?? ''}`.trim();
  const clientAddr = [invoice.client?.adresse, invoice.client?.ville].filter(Boolean).join(', ');

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + actions */}
      <div>
        <Link to="/invoices" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={15}/> Retour aux factures
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{TYPE_LABEL[invoice.type]}</h1>
            <p className="text-sm text-slate-500 font-mono mt-0.5">{invoice.number}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {invoice.status === 'brouillon' && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm px-4 py-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50"
              >
                <Edit3 size={15}/> Modifier
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => updateMutation.mutate({ ...editFields, items: editItems })}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Save size={15}/> {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (invoice) {
                      setEditFields({
                        client_id: invoice.client_id || '',
                        type: invoice.type || 'pro_forma',
                        issue_date: invoice.issue_date || '',
                        due_date: invoice.due_date || '',
                        notes: invoice.notes || '',
                        discount_amount: invoice.discount_amount || 0,
                      });
                      setEditItems((invoice.items || []).map(item => ({
                        id: item.id,
                        product_id: item.product_id || '',
                        site_id: item.site_id || '',
                        description: item.description || '',
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        tax_rate: item.tax_rate || 0,
                        discount: item.discount || 0,
                      })));
                    }
                  }}
                  className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  Annuler
                </button>
              </>
            )}
            {invoice.status === 'brouillon' && (
              <button onClick={() => validateMutation.mutate()} className="btn-primary" disabled={validateMutation.isPending}>
                <CheckCircle size={15}/> {validateMutation.isPending ? 'Validation...' : 'Valider'}
              </button>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              <Printer size={15}/> Télécharger / Imprimer
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="card p-5 bg-slate-50 border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Édition de la facture</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="md:col-span-2">
              <label className="form-label">Client</label>
              <select value={editFields.client_id} onChange={e => setEditFields(f => ({ ...f, client_id: e.target.value }))} className="form-input">
                <option value="">Sélectionner un client</option>
                {(clientsData?.data ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.raison_sociale ?? `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select value={editFields.type} onChange={e => setEditFields(f => ({ ...f, type: e.target.value }))} className="form-input">
                <option value="pro_forma">Pro-forma</option>
                <option value="definitive">Définitive</option>
                <option value="redevance">Redevance</option>
              </select>
            </div>
            <div>
              <label className="form-label">Remise globale</label>
              <input type="number" min="0" value={editFields.discount_amount} onChange={e => setEditFields(f => ({ ...f, discount_amount: e.target.value }))} className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="form-label">Date d'émission</label>
              <input type="date" value={editFields.issue_date} onChange={e => setEditFields(f => ({ ...f, issue_date: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Date d'échéance</label>
              <input type="date" value={editFields.due_date} onChange={e => setEditFields(f => ({ ...f, due_date: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input type="text" value={editFields.notes} onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))} className="form-input" />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium text-slate-700">Lignes de facture</h3>
            <button onClick={addLineItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Plus size={13}/> Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs"> 
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-2">Produit</th>
                  <th className="px-2 py-2">Désignation</th>
                  <th className="px-2 py-2">Site</th>
                  <th className="px-2 py-2">Qté</th>
                  <th className="px-2 py-2">PU</th>
                  <th className="px-2 py-2">Rem.</th>
                  <th className="px-2 py-2">TVA</th>
                  <th className="px-2 py-2">Sous-total</th>
                  <th className="px-2 py-2"/> 
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, idx) => {
                  const base = (item.quantity || 0) * (item.unit_price || 0);
                  const discounted = base - (base * ((item.discount || 0) / 100));
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="px-2 py-2">
                        <select value={item.product_id} onChange={e => {
                          const selected = productsData?.data?.find(p => p.id === Number(e.target.value));
                          setItemField(idx, 'product_id', e.target.value);
                          if (selected) {
                            setItemField(idx, 'description', selected.name);
                            setItemField(idx, 'unit_price', selected.price);
                            setItemField(idx, 'tax_rate', selected.tax_rate);
                          }
                        }} className="form-input text-xs">
                          <option value="">Choisir</option>
                          {(productsData?.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2"><input type="text" value={item.description} onChange={e => setItemField(idx, 'description', e.target.value)} className="form-input text-xs" /></td>
                      <td className="px-2 py-2">
                        <select value={item.site_id || ''} onChange={e => setItemField(idx, 'site_id', e.target.value)} className="form-input text-xs">
                          <option value="">--</option>
                          {(sitesData || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2"><input type="number" value={item.quantity} onChange={e => setItemField(idx, 'quantity', Number(e.target.value))} className="form-input text-xs" min="0.01" step="0.01" /></td>
                      <td className="px-2 py-2"><input type="number" value={item.unit_price} onChange={e => setItemField(idx, 'unit_price', Number(e.target.value))} className="form-input text-xs" min="0" step="0.01" /></td>
                      <td className="px-2 py-2"><input type="number" value={item.discount} onChange={e => setItemField(idx, 'discount', Number(e.target.value))} className="form-input text-xs" min="0" max="100" /></td>
                      <td className="px-2 py-2"><input type="number" value={item.tax_rate} onChange={e => setItemField(idx, 'tax_rate', Number(e.target.value))} className="form-input text-xs" min="0" max="100" step="0.01" /></td>
                      <td className="px-2 py-2">{new Intl.NumberFormat('fr-FR').format(Math.round(discounted))}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-red-700 text-xs">
                          <Trash2 size={12}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-4 text-sm font-semibold">
            <div>Sous-total: {new Intl.NumberFormat('fr-FR').format(Math.round(calcSubtotal()))} FCFA</div>
            <div>Taxe: {new Intl.NumberFormat('fr-FR').format(Math.round(calcTax()))} FCFA</div>
            <div>Total: {new Intl.NumberFormat('fr-FR').format(Math.round(calcTotal()))} FCFA</div>
          </div>
        </div>
      )}

      {/* Invoice document */}
      <div id="inv-printable" className="card p-8 bg-white border-2 border-slate-300">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-300 pb-4">
          <div className="flex items-center gap-4">
            <a href="/"><img src="https://bloosat.com/bloosat-img/blue-logo.png" alt="BLOOSAT" className="h-12" /></a>
            {/* <div className="text-3xl font-extrabold text-blue-700 tracking-tight">BLOOSAT</div> */}
             {/* <div className="text-sm text-slate-500">
              <div>Business Support System</div>
              <div>Douala, Cameroun</div>
              <div>contact@bloosat.com</div>
            </div> */}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800 mb-2">{TYPE_LABEL[invoice.type]}</div>
            <div className="text-lg font-mono text-slate-700 mb-1">N° {invoice.number}</div>
            <div className="text-sm text-slate-600">Date d'émission: {fmtDate(invoice.issue_date)}</div>
            {invoice.due_date && <div className="text-sm text-slate-600">Date d'échéance: {fmtDate(invoice.due_date)}</div>}
            <div className="mt-2"><span className={`badge ${STATUS_CLS[invoice.status]}`}>{invoice.status?.toUpperCase()}</span></div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-slate-300 p-4 rounded">
            <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">ÉMETTEUR</h3>
            <div className="text-sm">
              <div className="font-semibold">BLOOSAT SA</div>
              <div>Douala, Cameroun</div>
              <div>Tél: +237 XXX XXX XXX</div>
              <div>Email: contact@bloosat.com</div>
              <div>NINEA: XXX XXX XXX X</div>
            </div>
          </div>
          <div className="border border-slate-300 p-4 rounded">
            <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">CLIENT</h3>
            <div className="text-sm">
              <div className="font-semibold">{clientName}</div>
              {clientAddr && <div>{clientAddr}</div>}
              {invoice.client?.telephone && <div>Tél: {invoice.client.telephone}</div>}
              {invoice.client?.email && <div>Email: {invoice.client.email}</div>}
              {invoice.client?.ninea && <div>NINEA: {invoice.client.ninea}</div>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-300 pb-1">DÉTAIL DES PRESTATIONS</h3>
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-sm">Désignation</th>
                <th className="border border-slate-300 px-3 py-2 text-center font-semibold text-sm">Qté</th>
                <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-sm">Prix Unit.</th>
                <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-sm">Remise</th>
                <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-sm">TVA</th>
                <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-sm">Montant HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, i) => (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 px-3 py-2 text-sm">
                    <div className="font-medium">{item.description}</div>
                    {item.site && <div className="text-xs text-slate-500">Site: {item.site.name}</div>}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-sm">{fmt(item.unit_price)}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-sm">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-sm">{item.tax_rate}%</td>
                  <td className="border border-slate-300 px-3 py-2 text-right text-sm font-medium">{fmt(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-80 border border-slate-300 rounded p-4 bg-slate-50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total HT:</span>
                <span className="font-medium">{fmt(invoice.subtotal)}</span>
              </div>
              {parseFloat(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remise globale:</span>
                  <span>- {fmt(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>TVA:</span>
                <span className="font-medium">{fmt(invoice.tax_amount)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold text-blue-700">
                  <span>TOTAL TTC:</span>
                  <span>{fmt(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-semibold text-yellow-800 mb-1">Notes:</h4>
            <p className="text-sm text-yellow-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-slate-300 pt-4 mt-8 text-center text-xs text-slate-500">
          <div className="mb-2">
            <strong>BLOOSAT SA</strong> - Business Support System
          </div>
          <div>
            Document généré le {new Date().toLocaleDateString('fr-FR')} - Merci pour votre confiance
          </div>
        </div>
      </div>

      {/* Encaissements linked */}
      {(invoice.encaissements?.length ?? 0) > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Paiements enregistrés</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>Référence</th><th>Date</th><th>Méthode</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {invoice.encaissements.map(enc => (
                <tr key={enc.id}>
                  <td className="font-mono text-xs">{enc.reference}</td>
                  <td className="text-slate-500 text-xs">{fmtDate(enc.payment_date)}</td>
                  <td className="text-slate-600 capitalize text-xs">{enc.payment_method?.replace('_',' ')}</td>
                  <td className="font-semibold text-slate-800">{fmt(enc.amount)}</td>
                  <td><span className={`badge ${enc.status === 'valide' ? 'badge-green' : 'badge-red'}`}>{enc.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
