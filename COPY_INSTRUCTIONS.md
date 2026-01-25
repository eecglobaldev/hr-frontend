# Copy Instructions for Merged Frontend

## Structure Created
- ✅ Core configuration (package.json, vite.config.ts, tsconfig.json)
- ✅ Unified types (src/types/index.ts)
- ✅ Unified API service (src/services/api.ts)
- ✅ Unified AuthContext (src/context/AuthContext.tsx)
- ✅ Routing structure (src/routes/AppRoutes.tsx)
- ✅ Main entry (src/main.tsx)

## Files to Copy

### 1. Admin Pages (from admin-dashboard/src/pages/)
Copy to: `frontend/src/app/admin/pages/`
- Dashboard.tsx
- Employees.tsx
- EmployeeDetail.tsx
- AddEmployee.tsx
- Attendance.tsx
- Salary.tsx
- SalarySummary.tsx

### 2. Employee Pages (from Employee_HR_Portal/pages/)
Copy to: `frontend/src/app/employee/pages/`
- Login.tsx → `frontend/src/app/auth/Login.tsx` (update imports)
- Dashboard.tsx
- Attendance.tsx
- SalaryHistory.tsx
- Profile.tsx
- LeaveManagement.tsx
- DocumentCenter.tsx
- Tasks.tsx
- Helpdesk.tsx
- NotFound.tsx → `frontend/src/app/shared/NotFound.tsx`

### 3. Admin Layout (from admin-dashboard/src/components/Layout/)
Copy to: `frontend/src/app/admin/layouts/`
- Layout.tsx
- Header.tsx
- Sidebar.tsx

### 4. Employee Layout (from Employee_HR_Portal/components/layout/)
Copy to: `frontend/src/app/employee/layouts/`
- Layout.tsx
- Header.tsx
- Sidebar.tsx

### 5. Shared Components (merge from both)
Copy to: `frontend/src/components/`
- UI components from both projects (merge duplicates)
- Keep the most complete version of each component

### 6. Utils (from both projects)
Copy to: `frontend/src/utils/`
- All utility files from both projects

### 7. Assets
- Copy public assets (logos, images) to `frontend/public/`

## Import Updates Required

After copying, update imports:
- `@/types` for types
- `@/services/api` for API calls
- `@/context/AuthContext` for auth
- Update relative paths to use `@/` alias

## Notes
- Admin pages use `/admin/*` routes
- Employee pages use `/employee/*` routes
- Login is at `/login` and redirects based on role
- Protected routes check role automatically

