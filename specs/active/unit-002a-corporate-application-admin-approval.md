# Unit 002A — Corporate Application and Admin Approval

- Status: active; planning complete, implementation not started
- Owner: Velora project owner
- Created: 2026-07-16
- Last updated: 2026-07-16
- Parent definition: [`Unit 002 — Corporate Module Definition`](../completed/unit-002-corporate-module-definition.md)
- Related decision IDs: VEL-ADR-003, VEL-ADR-011, VEL-ADR-014
- Related Bible sections: `context/architecture.md` (Planned corporate portal architecture), `context/project-overview.md` (Corporate)

## Owner goal

Implement the first bounded corporate portal foundation: authenticated company application, protected documents, secure Velora admin review, trusted corporate account creation, and initial corporate-admin association without weakening or silently converting the existing public lead workflow.

This specification plans Unit 002A only. No application code, API, route, rule, dependency, UI, or cloud resource is changed by the planning task that created it.

## Current repository truth

- `/corporate` is a public marketing page containing `components/CorporateForm.tsx`.
- `CorporateForm` writes directly to `corporate_requests` without authentication using fields `companyName`, `contactPerson`, `email`, `phone`, `city`, `employees`, `service`, `requirement`, legacy status `Pending`, and `createdAt`.
- The form uses browser alerts and provides no application identity, document upload, idempotency, duplicate detection, or applicant status page.
- `/admin/corporate` listens directly to `corporate_requests` and lets an admin set legacy `approved`, `pending`, or `rejected` lead statuses through client Firestore writes.
- An approved lead does not create a trusted corporate account or role and must never be treated as corporate approval authority.
- Firestore rules allow public `corporate_requests` creation and admin-only read/update/delete.
- Existing driver/vehicle review routes demonstrate Firebase ID-token verification, trusted `users.role == "admin"`, transaction-based review, trusted record creation, and deterministic notifications; Unit 002A should reuse the security pattern while addressing its own schema/idempotency needs.
- `firebase.json` configures Firestore/Auth emulators only. Firebase Storage and `storage.rules` are absent.

## Scope

- Preserve and clearly distinguish current public leads.
- Add authenticated corporate application submission and applicant status/resubmission.
- Add protected corporate document upload architecture and metadata.
- Add admin application listing/detail/review planning.
- Implement trusted status transitions: `submitted`, `under_review`, `needs_changes`, `approved`, `rejected`, `suspended`.
- Create `corporateAccounts` only after trusted approval.
- Associate or invite the first `corporate_admin` through a trusted server workflow.
- Write corporate audit events and application notifications.
- Add Firebase Admin APIs, narrow Firestore/Storage rules, indexes, idempotency, and duplicate-company controls.
- Add guarded staging seed data and focused API/rules/storage tests.

## Out of scope

- Corporate dashboard shell beyond application/status/review needs.
- General employee management or employee limits (Unit 002C).
- Corporate booking, policy approvals, dispatch integration, or guest OTP (Unit 002D).
- Discount calculation (Unit 002E).
- Credit ledger/reservation (Unit 002F).
- Invoicing, reconciliation, and reporting (Units 002G–002I).
- Production launch without staging evidence, Storage protection, malware-scanning boundary, and deployed/tested rules.
- Redesign of the current corporate marketing page or admin visual system.

## Roles and authorization

### Applicant

- Must be authenticated; password accounts must satisfy the repository's email-verification rule.
- May create an application for themselves as the authorized representative.
- May read their own application and document status.
- May edit only permitted applicant fields and replace requested documents while status is `needs_changes`, then resubmit.
- Cannot modify review fields, approval status, company credit/terms, trusted account data, corporate roles, or another application.

### Velora admin

- Must present a valid Firebase ID token and have trusted `users/{uid}.role == "admin"`.
- May read/review applications and protected documents.
- May move applications through allowed review states, request changes, approve, reject, suspend, or restore according to the transition policy.
- Cannot review an application for which the same UID is the applicant/authorized representative.
- Every review and privileged account/membership action records operator UID, server timestamp, reason/notes, idempotency key, and audit event.

