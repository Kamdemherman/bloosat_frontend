// src/pages/LogsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../services/api';
import { SearchInput, SelectFilter, PageHeader } from '../components/ui/index.jsx';

const actionColors = {
  created:  'bg-green-50 text-green-700',
  updated:  'bg-blue-50 text-blue-700',
  deleted:  'bg-red-50 text-red-600',
  restored: 'bg-purple-50 text-purple-700',
  validated:'bg-teal-50 text-teal-700',
};

export default function LogsPage() {
  const [search, setSearch]  = useState('');
  const [action, setAction]  = useState('');
  const [date, setDate]      = useState('');
  const [page, setPage]      = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', search, action, date, page],
    queryFn: () => logsApi.list({ search, action, date, page }).then(r => r.data),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Logs système"
        subtitle="Traçabilité complète de toutes les actions"
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une action..." />
        <SelectFilter
          value={action} onChange={setAction}
          placeholder="Toutes les actions"
          options={[
            { value: 'created',   label: 'Création' },
            { value: 'updated',   label: 'Modification' },
            { value: 'deleted',   label: 'Suppression' },
            { value: 'restored',  label: 'Restauration' },
            { value: 'validated', label: 'Validation' },
          ]}
        />
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Modèle</th>
              <th>ID</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Chargement...</td></tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Aucun log trouvé.</td></tr>
            )}
            {data?.data?.map(log => (
              <tr key={log.id}>
                <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </td>
                <td className="text-slate-700 font-medium">{log.user?.name ?? 'Système'}</td>
                <td>
                  <span className={`badge ${actionColors[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="text-slate-600">{log.model_type}</td>
                <td className="text-slate-500 font-mono text-xs">#{log.model_id}</td>
                <td className="text-xs text-slate-400 max-w-xs truncate">
                  {log.new_values ? JSON.stringify(log.new_values).slice(0, 80) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {data.from}–{data.to} sur {data.total} logs
            </p>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.last_page, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-md transition-colors ${
                    p === data.current_page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




