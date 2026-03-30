import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { clientsApi } from '../services/api';
import { Plus, Search, Filter, Eye, UserX, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import ClientFormModal from '../components/modules/ClientFormModal';

const statusBadge = {
  prospect: 'bg-amber-50 text-amber-700 border-amber-100',
  client:   'bg-green-50 text-green-700 border-green-100',
  inactif:  'bg-slate-100 text-slate-500 border-slate-200',
};

const typeBadge = {
  ordinaire:    'bg-blue-50 text-blue-700',
  grand_compte: 'bg-purple-50 text-purple-700',
};

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter, typeFilter, page],
    queryFn: () => clientsApi.list({ search, status: statusFilter, type: typeFilter, page }).then(r => r.data),
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => clientsApi.suspend(id),
    onSuccess: () => qc.invalidateQueries(['clients']),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => clientsApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries(['clients']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['clients']),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Clients & Prospects</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} entrées</p>
        </div>
        <button onClick={() => { setEditClient(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">Tous les statuts</option>
          <option value="prospect">Prospects</option>
          <option value="client">Clients</option>
          <option value="inactif">Inactifs</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">Tous les types</option>
          <option value="ordinaire">Ordinaires</option>
          <option value="grand_compte">Grands comptes</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Client</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Statut</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Commercial</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Sites</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Chargement...</td></tr>
            )}
            {data?.data?.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-800">{client.display_name ?? `${client.prenom ?? ''} ${client.nom}`}</p>
                  <p className="text-xs text-slate-400">{client.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge[client.type]}`}>
                    {client.type === 'grand_compte' ? 'Grand compte' : 'Ordinaire'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge[client.status]}`}>
                    {client.status}
                  </span>
                  {client.is_suspended && (
                    <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                      suspendu
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{client.commercial?.name ?? '—'}</td>
                <td className="px-5 py-3.5 text-slate-600">{client.sites_count ?? 0}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Link to={`/clients/${client.id}`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Eye size={15} />
                    </Link>
                    <button onClick={() => setInlineEdit(client)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                      <Pencil size={15} />
                    </button>
                    {client.status === 'prospect' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Confirmer la suppression de ce prospect ?')) {
                            deleteMutation.mutate(client.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {client.status === 'client' && !client.is_suspended && (
                      <button onClick={() => suspendMutation.mutate(client.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <AlertTriangle size={15} />
                      </button>
                    )}
                    {client.status === 'client' && (
                      <button onClick={() => deactivateMutation.mutate(client.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                        <UserX size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inlineEdit && (
        <ClientFormModal
          client={inlineEdit}
          onClose={() => setInlineEdit(null)}
          onSuccess={() => { setInlineEdit(null); qc.invalidateQueries(['clients']); }}
        />
      )}

      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span>{data?.from ?? 0}–{data?.to ?? 0} sur {data?.total ?? 0}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50"
          >Précédent</button>
          <span className="px-2 py-1">{page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!data?.next_page_url}
            className="px-2 py-1 border rounded text-slate-500 disabled:opacity-50"
          >Suivant</button>
        </div>
      </div>

      {showForm && (
        <ClientFormModal
          client={editClient}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries(['clients']); }}
        />
      )}
    </div>
  );
}
