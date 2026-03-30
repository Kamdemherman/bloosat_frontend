// src/components/ui/index.jsx
// — Shared reusable components used across all pages —

import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

// ── Confirm Dialog ─────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-md">
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
              <AlertTriangle size={18} className={danger ? 'text-red-500' : 'text-amber-500'} />
            </div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Notification ─────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: { icon: CheckCircle, cls: 'bg-green-50 border-green-200 text-green-800' },
    error:   { icon: XCircle,    cls: 'bg-red-50 border-red-200 text-red-800' },
    info:    { icon: Info,       cls: 'bg-blue-50 border-blue-200 text-blue-800' },
    warning: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  };
  const { icon: Icon, cls } = styles[type];

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${cls} animate-in slide-in-from-right`}>
      <Icon size={16} />
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={`${sizes[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-2xl">📭</span>
      </div>
      <h3 className="font-medium text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        {meta.from}–{meta.to} sur {meta.total} résultats
      </p>
      <div className="flex gap-1">
        {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 text-xs rounded-md transition-colors ${
              page === meta.current_page
                ? 'bg-blue-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{title}</p>
        <p className="text-2xl font-semibold text-slate-800 truncate">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────
import { Search } from 'lucide-react';
export function SearchInput({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div className="relative flex-1 min-w-48">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-9"
      />
    </div>
  );
}

// ── Select Filter ─────────────────────────────────────────────
export function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600"
    >
      <option value="">{placeholder}</option>
      {options.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
