
// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/StockPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi, productsApi } from '../services/api';
import { Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, X } from 'lucide-react';

const typeConfig = {
  entree:       { label: 'Entrée stock',    icon: ArrowDownCircle, cls: 'text-green-600 bg-green-50' },
  sortie:       { label: 'Sortie stock',    icon: ArrowUpCircle,   cls: 'text-red-600 bg-red-50' },
  transfert:    { label: 'Transfert',       icon: ArrowLeftRight,  cls: 'text-blue-600 bg-blue-50' },
  installation: { label: 'Installation',   icon: ArrowUpCircle,   cls: 'text-amber-600 bg-amber-50' },
  retour:       { label: 'Retour magasin', icon: ArrowDownCircle, cls: 'text-purple-600 bg-purple-50' },
};

export default function StockPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('movements');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    product_id: '', type: 'entree', quantity: '',
    from_warehouse_id: '', to_warehouse_id: '', reason: '',
    movement_date: new Date().toISOString().split('T')[0],
  });

  const { data: movements } = useQuery({
    queryKey: ['stock-movements', page],
    queryFn: () => stockApi.movements({ page }).then(r => r.data),
    enabled: tab === 'movements',
  });

  const { data: levels } = useQuery({
    queryKey: ['stock-levels'],
    queryFn: () => stockApi.levels().then(r => r.data),
    enabled: tab === 'levels',
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => stockApi.warehouses().then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => productsApi.list({ trashed: 0 }).then(r => r.data),
  });

  const addMovement = useMutation({
    mutationFn: stockApi.addMovement,
    onSuccess: () => { setShowForm(false); qc.invalidateQueries(['stock-movements', 'stock-levels']); },
  });

  const deleteMovement = useMutation({
    mutationFn: stockApi.delete,
    onSuccess: () => qc.invalidateQueries(['stock-movements', 'stock-levels']),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Gestion des stocks</h1>
          <p className="text-sm text-slate-500">Mouvements et niveaux par entrepôt</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Mouvement
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[['movements', 'Mouvements'], ['levels', 'Niveaux de stock']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Movements tab */}
      {tab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Type', 'Produit', 'Qté', 'De', 'Vers', 'Date', 'Raison', 'Initiateur', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements?.data?.map(m => {
                const tc = typeConfig[m.type];
                const Icon = tc?.icon;
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full w-fit ${tc?.cls}`}>
                        {Icon && <Icon size={12} />} {tc?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{m.product?.name}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono">{m.quantity}</td>
                    <td className="px-5 py-3.5 text-slate-500">{m.from_warehouse?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{m.to_warehouse?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{new Date(m.movement_date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-40 truncate">{m.reason}</td>
                    <td className="px-5 py-3.5 text-slate-500">{m.creator?.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>{movements?.from ?? 0}–{movements?.to ?? 0} sur {movements?.total ?? 0}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50">Précédent</button>
              <span className="px-2 py-1">{page}</span>
              <button onClick={() => setPage(p => p + 1)}
                disabled={!movements?.next_page_url}
                className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50">Suivant</button>
            </div>
          </div>
        </div>
      )}

      {/* Levels tab */}
      {tab === 'levels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {levels?.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="font-medium text-slate-800">{item.product?.name}</p>
              <p className="text-xs text-slate-400 mb-3">{item.warehouse?.name}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{item.quantity}</p>
                  <p className="text-xs text-slate-400">en stock</p>
                </div>
                {item.quantity <= item.min_quantity && (
                  <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-lg">Stock bas</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add movement modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Nouveau mouvement</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Produit *</label>
                  <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Sélectionner un produit</option>
                    {productsData?.data?.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                    {Object.entries(typeConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Quantité *</label>
                <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none" />
              </div>
              {['sortie', 'transfert', 'installation'].includes(form.type) && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entrepôt source</label>
                  <select value={form.from_warehouse_id} onChange={e => setForm({...form, from_warehouse_id: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Choisir</option>
                    {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
                  </select>
                </div>
              )}
              {['entree', 'transfert', 'retour'].includes(form.type) && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Entrepôt destination</label>
                  <select value={form.to_warehouse_id} onChange={e => setForm({...form, to_warehouse_id: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
                    <option value="">Choisir</option>
                    {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name} — {w.location}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Motif *</label>
                <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
                <input type="date" value={form.movement_date} onChange={e => setForm({...form, movement_date: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => addMovement.mutate(form)} disabled={addMovement.isPending}
                className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                {addMovement.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
