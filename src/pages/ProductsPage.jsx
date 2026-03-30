import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { Plus, Trash2, RotateCcw, Edit, X } from 'lucide-react';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [showTrashed, setShowTrashed] = useState(false);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'produit', type: '', description: '', price: '', tax_rate: '19.25' });

  const { data } = useQuery({
    queryKey: ['products', showTrashed, page],
    queryFn: () => productsApi.list({ trashed: showTrashed ? 1 : 0, page }).then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editProduct
      ? productsApi.update(editProduct.id, data)
      : productsApi.create(data),
    onSuccess: () => { setShowForm(false); setEditProduct(null); qc.invalidateQueries(['products']); },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => qc.invalidateQueries(['products']),
  });

  const restoreMutation = useMutation({
    mutationFn: productsApi.restore,
    onSuccess: () => qc.invalidateQueries(['products']),
  });

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Produits & Services</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} éléments</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showTrashed} onChange={e => setShowTrashed(e.target.checked)} className="rounded" />
            Corbeille
          </label>
          <button onClick={() => { setEditProduct(null); setForm({ name: '', category: 'produit', type: '', description: '', price: '', tax_rate: '19.25' }); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Nom', 'Catégorie', 'Type', 'Prix HT', 'TVA', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data?.data?.map(p => (
              <tr key={p.id} className={`hover:bg-slate-50 ${p.deleted_at ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.category === 'produit' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>
                    {p.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 capitalize">{p.type?.replace('_', ' ') ?? '—'}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{formatAmount(p.price)}</td>
                <td className="px-5 py-3.5 text-slate-500">{p.tax_rate}%</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    {!p.deleted_at && (
                      <button onClick={() => { setEditProduct(p); setForm({ name: p.name, category: p.category, type: p.type ?? '', description: p.description ?? '', price: p.price, tax_rate: p.tax_rate }); setShowForm(true); }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                        <Edit size={14} />
                      </button>
                    )}
                    {!p.deleted_at ? (
                      <button onClick={() => {
                          if (window.confirm('Confirmer la suppression de ce produit ?')) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button onClick={() => restoreMutation.mutate(p.id)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span>{data?.from ?? 0}–{data?.to ?? 0} sur {data?.total ?? 0}</span>
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

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">{editProduct ? "Modifier le produit" : "Nouveau produit / service"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Catégorie *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="produit">Produit / Équipement</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                {form.category === 'service' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                      <option value="">Choisir</option>
                      <option value="renouvelable">Renouvelable (forfait)</option>
                      <option value="non_renouvelable">Non renouvelable</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Prix HT (FCFA) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Taux TVA (%)</label>
                  <input type="number" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
{saveMutation.isPending ? 'Enregistrement...' : editProduct ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
