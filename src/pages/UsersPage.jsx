// src/pages/UsersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api';
import api from '../services/api';
import { Plus, Edit, X, UserX } from 'lucide-react';
import { PageHeader } from '../components/ui/index.jsx';

const defaultForm = {
  name: '', email: '', password: '', password_confirmation: '',
  role_id: '', phone: '', is_active: true,
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [formErrors, setFormErrors] = useState({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editUser
      ? usersApi.update(editUser.id, data)
      : usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['users']);
      setShowForm(false);
      setEditUser(null);
      setForm({ ...defaultForm });
    },
    onError: (err) => setFormErrors(err.response?.data?.errors ?? {}),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries(['users']),
  });

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ ...user, password: '', password_confirmation: '' });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...defaultForm });
    setFormErrors({});
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle={`${users?.length ?? 0} comptes`}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Nouvel utilisateur
          </button>
        }
      />

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Téléphone</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-12 text-slate-400">Chargement...</td></tr>
            )}
            {users?.map(user => (
              <tr key={user.id}>
                <td>
                  <p className="font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </td>
                <td>
                  <span className="badge badge-blue">{user.role?.display_name ?? '—'}</span>
                </td>
                <td className="text-slate-500">{user.phone ?? '—'}</td>
                <td>
                  <span className={`badge ${user.is_active ? 'badge-green' : 'badge-slate'}`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => {
                      if (window.confirm('Confirmer la suppression de cet utilisateur ?')) {
                        deactivateMutation.mutate(user.id);
                      }
                    }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <UserX size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box max-w-lg">
            <div className="modal-header">
              <h2 className="font-semibold text-slate-800">
                {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div>
                <label className="form-label">Nom complet *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name[0]}</p>}
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email[0]}</p>}
              </div>
              <div>
                <label className="form-label">Rôle *</label>
                <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} className="form-input">
                  <option value="">Sélectionner un rôle</option>
                  {roles?.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                </select>
                {formErrors.role_id && <p className="text-xs text-red-500 mt-1">{formErrors.role_id[0]}</p>}
              </div>
              <div>
                <label className="form-label">Téléphone</label>
                <input value={form.phone ?? ''} onChange={e => setForm({...form, phone: e.target.value})} className="form-input" />
              </div>
              <div>
                <label className="form-label">{editUser ? 'Nouveau mot de passe' : 'Mot de passe *'}</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-input" placeholder="Min 8 car., maj, min, chiffre, spécial" />
                {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password[0]}</p>}
              </div>
              <div>
                <label className="form-label">Confirmer le mot de passe</label>
                <input type="password" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} className="form-input" />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
              <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="btn-primary">
                {saveMutation.isPending ? 'Enregistrement...' : (editUser ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
