import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { invoicesApi } from '../services/api';
import { Plus, Eye, Lock, Unlock, CheckCircle, X, Pencil } from 'lucide-react';

const statusConfig = {
  brouillon:   { label: 'Brouillon',    cls: 'bg-slate-100 text-slate-600' },
  validee:     { label: 'Validée',      cls: 'bg-blue-50 text-blue-700' },
  verrouillee: { label: 'Verrouillée', cls: 'bg-purple-50 text-purple-700' },
  payee:       { label: 'Payée',        cls: 'bg-green-50 text-green-700' },
  annulee:     { label: 'Annulée',      cls: 'bg-red-50 text-red-600' },
};

const typeConfig = {
  pro_forma:  { label: 'Pro-forma',   cls: 'bg-amber-50 text-amber-700' },
  definitive: { label: 'Définitive', cls: 'bg-blue-50 text-blue-700' },
  redevance:  { label: 'Redevance',  cls: 'bg-teal-50 text-teal-700' },
};

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', type, status, search, page],
    queryFn: () => invoicesApi.list({ type, status, search, page }).then(r => r.data),
  });

  const validateMutation = useMutation({
    mutationFn: (id) => invoicesApi.validate(id),
    onSuccess: () => qc.invalidateQueries(['invoices']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => invoicesApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['invoices']),
  });

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Facturation</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} factures</p>
        </div>
        <Link to="/invoices/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nouvelle facture
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par numéro..."
            className="w-full pl-4 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select value={type} onChange={e => setType(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
          <option value="">Tous les types</option>
          <option value="pro_forma">Pro-forma</option>
          <option value="definitive">Définitive</option>
          <option value="redevance">Redevance</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="validee">Validée</option>
          <option value="verrouillee">Verrouillée</option>
          <option value="payee">Payée</option>
          <option value="annulee">Annulée</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Numéro', 'Client', 'Type', 'Montant', 'Date', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data?.data?.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-700">{inv.number}</td>
                <td className="px-5 py-3.5 text-slate-800">{inv.client?.nom}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig[inv.type]?.cls}`}>
                    {typeConfig[inv.type]?.label}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{formatAmount(inv.total)}</td>
                <td className="px-5 py-3.5 text-slate-500">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[inv.status]?.cls}`}>
                    {statusConfig[inv.status]?.label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Link to={`/invoices/${inv.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Voir / Modifier">
                      <Eye size={14} />
                    </Link>
                    {inv.status === 'brouillon' && (
                      <button onClick={() => validateMutation.mutate(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Confirmer l\'annulation de cette facture ?')) {
                          deleteMutation.mutate(inv.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Annuler facture"
                    >
                      <X size={14} />
                    </button>
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

    </div>
  );
}