### Initial corporate admin

- Receives no corporate privilege from a form value, lead status, custom client claim, or arbitrary company ID.
- On approval, the applicant UID may be transactionally associated as the initial `corporate_admin` when it matches the verified authorized representative.
- If a different representative must become the initial admin, the server creates an expiring, single-use invitation bound to the intended email/identity; privilege begins only after authenticated acceptance.
- Corporate roles live in trusted company membership records; Unit 002A must not overwrite the existing global customer/driver/admin role model without a separately documented compatibility decision.

## Application data plan

### `corporateApplications/{applicationId}`

Planned normalized fields include:

- Identity: `applicationId`, `applicantUid`, `sourceCorporateRequestId`, `clientRequestId`, `schemaVersion`.
- Company: legal/trading name, company type, incorporation/registration number, PAN, GST registration state/number where applicable.
- Address: registered address, billing address, city, state, PIN code, country.
- Representative: legal name, designation, verified account email, phone, alternate contact where needed.
- Operating profile: employee count, requested services, operating cities/areas, expected ride volume, requirements/notes.
- Documents: protected document metadata/references only; no raw file data or unrestricted public URLs.
- Declarations: authority, accuracy, privacy/document-processing consent, and terms acceptance with version/time.
- Review: status, submitted/updated timestamps, reviewedBy/reviewedAt, reviewNotes, rejectionReason, changeRequests, suspendedAt/by/reason, approval metadata, and review version.

The final schema must validate normalized PAN, GSTIN/registration identity, phone, PIN code, required declarations, conditional GST fields, and document completeness at server boundaries.

## Required documents and protected storage

Required document types:

- Company PAN.
- GST registration certificate when applicable.
- Incorporation or registration proof.
- Registered or billing address proof.
- Authorized representative identity proof.
- Representative designation/contact evidence where the application data is insufficient.
- Bank or billing evidence only when operationally required; avoid collecting unnecessary financial data.

### Storage architecture plan

- Firebase Storage must be explicitly enabled/configured before upload implementation; no fake controls are permitted while it is unavailable.
- Add `storage.rules` and reference it from `firebase.json` only during implementation after the bucket/project is verified.
- Use deterministic application-scoped paths such as `corporate-applications/{applicationId}/{documentType}/{version}/{objectId}`; never trust a client-supplied owner path.
- Applicant access is limited to their own active application paths. Authorized Velora admins may review. Owning corporate access after approval is limited to documents policy permits.
- Files are private; never store or display public permanent download URLs as authority.
- Allow only reviewed image/PDF formats (for example PDF, JPEG, PNG), reject SVG and executable/archive/script formats, validate MIME plus extension/signature, and enforce a documented per-file size limit (planned default maximum 10 MB unless implementation evidence requires lower).
- Upload into a quarantine/pending-scan state. A trusted malware-scanning service or documented operational scanning boundary must mark the object clean before admin review treats it as valid.
- Store authoritative metadata: application/owner UID, document type, object path, content type, size, checksum where supported, upload/scan status, timestamps, version, and replacement relationship.
- Replacements create a new version; they do not erase audit-relevant prior evidence. Retention/archival must follow the approved eight-year financial-record policy where a document becomes part of issued financial/account records and applicable Indian privacy/legal requirements otherwise.
- CORS, bucket lifecycle, scanning service, download delivery, and incident/quarantine behavior require staging verification. No secret or signed URL is logged.

## Duplicate and identity protection

