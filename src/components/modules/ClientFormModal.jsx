// src/components/modules/ClientFormModal.jsx
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { clientsApi, usersApi } from '../../services/api';
import { X } from 'lucide-react';

const defaultForm = {
  nom: '', prenom: '', raison_sociale: '',
  nature: 'physique', type: 'ordinaire',
  email: '', telephone: '', adresse: '', ville: '', pays: 'Cameroun',
  ninea: '', rccm: '',
  commercial_id: '', commercial_email: '',
  notes: '',
};

export default function ClientFormModal({ client, onClose, onSuccess }) {
  const [form, setForm] = useState(client ? { ...client } : { ...defaultForm });
  const [errors, setErrors] = useState({});

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const commercials = users?.filter(u => u.role?.name === 'commercial') ?? [];

  const mutation = useMutation({
    mutationFn: client
      ? (data) => clientsApi.update(client.id, data)
      : (data) => clientsApi.create(data),
    onSuccess,
    onError: (err) => setErrors(err.response?.data?.errors ?? {}),
  });

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));

    // Auto-fill commercial email when commercial selected
    if (field === 'commercial_id') {
      const commercial = commercials.find(u => u.id === parseInt(value));
      if (commercial) setForm(f => ({ ...f, commercial_id: value, commercial_email: commercial.email }));
    }
  };

  const Field = ({ label, name, type = 'text', required, children }) => (
    <div>
      <label className="form-label">{label}{required && ' *'}</label>
      {children ?? (
        <input
          type={type} value={form[name] ?? ''}
          onChange={e => set(name, e.target.value)}
          className={`form-input ${errors[name] ? 'border-red-300 focus:ring-red-500/20' : ''}`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name][0]}</p>}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="modal-header">
          <h2 className="font-semibold text-slate-800">
            {client ? 'Modifier le client' : 'Nouveau client / prospect'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Nature & Type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nature" name="nature">
              <select value={form.nature} onChange={e => set('nature', e.target.value)} className="form-input">
                <option value="physique">Personne physique</option>
                <option value="morale">Personne morale</option>
              </select>
            </Field>
            <Field label="Type de client" name="type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className="form-input">
                <option value="ordinaire">Ordinaire (Prepaid)</option>
                <option value="grand_compte">Grand compte (Postpaid)</option>
              </select>
            </Field>
          </div>

          {/* Name fields */}
          {form.nature === 'morale' ? (
            <Field label="Raison sociale" name="raison_sociale" required />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" name="prenom" required />
              <Field label="Nom" name="nom" required />
            </div>
          )}
          {form.nature === 'morale' && (
            <Field label="Représentant (Nom)" name="nom" required />
          )}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" name="email" type="email" />
            <Field label="Téléphone" name="telephone" />
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville" name="ville" />
            <Field label="Pays" name="pays" />
          </div>
          <Field label="Adresse" name="adresse" />

          {/* Legal (morale only) */}
          {form.nature === 'morale' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="NINEA / Numéro fiscal" name="ninea" />
              <Field label="RCCM" name="rccm" />
            </div>
          )}

          {/* Commercial */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Commercial en charge</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Commercial" name="commercial_id">
                <select value={form.commercial_id ?? ''} onChange={e => set('commercial_id', e.target.value)} className="form-input">
                  <option value="">Sélectionner</option>
                  {commercials.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Email du commercial *" name="commercial_email" type="email" required />
            </div>
          </div>

          {/* Notes */}
          <Field label="Notes internes" name="notes">
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="form-input resize-none"
            />
          </Field>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Enregistrement...' : (client ? 'Mettre à jour' : 'Créer')}
          </button>
        </div>
      </div>
    </div>
  );
}
