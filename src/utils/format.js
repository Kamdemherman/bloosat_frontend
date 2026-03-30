// src/hooks/useToast.js
import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  }, []);

  return {
    toasts,
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
    remove:  removeToast,
  };
}


// src/utils/format.js
// ── Shared formatting utilities ────────────────────────────────

/**
 * Format a number as CFA Francs
 */
export function formatCFA(amount, decimals = 0) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount) + ' FCFA';
}

/**
 * Format a date in French locale
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...options,
  });
}

/**
 * Format a datetime
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR');
}

/**
 * Get display name for a client
 */
export function clientDisplayName(client) {
  if (!client) return '—';
  if (client.nature === 'morale') return client.raison_sociale ?? client.nom;
  return [client.prenom, client.nom].filter(Boolean).join(' ');
}

/**
 * Invoice status config
 */
export const INVOICE_STATUS = {
  brouillon:   { label: 'Brouillon',    color: 'badge-slate' },
  validee:     { label: 'Validée',      color: 'badge-blue' },
  verrouillee: { label: 'Verrouillée', color: 'badge-purple' },
  payee:       { label: 'Payée',        color: 'badge-green' },
  annulee:     { label: 'Annulée',      color: 'badge-red' },
};

/**
 * Invoice type config
 */
export const INVOICE_TYPES = {
  pro_forma:  { label: 'Pro-forma',   color: 'badge-amber' },
  definitive: { label: 'Définitive', color: 'badge-blue' },
  redevance:  { label: 'Redevance',  color: 'bg-teal-50 text-teal-700' },
};

/**
 * Client status config
 */
export const CLIENT_STATUS = {
  prospect: { label: 'Prospect', color: 'badge-amber' },
  client:   { label: 'Client',   color: 'badge-green' },
  inactif:  { label: 'Inactif',  color: 'badge-slate' },
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
  { value: 'virement',      label: 'Virement bancaire' },
  { value: 'especes',       label: 'Espèces' },
  { value: 'cheque',        label: 'Chèque' },
  { value: 'mobile_money',  label: 'Mobile Money' },
  { value: 'autre',         label: 'Autre' },
];

/**
 * Stock movement types
 */
export const MOVEMENT_TYPES = [
  { value: 'entree',       label: 'Entrée stock' },
  { value: 'sortie',       label: 'Sortie stock' },
  { value: 'transfert',    label: 'Transfert entrepôt' },
  { value: 'installation', label: 'Installation site' },
  { value: 'retour',       label: 'Retour magasin' },
];
