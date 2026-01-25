# Merged Frontend - Payroll & Attendance System

This is the unified frontend that merges both the admin-dashboard and Employee_HR_Portal into a single application with role-based routing.

## Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin portal pages & layouts
│   │   ├── employee/        # Employee portal pages & layouts
│   │   ├── auth/            # Authentication pages
│   │   └── shared/           # Shared pages (404, etc.)
│   ├── components/          # Shared UI components
│   ├── context/             # React contexts (AuthContext)
│   ├── routes/             # Routing configuration
│   ├── services/            # API service layer
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── main.tsx             # Entry point
├── public/                  # Static assets
└── package.json
```

## Features

- **Role-based Routing**: Admin (`/admin/*`) and Employee (`/employee/*`) portals
- **Unified Authentication**: Single AuthContext supporting both roles
- **Unified API Service**: Combined API client for all endpoints
- **Shared Components**: Common UI components used by both portals

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy pages and components:
   - See `COPY_INSTRUCTIONS.md` for detailed instructions
   - Copy admin pages from `admin-dashboard/src/pages/` to `frontend/src/app/admin/pages/`
   - Copy employee pages from `Employee_HR_Portal/pages/` to `frontend/src/app/employee/pages/`
   - Copy layouts and components (merge duplicates)

3. Update imports in copied files:
   - Replace relative imports with `@/` alias
   - Update API imports to use `@/services/api`
   - Update auth imports to use `@/context/AuthContext`

4. Run development server:
```bash
npm run dev
```

## Routing

- `/login` - Login page (redirects based on role after login)
- `/admin/*` - Admin portal routes
- `/employee/*` - Employee portal routes
- Protected routes automatically check authentication and role

## API Base URL

The API base URL is automatically detected based on the current hostname:
- Localhost: `http://localhost:3000/api`
- LAN IP: `http://<lan-ip>:3000/api`
- Can be overridden with `VITE_API_BASE_URL` env variable

## Status

✅ Core structure created
✅ Unified types, API service, AuthContext
✅ Routing setup
⏳ Pages and components need to be copied (see COPY_INSTRUCTIONS.md)

## Next Steps

1. Copy all pages from both projects
2. Copy and merge components
3. Copy utility files
4. Copy assets (logos, images)
5. Test routing and authentication
6. Update any remaining imports

