import { useQuery } from '@tanstack/react-query';
import api, { encaissementsApi } from '../services/api';
import { Users, FileText, Wallet, AlertTriangle } from 'lucide-react';
import { StatCard } from '../components/ui/index.jsx';
import { formatCFA, formatDate } from '../utils/format.js';

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble du BSS BLOOSAT</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total clients" value={stats?.clients_total ?? '—'} subtitle={`${stats?.clients_actifs ?? 0} actifs`} icon={Users} color="blue" />
        <StatCard title="Encaissements du jour" value={formatCFA(stats?.encaissements_today)} subtitle={formatDate(new Date())} icon={Wallet} color="green" />
        <StatCard title="Factures en attente" value={stats?.invoices_pending ?? '—'} subtitle="Non validées" icon={FileText} color="amber" />
        <StatCard title="Clients suspendus" value={stats?.clients_suspendus ?? '—'} subtitle="Non payés" icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent invoices */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Factures récentes</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recent_invoices?.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 font-mono">{inv.number}</p>
                  <p className="text-xs text-slate-400">{inv.client?.nom}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatCFA(inv.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full badge ${
                    inv.status === 'payee' ? 'badge-green' :
                    inv.status === 'annulee' ? 'badge-red' : 'badge-amber'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
            {!stats?.recent_invoices?.length && (
              <p className="text-center py-8 text-slate-400 text-sm">Aucune facture récente</p>
            )}
          </div>
        </div>

        {/* Encaissements du mois */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-medium text-slate-700 text-sm">Encaissements récents</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recent_encaissements?.map(enc => (
              <div key={enc.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{enc.client?.nom}</p>
                  <p className="text-xs text-slate-400 font-mono">{enc.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">{formatCFA(enc.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(enc.payment_date)}</p>
                </div>
              </div>
            ))}
            {!stats?.recent_encaissements?.length && (
              <p className="text-center py-8 text-slate-400 text-sm">Aucun encaissement récent</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly total highlight */}
      {stats?.encaissements_month != null && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-sm text-blue-200 mb-1">Total encaissements ce mois</p>
          <p className="text-3xl font-bold">{formatCFA(stats.encaissements_month)}</p>
          <p className="text-xs text-blue-300 mt-1">{stats.subscriptions_active} souscriptions actives · {stats.subscriptions_expiring} expirant dans 7j</p>
        </div>
      )}
    </div>
  );
}
