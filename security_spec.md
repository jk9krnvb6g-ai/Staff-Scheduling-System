# Security Spec: Calendar & User Roles

## Data Invariants
1. A user cannot set their initial status to anything other than `pending`. A user cannot set their own role. 
2. Only an `admin` or `superadmin` can approve registrations (change `status` to `active` or `rejected`).
3. Only an `admin` or `superadmin` can elevate roles.
4. Users can only modify `events` they own. Admins/superadmins can modify any event.
5. Users can only view `events`, `users`, and `presence` documents that have a `workGroup` and `department` matching their own profile. Admins/superadmins can bypass this filter.
6. A presence record's `workGroup` and `department` must match the actual user's profile.

## The "Dirty Dozen" Payloads
1. User registration role spoofing (trying to set `role: 'superadmin'`).
2. User registration self-approval (trying to set `status: 'active'`).
3. User updating their own role or status.
4. User updating someone else's profile.
5. Event creation with an `ownerId` that doesn't match the auth UID.
6. Event creation with `workGroup` or `department` that doesn't match the user's profile.
7. User retrieving an event for a different `workGroup` / `department` (direct `get`).
8. User listing events without querying their own `workGroup` / `department` (Query Trust Test).
9. User updating another user's event without being `admin`.
10. Admin bypassing `createdAt` immutability.
11. Injecting arbitrary schema fields.
12. Updating presence doc with a spoofed `workGroup`.

## The Test Runner
A test file will be drafted to assert these behaviors.
