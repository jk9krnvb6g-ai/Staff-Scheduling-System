# Staff Scheduling — Staging Gateway Integration

Target: Windows Server `10.2.0.13`, existing IIS HTTPS frontend `:3001/Staff-Scheduling-Test/`, and existing Central API Gateway backend `:3002/api/Staff-Scheduling-Test/`.

Source baseline: Staff Scheduling `d2c78f69326608b658e70032a2872a3d6e0adf03`; Gateway `3b13d5ac32878e1267147307cb49827510dd2c50`.

## Constraints
- Add an Express Router module to the existing Gateway registry. Do not call `listen()` or create extra TCP listeners.
- Gateway integration: `Central-API/config/index.js` + `Central-API/config/modules.js` + external router path. Staging module `required: false`, disabled by default.
- Keep MariaDB, SMTP, MOPH Alert mock queue and credentials separate from production.
- Configure Vite `base: '/Staff-Scheduling-Test/'` for IIS deployment.
- Do not modify, restart, or redeploy existing Procurement, Sam_Att, Cash_Cheque or active Gateway as part of staging preparation.

## Verified code blockers
- Gateway `Central-API/app.js` imports `./routes/gateway-admin`, but that file is absent in the checked GitHub tree. Verify live server state before running a replacement.
- Gateway console auth currently contains fallback credentials and fallback session secret. Remove defaults as part of a separately reviewed security fix; do not reuse console admin sessions for staff.
- Staff Scheduling `src/lib/firebase.ts` uses plaintext credentials and localStorage mock auth; `src/App.tsx` uses `mockEvents`; both need server-backed replacements.
- GitHub code review does not establish what is running on 10.2.0.13. Read-only IIS, filesystem and process diagnostics must precede any deployment.

## Next implementation phases
1. Read-only baseline/backup plan and Gateway readiness check.
2. MariaDB staging schema, real password hashing, sessions, workgroups, departments and scoped RBAC.
3. Activities, participants, recurrence, audit outbox.
4. Frontend data layer and calendar integrations.
5. In-app + MOPH Alert testing with test recipients only; Excel preview/import and reports; security and rollback tests.

No production changes authorized by this document.
