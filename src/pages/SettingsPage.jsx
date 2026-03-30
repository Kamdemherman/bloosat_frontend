// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Building2, FileText, Bell, Settings2, Save,
  CheckCircle, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────
const TAB_CONFIG = [
  { key: 'entreprise',    label: 'Entreprise',     icon: Building2  },
  { key: 'facturation',   label: 'Facturation',    icon: FileText   },
  { key: 'notifications', label: 'Notifications',  icon: Bell       },
  { key: 'systeme',       label: 'Système & API',  icon: Settings2  },
];

const GROUP_LABELS = {
  entreprise:    'Informations de la société',
  facturation:   'Paramètres de facturation',
  
  notifications: 'Notifications automatiques',
  systeme:       'Système et intégrations API',
};

// ─── individual setting field ─────────────────────────────────
function SettingField({ setting, value, onChange }) {
  const [showKey, setShowKey] = useState(false);
  const isApiKey = setting.key.includes('_key') || setting.key.includes('_secret');

  if (setting.type === 'boolean') {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div>
          <p className="text-sm font-medium text-slate-700">{setting.label}</p>
          <p className="text-xs text-slate-400">{setting.key}</p>
        </div>
        <button
          onClick={() => onChange(value === '1' ? '0' : '1')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value === '1' ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value === '1' ? 'translate-x-6' : 'translate-x-1'
          }`}/>
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="form-label">{setting.label}</label>
      <p className="text-xs text-slate-400 mb-1">{setting.key}</p>
      {isApiKey ? (
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="form-input pr-10 font-mono text-sm"
            placeholder="Entrez la clé API..."
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
      ) : (
        <input
          type={setting.type === 'number' ? 'number' : setting.type === 'email' ? 'email' : 'text'}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="form-input"
          placeholder={setting.label}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('entreprise');
  const [saved, setSaved]         = useState(false);
  const [localValues, setLocalValues] = useState({});
  const [logoFile, setLogoFile]   = useState(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => api.get('/settings').then(r => r.data),
    onSuccess: (data) => {
      // Flatten all settings into localValues
      const flat = {};
      Object.values(data).forEach(group => {
        group.forEach(s => { flat[s.key] = s.value ?? ''; });
      });
      setLocalValues(flat);
    },
  });

  // Also initialize from successful fetch
  const allSettings = settingsData
    ? Object.values(settingsData).flat()
    : [];

  // Build flat values when data arrives
  const values = Object.keys(localValues).length > 0
    ? localValues
    : Object.fromEntries(allSettings.map(s => [s.key, s.value ?? '']));

  const setVal = (key, val) => setLocalValues(v => ({ ...v, [key]: val }));

  const saveMutation = useMutation({
    mutationFn: () => api.put('/settings', {
      settings: Object.entries(values).map(([key, value]) => ({ key, value })),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['settings']);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const logoMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('logo', logoFile);
      return api.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { setLogoFile(null); qc.invalidateQueries(['settings']); },
  });

  const currentGroupSettings = settingsData?.[activeTab] ?? [];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Paramètres</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configuration de l'application BSS</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved
            ? <><CheckCircle size={15}/> Enregistré !</>
            : <><Save size={15}/> {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer tout'}</>
          }
        </button>
      </div>

      <div className="flex gap-5">
        {/* Left nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TAB_CONFIG.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} className="flex-shrink-0"/>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-1">{GROUP_LABELS[activeTab]}</h2>
            <p className="text-xs text-slate-400 mb-5 pb-4 border-b border-slate-100">
              Les modifications sont appliquées après avoir cliqué sur « Enregistrer tout ».
            </p>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Logo upload — only show in entreprise tab */}
                {activeTab === 'entreprise' && (
                  <div className="pb-5 border-b border-slate-100">
                    <label className="form-label">Logo de la société</label>
                    <p className="text-xs text-slate-400 mb-2">Format JPG, PNG ou SVG — max 2 Mo</p>
                    <div className="flex items-center gap-4">
                      {values['company_logo'] && (
                        <img src={values['company_logo']} alt="Logo" className="h-12 object-contain border border-slate-200 rounded-lg p-1"/>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                        {logoFile ? logoFile.name : 'Choisir un fichier'}
                        <input type="file" accept=".jpg,.jpeg,.png,.svg" className="hidden"
                          onChange={e => setLogoFile(e.target.files[0] || null)}/>
                      </label>
                      {logoFile && (
                        <button
                          onClick={() => logoMutation.mutate()}
                          disabled={logoMutation.isPending}
                          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          {logoMutation.isPending ? 'Upload...' : 'Uploader'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Boolean settings group */}
                {activeTab === 'notifications' ? (
                  <div className="divide-y divide-slate-100">
                    {currentGroupSettings.map(s => (
                      <SettingField
                        key={s.key}
                        setting={s}
                        value={values[s.key] ?? s.value ?? ''}
                        onChange={v => setVal(s.key, v)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={`grid gap-4 ${activeTab === 'systeme' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {currentGroupSettings
                      .filter(s => s.type !== 'file')
                      .map(s => (
                        <SettingField
                          key={s.key}
                          setting={s}
                          value={values[s.key] ?? s.value ?? ''}
                          onChange={v => setVal(s.key, v)}
                        />
                      ))
                    }
                  </div>
                )}

                {/* API test buttons for systeme tab */}
                {activeTab === 'systeme' && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-700 mb-3">Tester les connexions API</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => api.post('/settings/test-kaf').catch(() => {})}
                        className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        Tester API KAF
                      </button>
                      <button
                        onClick={() => api.post('/settings/test-iway').catch(() => {})}
                        className="flex items-center gap-2 text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        Tester API Iway
                      </button>
                    </div>
                  </div>
                )}

                {saveMutation.isError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    <AlertTriangle size={15}/>
                    Erreur lors de l'enregistrement. Vérifiez les données saisies.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