- One applicant may have at most one active application (`submitted`, `under_review`, `needs_changes`, or `approved`) unless a trusted admin explicitly resolves the conflict.
- Normalize company PAN, GSTIN, incorporation/registration number, legal name, and representative email before duplicate checks.
- Prevent races with transactionally claimed normalized identifier documents or another uniqueness mechanism that does not rely on a preflight query alone.
- A matching legacy `corporate_requests` lead may be linked through `sourceCorporateRequestId`, but never auto-approved or silently mutated into an application.
- Suspected duplicate/reused identifiers return a safe conflict state for admin resolution without exposing another company's private application.
- Idempotent retries with the same applicant/client request return the same application; a different payload for an already-used idempotency key is rejected.

## Status transition plan

- New authenticated submission: no application → `submitted`.
- Admin review: `submitted` → `under_review`, `needs_changes`, `approved`, or `rejected`.
- Continued review: `under_review` → `needs_changes`, `approved`, or `rejected`.
- Applicant correction: `needs_changes` → `submitted` only after required changes/documents are supplied.
- Trusted suspension: `approved` → `suspended`; the corporate account operating status is also suspended atomically.
- Trusted restoration: `suspended` → `approved` only through an audited admin action when policy permits.
- `rejected` is terminal for that application record; a later application requires explicit duplicate/history handling.

Approval, rejection, needs-changes, suspension, and restoration require notes/reasons appropriate to the action. Application review status and corporate account operating status remain distinct even when suspension is mirrored for visibility.

## Approval transaction

An idempotent Firestore transaction must:

1. Re-read the application and reviewer.
2. Verify the reviewer is a trusted Velora admin and not the applicant.
3. Verify the requested transition and expected application version/status.
4. Re-check identifier claims and document completeness/clean scan state.
5. Update application review metadata/history.
6. On approval only, create or merge `corporateAccounts/{companyId}` with trusted defaults:
   - `creditLimitPaise: 10000000`
   - `usedCreditPaise: 0`
   - `reservedCreditPaise: 0`
   - `availableCreditPaise: 10000000`
   - `paymentTermsDays: 15`
   - monthly billing cycle
   - active operating status unless explicitly approved otherwise
   - approval/operator timestamps and schema version
7. Create the initial `corporate_admin` membership for the verified applicant or an identity-bound invitation for the approved representative.
8. Create append-only audit events and deterministic applicant/admin notifications.

Retries must not duplicate accounts, memberships, invitations, notifications, identifier claims, or audit events. Existing compatible account data must not be destructively overwritten.

## Planned APIs

Route names remain subject to the Next.js 16 route-handler guide during implementation. Proposed contracts:

- `POST /api/corporate/applications` — authenticated, verified applicant creates an idempotent application.
- `GET /api/corporate/applications/[applicationId]` — owner/admin reads authorized application status/detail.
- `POST /api/corporate/applications/[applicationId]/resubmit` — owner updates allowed fields/doc references from `needs_changes` and resubmits.
- `POST /api/corporate/applications/[applicationId]/documents/initiate` — validates ownership/type/size and returns a narrowly scoped upload mechanism.
- `POST /api/corporate/applications/[applicationId]/documents/complete` — verifies stored object metadata and records pending/clean scan state.
- `POST /api/admin/corporate-applications/[applicationId]/review` — trusted admin transition and atomic approval/account creation.
- `POST /api/corporate/invitations/[invitationId]/accept` — authenticated, intended representative accepts a valid single-use invitation.

All mutation APIs verify Firebase bearer tokens, parse/narrow unknown input, enforce idempotency, return safe errors, and avoid logging tokens, document URLs, private financial data, or unnecessary PII.

## Admin review experience plan

- Preserve the existing admin design and current corporate lead management.
- Add a separate applications view or clearly separated application section; do not relabel legacy leads as approved accounts.
- Filter by status and search safe operational fields such as company, representative, PAN/GST/registration identifier, email, phone, and city with access controlled to admins.
- Show application fields, document scan/review state, linked legacy lead, duplicate warnings, review history, and audit-safe metadata.
- Actions: mark under review, request changes, approve, reject, suspend, restore where permitted.
- Require notes for needs-changes, rejection, suspension, and restoration; approval should support internal notes.
- Require explicit confirmation for approval/suspension and disable duplicate submissions while the API runs.

