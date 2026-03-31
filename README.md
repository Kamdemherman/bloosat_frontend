# BLOOSAT BSS — Business Support System v3.0

Stack: **React 18 + Vite + Tailwind CSS** (frontend) · **Laravel 11** (backend API) · **MySQL 8** (database)

---

## 📁 Project Structure

```
bss/
├── frontend/               # React SPA
│   └── src/
│       ├── App.jsx         # Router + providers
│       ├── pages/          # All page components
│       ├── components/     # Reusable UI + modules
│       ├── hooks/          # useAuth, custom hooks
│       └── services/       # api.js — all Axios calls
│
└── backend/                # Laravel 11 API
    ├── app/
    │   ├── Models/         # Eloquent models
    │   ├── Http/Controllers/ # API controllers
    │   ├── Jobs/           # Queue jobs (cron tasks)
    │   ├── Mail/           # Mailables
    │   └── Traits/         # Loggable trait
    ├── database/
    │   ├── migrations/     # All table migrations
    │   └── seeders/        # Roles, users, products, clients
    └── routes/api.php      # All API routes
```

---

## 🚀 Installation

### 1. Backend (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Copy environment
cp .env.example .env
php artisan key:generate

# Configure database in .env
DB_DATABASE=bloosat_bss
DB_USERNAME=root
DB_PASSWORD=your_password

# Run migrations + seed
php artisan migrate --seed

# Create storage link (for proof files)
php artisan storage:link

# Start server
php artisan serve --port=8000

# (In a second terminal) Start queue worker
php artisan queue:work

# Setup cron (add to crontab)
# * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Start dev server
npm run dev
```

### 3. Default Login Credentials

| Rôle          | Email                   | Mot de passe    |
|---------------|-------------------------|-----------------|
| Super Admin   | admin@bloosat.com       | Admin@2024!     |
| Commercial    | jean@bloosat.com        | Commercial@1    |
| Comptabilité  | compta@bloosat.com      | Compta@2024!    |
| CRD           | crd@bloosat.com         | Crd@2024!       |

---

## 📦 Frontend Dependencies

```bash
npm install react react-dom react-router-dom
npm install @tanstack/react-query axios
npm install lucide-react
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js:**
```js
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

---

## 📦 Backend Dependencies

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# PDF generation (for invoices)
composer require barryvdh/laravel-dompdf

# (Optional) Excel export
composer require maatwebsite/excel
```

---

## 🗄️ Database Tables

| Table                    | Description                                 |
|--------------------------|---------------------------------------------|
| `roles`                  | Rôles et permissions JSON                   |
| `users`                  | Utilisateurs BSS                            |
| `clients`                | Clients + prospects (soft delete)           |
| `sites`                  | Sites des clients                           |
| `products`               | Produits et services (soft delete)          |
| `client_price_overrides` | Grilles tarifaires personnalisées           |
| `invoices`               | Factures (pro-forma, définitive, redevance) |
| `invoice_items`          | Lignes de facture                           |
| `invoice_unlock_requests`| Demandes de déverrouillage                  |
| `subscriptions`          | Souscriptions mensuelles                    |
| `redevances`             | Factures de redevance mensuelle             |
| `encaissements`          | Paiements reçus (avec preuve obligatoire)   |
| `warehouses`             | Entrepôts                                   |
| `stock_items`            | Niveaux de stock par entrepôt               |
| `stock_movements`        | Mouvements de stock (tracés)                |
| `system_logs`            | Logs de toutes les actions                  |

---

## ⚙️ Business Logic Summary

### Clients
- **Prospects** → peuvent être supprimés (soft delete)
- **Clients** → ne peuvent qu'être désactivés
- Passage prospect → client : automatique lors de la première facture définitive payée
- **Grand compte** : facturation postpaid, une facture englobe tous les sites, suspension manuelle
- **Client ordinaire** : facturation prepaid, suspension automatique par cron si non-paiement

### Facturation
- Pro-forma → validée par comptabilité/DG → Facture définitive → verrouillée automatiquement
- Modification d'une facture verrouillée : demande via BSS, approuvée par DG/comptabilité, chaque action loguée
- Redevances générées automatiquement par le scheduler

### Rappels automatiques (cron)
| Type client   | Délai               | Action                              |
|---------------|---------------------|-------------------------------------|
| Ordinaire     | J-7, J-2            | Mail de relance au client           |
| Ordinaire     | J0 (date d'échéance)| Suspension automatique via API      |
| Grand compte  | J+2, J+7, J+15      | Mail de relance + notif comptabilité|

### Encaissements
- Preuve de paiement **obligatoire** (PDF/image)
- Génération automatique d'un reçu
- Seul statut modifiable : **annulé** (pas de modification de montant)
- Total du jour affiché en temps réel dans le dashboard

### Logs
- Toutes les opérations CRUD loguées automatiquement via le trait `Loggable`
- Accessible uniquement par : Super Admin, DG, Responsable CRD

---

## 🔐 Roles & Permissions

| Module              | super_admin | dg | crd | comptabilite | commercial |
|---------------------|:-----------:|:--:|:---:|:------------:|:----------:|
| Clients             | ✅ | ✅ | ✅ | 👁️ | ✅ |
| Factures            | ✅ | ✅ | 👁️ | ✅ | ✅ créer |
| Valider factures    | ✅ | ✅ | ❌ | ✅ | ❌ |
| Déverrouiller       | ✅ | ✅ | ❌ | ✅ | ❌ |
| Encaissements       | ✅ | ✅ | ❌ | ✅ | ❌ |
| Produits            | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| Stock               | ✅ | 👁️ | ✅ | 👁️ | ❌ |
| Utilisateurs        | ✅ | ❌ | ❌ | ❌ | ❌ |
| Logs système        | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📄 API Endpoints Summary

```
POST   /api/login
POST   /api/logout
GET    /api/me

# Clients
GET    /api/clients
POST   /api/clients
GET    /api/clients/{id}
PUT    /api/clients/{id}
DELETE /api/clients/{id}         # Prospects only
PATCH  /api/clients/{id}/deactivate
PATCH  /api/clients/{id}/suspend
PATCH  /api/clients/{id}/unsuspend

# Invoices
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/{id}
PATCH  /api/invoices/{id}/validate
PATCH  /api/invoices/{id}/unlock-request
PATCH  /api/invoices/{id}/approve-unlock
POST   /api/invoices/{id}/subscription

# Encaissements
GET    /api/encaissements
POST   /api/encaissements          # multipart/form-data (proof required)
PATCH  /api/encaissements/{id}/cancel
POST   /api/encaissements/{id}/send-receipt

# Products
GET    /api/products
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
PATCH  /api/products/{id}/restore

# Stock
GET    /api/stock/movements
POST   /api/stock/movements
GET    /api/stock/levels
GET    /api/stock/warehouses

# Users & Logs
GET    /api/users
POST   /api/users
GET    /api/logs
```

---

*Développé pour BLOOSAT — BSS v3.0*
