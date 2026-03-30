// src/pages/InvoiceCreatePage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invoicesApi, clientsApi, productsApi } from '../services/api';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const emptyItem = {
  product_id: '', site_id: '', description: '',
  quantity: 1, unit_price: 0, tax_rate: 19.25, discount: 0,
};

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    client_id: '', type: 'pro_forma',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '', notes: '', discount_amount: 0,
    items: [{ ...emptyItem }],
  });
  const [errors, setErrors] = useState({});

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clientsApi.list({ status: 'client' }).then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => productsApi.list({ trashed: 0 }).then(r => r.data),
  });

  const selectedClient = clientsData?.data?.find(c => c.id === parseInt(form.client_id));

  const { data: sitesData } = useQuery({
    queryKey: ['client-sites', form.client_id],
    queryFn: () => form.client_id
      ? clientsApi.get(form.client_id).then(r => r.data.sites)
      : Promise.resolve([]),
    enabled: !!form.client_id,
  });

  const createMutation = useMutation({
    mutationFn: invoicesApi.create,
    onSuccess: (res) => navigate(`/invoices/${res.data.id}`),
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (idx, k, v) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [k]: v };

    // Auto-fill price/description when product selected
    if (k === 'product_id') {
      const product = productsData?.data?.find(p => p.id === parseInt(v));
      if (product) {
        items[idx].description = product.name;
        items[idx].unit_price  = product.price;
        items[idx].tax_rate    = product.tax_rate;
      }
    }
    setForm(f => ({ ...f, items }));
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  // Computed totals
  const subtotal = form.items.reduce((acc, item) => {
    const base = (item.quantity ?? 0) * (item.unit_price ?? 0);
    return acc + base - (base * (item.discount ?? 0) / 100);
  }, 0);
  const taxTotal = form.items.reduce((acc, item) => {
    const base = (item.quantity ?? 0) * (item.unit_price ?? 0);
    const afterDisc = base - (base * (item.discount ?? 0) / 100);
    return acc + afterDisc * ((item.tax_rate ?? 0) / 100);
  }, 0);
  const total = subtotal + taxTotal - (parseFloat(form.discount_amount) || 0);

  const fmt = n => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

  // Filter products: for redevance only show renewable services
  const filteredProducts = productsData?.data?.filter(p => {
    if (form.type === 'redevance') return p.type === 'renouvelable';
    return true;
  }) ?? [];

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <Link to="/invoices" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 w-fit">
          <ArrowLeft size={15}/> Retour
        </Link>
        <h1 className="text-xl font-semibold text-slate-800">Nouvelle facture</h1>
      </div>

      {/* Header fields */}
      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="form-label">Type de facture *</label>
            <select value={form.type} onChange={e => setField('type', e.target.value)} className="form-input">
              <option value="pro_forma">Pro-forma</option>
              <option value="definitive">Définitive</option>
              <option value="redevance">Redevance</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date d'émission *</label>
            <input type="date" value={form.issue_date} onChange={e => setField('issue_date', e.target.value)} className="form-input"/>
          </div>
          <div>
            <label className="form-label">Date d'échéance</label>
            <input type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)} className="form-input"/>
          </div>
        </div>

        <div>
          <label className="form-label">Client *</label>
          <select value={form.client_id} onChange={e => setField('client_id', e.target.value)} className="form-input">
            <option value="">Sélectionner un client</option>
            {clientsData?.data?.map(c => (
              <option key={c.id} value={c.id}>
                {c.raison_sociale ?? `${c.prenom ?? ''} ${c.nom}`} — {c.type === 'grand_compte' ? 'Grand compte' : 'Ordinaire'}
              </option>
            ))}
          </select>
          {errors.client_id && <p className="text-xs text-red-500 mt-1">{errors.client_id[0]}</p>}
        </div>

        {selectedClient?.type === 'grand_compte' && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 text-sm text-purple-700">
            ℹ️ Client grand compte — tous les sites doivent apparaître sur cette facture.
          </div>
        )}

        <div>
          <label className="form-label">Notes</label>
          <textarea value={form.notes} onChange={e => setField('notes', e.target.value)}
            rows={2} className="form-input resize-none" placeholder="Conditions de paiement, remarques..." />
        </div>
      </div>

      {/* Line items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Lignes de facture</h2>
          <button onClick={addItem} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
            <Plus size={15}/> Ajouter une ligne
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-48">Produit</th>
                <th className="text-left px-4 py-3">Désignation</th>
                {selectedClient?.type === 'grand_compte' && <th className="text-left px-4 py-3 w-36">Site</th>}
                <th className="text-right px-4 py-3 w-20">Qté</th>
                <th className="text-right px-4 py-3 w-32">PU HT</th>
                <th className="text-right px-4 py-3 w-20">Rem. %</th>
                <th className="text-right px-4 py-3 w-20">TVA %</th>
                <th className="text-right px-4 py-3 w-32">Sous-total</th>
                <th className="w-8 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {form.items.map((item, idx) => {
                const base = (item.quantity || 0) * (item.unit_price || 0);
                const itemSubtotal = base - (base * (item.discount || 0) / 100);
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <select value={item.product_id} onChange={e => setItem(idx, 'product_id', e.target.value)} className="form-input text-xs">
                        <option value="">Choisir...</option>
                        {filteredProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input value={item.description} onChange={e => setItem(idx, 'description', e.target.value)}
                        className="form-input text-xs" placeholder="Description..." />
                    </td>
                    {selectedClient?.type === 'grand_compte' && (
                      <td className="px-4 py-2">
                        <select value={item.site_id ?? ''} onChange={e => setItem(idx, 'site_id', e.target.value)} className="form-input text-xs">
                          <option value="">— Site —</option>
                          {sitesData?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <input type="number" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)}
                        min="0.01" step="0.01" className="form-input text-xs text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.unit_price} onChange={e => setItem(idx, 'unit_price', e.target.value)}
                        min="0" className="form-input text-xs text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.discount} onChange={e => setItem(idx, 'discount', e.target.value)}
                        min="0" max="100" className="form-input text-xs text-right" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={item.tax_rate} onChange={e => setItem(idx, 'tax_rate', e.target.value)}
                        min="0" max="100" className="form-input text-xs text-right" />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-700 text-xs whitespace-nowrap">
                      {fmt(itemSubtotal)}
                    </td>
                    <td className="px-2 py-2">
                      {form.items.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end p-5 border-t border-slate-100">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Sous-total HT</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>TVA totale</span>
              <span className="font-medium">{fmt(taxTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 items-center">
              <span>Remise globale</span>
              <input type="number" value={form.discount_amount}
                onChange={e => setField('discount_amount', e.target.value)}
                min="0" className="w-28 text-right form-input text-sm py-1" />
            </div>
            <div className="flex justify-between text-base font-bold text-slate-800 pt-2 border-t border-slate-200">
              <span>TOTAL TTC</span>
              <span className="text-blue-700">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-6">
        <Link to="/invoices" className="btn-secondary">Annuler</Link>
        <button
          onClick={() => createMutation.mutate({ ...form, items: form.items.filter(i => i.description) })}
          disabled={createMutation.isPending || !form.client_id || form.items.every(i => !i.description)}
          className="btn-primary"
        >
          {createMutation.isPending ? 'Création...' : 'Créer la facture'}
        </button>
      </div>
    </div>
  );
}