## Notifications

Use the existing server notification helper and deterministic event keys for:

- Application submitted.
- Under review.
- Needs changes.
- Approved.
- Rejected.
- Suspended/restored.
- Initial corporate-admin invitation where applicable.

Notifications contain safe status/action information and local routes only. Documents, PAN/GST values, invitation secrets, and private review data are not included.

## Audit log plan

`corporateAuditLog/{eventId}` is server-created and append-only. Unit 002A events include application submission/resubmission, document add/replace/scan result, review transition, duplicate resolution, account creation, initial-admin association/invitation, suspension/restoration, and failed privileged transitions where operationally useful.

Each event records an idempotent event ID, actor UID/type, company/application/target IDs, action, safe status/change summary, reason where required, source, request correlation/idempotency ID, and server timestamp. Do not store secrets, raw document content, invitation token, or unnecessary identity/financial fields.

## Firestore rules plan

- Preserve current `corporate_requests` rules until an explicit migration unit changes the public lead workflow.
- `corporateApplications`: authenticated applicant may create/read own normalized application and resubmit only allowed fields from `needs_changes`; applicant cannot change review, approval, identifier-claim, account, or role fields. Admin reads as needed; trusted review writes use Admin APIs.
- `corporateAccounts`: owning approved membership may read permitted account profile/status; client create/update/delete is denied in Unit 002A.
- Initial corporate memberships/invitations: intended owner reads only what acceptance/status requires; privileged role creation and invitation mutation are server-only.
- Document metadata: owner/admin reads according to application ownership; trusted scan/review fields are server-only.
- `corporateAuditLog` and identifier claims: client writes denied; admin reads only if required.
- Unknown collections remain denied.

Rules tests must cover owner isolation, cross-company denial, review-field protection, self-approval denial at the API boundary, role escalation, identifier claims, invitation identity/expiry/replay, account creation denial, and unknown collection denial.

## Storage rules plan

- Require authenticated ownership for applicant upload/read paths.
- Deny listing/broad reads and cross-application access.
- Restrict writes by path ownership, content type, and size, while treating server metadata validation/scanning as authoritative.
- Prevent applicants from overwriting another version/object or writing scan/approval metadata.
- Allow authorized admin review without public access.
- Test owner/admin/cross-owner, MIME/size, SVG/executable rejection, replaced-version, and unauthenticated scenarios using the Storage emulator or an isolated staging bucket.

## Index planning

Likely Firestore indexes include application status plus submitted time, applicant UID plus updated time, normalized company identifier/status for admin duplicate resolution, and company/account status. Final indexes follow the implemented query contracts and must be emulator/staging validated before deployment.

## Legacy `corporate_requests` compatibility

- Keep existing documents, form fields, legacy casing, admin list, and rules working until an explicit migration is implemented.
- A legacy `approved` lead is sales qualification only and grants no account, role, credit, or portal access.
- Unit 002A may add an admin action that sends an authenticated application invitation and links the resulting application through `sourceCorporateRequestId`.
- Do not copy unverified lead data into protected identifiers without applicant confirmation and server validation.
- Do not delete, bulk rewrite, or silently backfill historical leads.
- Admin UI must visually distinguish lead status from application/account approval.

## Staging seed and test plan

Extend the guarded test seed only during implementation:

- TEST ONLY verified applicant with submitted application.
- Application under review.
- Application requiring changes with replaceable document metadata.
- Approved corporate account with default credit/terms and initial corporate admin.
- Rejected and suspended applications/accounts.
- Duplicate PAN/GST/registration conflict cases.
- Legacy `corporate_requests` lead linked and unlinked cases.
- Clean, quarantined, rejected-type, oversized, cross-owner, and replaced document fixtures without real identity documents.

