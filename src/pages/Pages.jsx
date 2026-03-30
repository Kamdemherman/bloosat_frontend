// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/DashboardPage.jsx
// ═══════════════════════════════════════════════════════════════
import { useQuery } from '@tanstack/react-query';
import api, { encaissementsApi } from '../services/api';
import { Users, FileText, Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    red:    'bg-red-50 text-red-600 border-red-100',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: daily } = useQuery({
    queryKey: ['daily-total'],
    queryFn: () => encaissementsApi.dailyTotal().then(r => r.data),
    refetchInterval: 30_000,
  });

  const formatAmount = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(n ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble du BSS BLOOSAT</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total clients" value={stats?.clients_total ?? '—'} subtitle={`${stats?.clients_actifs ?? 0} actifs`} icon={Users} color="blue" />
        <StatCard title="Encaissements du jour" value={formatAmount(daily?.total)} subtitle={new Date().toLocaleDateString('fr-FR')} icon={Wallet} color="green" />
        <StatCard title="Factures en attente" value={stats?.invoices_pending ?? '—'} subtitle="Non validées" icon={FileText} color="amber" />
        <StatCard title="Clients suspendus" value={stats?.clients_suspendus ?? '—'} subtitle="Non payés" icon={AlertTriangle} color="red" />
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-medium text-slate-700">Factures récentes</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {stats?.recent_invoices?.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700">{inv.number}</p>
                <p className="text-xs text-slate-400">{inv.client?.nom}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{formatAmount(inv.total)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  inv.status === 'payee'      ? 'bg-green-50 text-green-700' :
                  inv.status === 'verrouillee' ? 'bg-blue-50 text-blue-700' :
                  inv.status === 'annulee'    ? 'bg-red-50 text-red-700' :
                                                'bg-amber-50 text-amber-700'
                }`}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