The seed remains idempotent, tagged, production-refusing without explicit confirmation, and cleanup removes only seeded records/objects. Never seed real PAN/GST/identity/bank documents or print secrets.

### Required test levels

- Unit tests for normalization, validation, transition matrix, idempotency, and duplicate-key generation.
- Firestore emulator rules tests for owner/admin/cross-tenant and protected-field behavior.
- Storage emulator or isolated staging tests for private paths, types, size, versions, and admin access.
- API tests for auth, admin role, self-review, transitions, duplicate conflicts, retry/replay, and atomic approval.
- Staging browser journeys for application, document replacement, review, notifications, account creation, and invitation acceptance.
- Production deployment only after staging evidence, rule/index/storage deployment review, rollback rehearsal, and owner approval.

## External setup required before implementation completion

- Enable Firebase Storage on the intended staging project and confirm the bucket.
- Approve/deploy private Storage rules and necessary CORS only for intended origins/methods.
- Select/configure the malware-scanning boundary and quarantine workflow.
- Configure bucket lifecycle/retention consistent with legal/privacy requirements.
- Deploy required Firestore rules/indexes after emulator validation.
- Configure Preview/Production environment scopes without exposing credentials.

The owner must place secrets/configuration directly in the relevant console or local environment; none belong in chat or source.

## Expected implementation files

Exact paths must be re-audited before implementation. Likely additions/modifications include bounded corporate application pages/components/types, admin application review UI, authenticated route handlers under `app/api/`, server validation/approval/storage helpers under `lib/server/`, Firestore/Storage rules and indexes, Firebase configuration, seed fixtures, tests, and the affected Bible files. Existing lead files are modified only when compatibility requires it.

## Completion criteria

- Existing `/corporate` lead submission and `/admin/corporate` lead management remain functional and clearly non-authoritative.
- Authenticated verified applicant can submit one normalized idempotent application and view status.
- Duplicate applicant/company identifiers are prevented safely under concurrency.
- Required documents upload privately with validated type/size/path, scan/quarantine state, versioning, and no cross-user/public access.
- Applicant can resubmit only requested fields/documents from `needs_changes`.
- Admin can review through allowed statuses with required notes and no self-approval.
- Approval atomically creates one trusted corporate account with approved default credit/terms and one trusted initial-admin association/invitation.
- Rejection/needs-changes creates no account or privileged role; suspension blocks the trusted account without interrupting unrelated systems.
- Notifications and append-only audit events are idempotent and contain no sensitive document/financial data.
- Firestore and Storage rules plus focused API tests pass in emulators/staging without weakening unknown-collection denial.
- Guarded seed/cleanup covers all states using fake data only.
- Typecheck, lint, production build, diff check, security/secret scan, staging journeys, deployment/rollback plan, and Bible updates pass.

## Planning-task validation

Executed on 2026-07-16:

- Active/completed specification placement and Markdown links: passed.
- Documentation secret, whitespace, and application-code scope checks: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with the same four pre-existing driver-dashboard warnings and no errors.
- `npm run build`: passed and generated 43 static pages.
- `git diff --check`: passed.

These results validate the repository and planning documents only. They do not satisfy Unit 002A implementation completion criteria.

## Rollback plan

- Disable new application entry while preserving existing `corporate_requests` leads.
- Revert Unit 002A application routes/UI/APIs/rules/indexes/storage configuration as one bounded release.
- Retain already-created application/account/audit/document records for investigation and legal integrity; do not destructively delete them during rollback.
- Revoke/disable affected corporate account/membership access through trusted server operations if a security defect requires containment.
- Restore prior rule versions and confirm public lead/admin lead behavior with smoke tests.

## Planning result

Unit 002A is ready for a separate PLAN → IMPLEMENT → VERIFY coding session after the staging Storage bucket and malware-scanning approach are available. This document does not claim any corporate application, document upload, account creation, rule, API, or portal functionality is implemented.
