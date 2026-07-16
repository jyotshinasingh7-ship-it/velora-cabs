# Unit 002 — Corporate Module Definition

- Status: completed; business definition approved
- Owner: Velora project owner
- Created: 2026-07-15
- Last updated: 2026-07-16
- Related decision IDs: VEL-ADR-007, VEL-ADR-011, VEL-ADR-012, VEL-ADR-013, VEL-ADR-014
- Related Bible sections: `context/project-overview.md` (Corporate), `context/architecture.md` (Planned corporate portal architecture)

## Owner goal

Define an authenticated, company-paid corporate transport portal that reuses Velora's existing booking and dispatch engine while adding trusted company tenancy, policy, credit, invoicing, reporting, and administration.

## Current repository truth

The implemented corporate feature remains lead-generation only:

- `/corporate` renders corporate marketing and `components/CorporateForm.tsx`.
- The public form creates `corporate_requests` documents.
- `/admin/corporate` lets admins view and update those leads.
- Firestore rules allow public lead creation and admin-only lead management.
- No authenticated corporate portal, company tenant, corporate role, employee membership, booking policy, credit ledger, invoice workflow, or corporate report exists.

Everything below is an approved product/architecture plan unless explicitly described as current. No application route, collection, rule, or financial workflow in this specification is implemented by Unit 002.

## Approved business model

- Corporate becomes an authenticated company portal after application and Velora admin approval.
- Corporate rides are company-paid and postpaid.
- Employees and guests do not pay during booking.
- Eligible corporate rides are billed to the approved company account.
- Corporate rides never enter the normal customer cash/Razorpay checkout flow.
- Companies receive monthly consolidated GST invoices.
- Default terms are Net 15; Velora admin may configure Net 7, Net 15, or Net 30 per company.
- Initial settlement is bank transfer with manual admin reconciliation.
- Online invoice payment is future scope.

## Corporate approval

1. A company submits a corporate application.
2. Velora admin reviews it through a trusted server workflow.
3. Application statuses are `submitted`, `under_review`, `needs_changes`, `approved`, `rejected`, and `suspended`.
4. Approval creates/activates a trusted corporate account; rejection or change requests do not.
5. Applicants cannot approve themselves or assign corporate permissions.
6. Only trusted server-side administration assigns corporate roles and company membership.

Whether an approved account later uses a distinct account lifecycle (`active`, `credit_blocked`, `suspended`, `closed`) is an implementation-schema detail; application review status and account operating status must not be conflated.

### Required application documents

- Company PAN.
- GST registration certificate when applicable.
- Company incorporation or registration proof.
- Registered or billing address proof.
- Authorized representative identity proof.
- Authorized representative designation and contact details.
- Bank or billing details only where operationally required.

Document uploads require protected storage. Files must not be publicly readable; access is limited to authorized Velora admins and, where appropriate, the owning corporate account. Implementation planning must include MIME/extension allowlists, executable/SVG rejection, size limits, malware scanning or a documented scanning service boundary, deterministic tenant/application paths, metadata validation, download authorization, retention, and safe deletion/archival behavior.

## Roles and tenancy

### `corporate_admin`

May, within their own approved company:

- Manage the company profile fields that are explicitly editable.
- Add/invite, activate, and suspend employees.
- Assign departments, cost centers, permissions, and spending limits.
- Book for self, employees, and guests.
- Review bookings that exceed employee policy limits.
- View company rides, spending, invoices, credit utilization, and reports.

Cannot change trusted company approval, discount, credit limit, payment terms, invoice totals/status, payment records, or protected roles.

### `corporate_employee`

May:

- Book authorized corporate rides within company and employee policy.
- View their own corporate rides.
- Use only allowed services and assigned limits.

Cannot change company billing, pricing, credit, employee roles, invoices, or another employee's data.

### Membership invariant

- One employee account belongs to one approved company in the MVP.
- Membership is created through a secure invitation/association workflow.
- A client-supplied `companyId` is never sufficient to create membership.
- Multi-company membership is future scope.

## Approved booking policy

- Authorized employees book directly within assigned limits.
- A booking above an employee limit requires corporate-admin approval before confirmation/dispatch.
- A company credit-limit breach blocks new corporate bookings.
- A Velora admin may override a credit block only through a trusted server action with an audit entry.
- Suspended companies and suspended employees cannot create corporate bookings.
- A corporate admin may book for self, an employee, or a guest.
- Guest booking requires a guest phone number and successful phone OTP verification before the ride is confirmed, unless a future trusted operational exception is explicitly approved.
- Guest riders receive no corporate financial or company-management access; the ride remains linked to the company, booking corporate admin, guest contact, and business purpose.
- Corporate booking reuses the existing `bookings` collection and dispatch/lifecycle engine; no second ride engine or corporate bookings collection will be created.
- Initial services are `local`, `airport`, and `outstation`.
- Immediate and scheduled rides are in scope.
- Intercity and custom tours are future scope until a separate reuse/security design is approved.

### Planned approval flow

- A trusted corporate booking API resolves company membership, status, policy, pricing, and credit.
- Within-policy bookings may receive `approvalStatus: not_required` and proceed directly.
- Over-limit bookings receive `approvalStatus: pending` and do not dispatch until an authorized corporate admin approves.
- Proposed approval statuses are `not_required`, `pending`, `approved`, `rejected`, `expired`, and `cancelled`; implementation must confirm compatibility before finalizing.
- Admin approval is company-scoped and server-authoritative.

## Planned booking fields

Corporate rides remain in `bookings/{clientRequestId}` and preserve existing aliases required by customer, admin, and driver readers. Proposed protected additions are:

- `companyId`
- `corporateAccountId`
- `employeeId` when applicable
- `guestDetails` when applicable
- `department`
- `costCenter`
- `businessPurpose`
- `bookedByUid`
- `passengerUid` when applicable
- `approvalStatus`
- `approvedBy`
- `approvedAt`
- `corporatePricingPlanId`
- `invoiceId` when invoiced
- `billingCycle`
- `corporateBookingReference`
- a corporate billing marker that prevents customer checkout
- pricing/discount and credit-reservation snapshots required for auditability

Compatibility planning:

- Preserve `customerId`/`userId`, `bookingType`/`bookingMode`, `rideStatus`/`status`, route fields, service/vehicle fields, estimates, driver linkage, and lifecycle timestamps.
- For employee self-booking, the employee UID should remain available through the existing customer ownership aliases.
- For admin-booked employee rides, preserve the passenger UID for rider visibility and `bookedByUid` for audit.
- For guest rides without a UID, retain the authenticated corporate admin as booking actor and keep guest details protected.
- The corporate booking implementation spec must audit every current customer/admin/driver reader and API before finalizing these mappings.
- Existing customer payment status types do not yet model company postpaid billing; Unit 002D/002F must define a compatible protected marker/state without misreporting a corporate ride as customer-paid.

## Employee management

Corporate admins may:

- Add and invite employees.
- Activate or suspend employees.
- Assign department and cost center.
- Configure per-ride and monthly spending limits.
- Configure allowed service types.
- Enable or disable booking permission.
- View employee ride usage within the company.

Default employee limits are `500000` paise (₹5,000) per ride and `2500000` paise (₹25,000) per month. A corporate admin may lower them per employee. Increasing a limit above the company policy ceiling requires Velora admin approval or another explicitly trusted server-side policy rule. Clients cannot authoritatively raise limits.

Invitations must be server-created, expiring, single-use, and tied to the intended company and invitee identity. The acceptance route must authenticate the invitee and atomically create the trusted membership. Bulk CSV import is future scope.

## Pricing

- MVP pricing is the existing server-authoritative fare calculation plus an admin-configured company-level percentage discount.
- Corporate discounts do not use notification coupons.
- Corporate users cannot modify pricing or discount values.
- The booking stores the trusted pricing-plan and discount snapshot used for the estimate/final charge.
- Custom per-vehicle corporate rate cards are future scope.

Apply the approved company discount before GST. Determine tax treatment using applicable place-of-supply rules: same-state supply uses CGST plus SGST; inter-state supply uses IGST. All discounts, taxable amounts, and tax components are calculated server-side in integer paise. Rates and jurisdiction logic remain configurable and require qualified Indian tax-professional review before production invoicing; browser components must not hardcode tax assumptions.

## Credit model

Each approved corporate account is planned to contain or reference:

- `creditLimitPaise`
- `usedCreditPaise`
- `reservedCreditPaise` (proposed to make reservation state explicit)
- `availableCreditPaise`
- `paymentTermsDays`
- `accountStatus`
- `billingCycle`
- `creditBlocked`
- `creditBlockReason`

All currency values use integer paise. Browser-calculated balances are never authoritative.

The default approved company credit limit is `10000000` paise (₹1,00,000). Velora admin may configure another company limit only through a trusted server action with operator identity, reason, timestamp, and audit history.

### Approved reservation decision

- Reserve estimated credit atomically when a booking becomes approved/confirmed.
- Compute availability as the trusted limit less outstanding used credit and active reservations.
- Use a Firestore transaction to prevent concurrent bookings from overspending.
- On ride completion, atomically release the estimate reservation and replace it with the authoritative final corporate charge.
- Never count the reservation and final charge simultaneously.
- A cancellation or failed booking releases its reservation; if a cancellation fee applies, convert only that authoritative fee into used credit.
- Manual payment reconciliation reduces outstanding used credit only through a trusted server workflow.
- Every reservation, release, finalization, override, and payment produces an immutable/idempotent ledger entry and audit record.

The implementation must define recovery/idempotency behavior for transaction retries and partially completed lifecycle operations.

## Invoicing and settlement

- Monthly invoices begin as system-generated drafts.
- Velora admin reviews a draft before final issue.
- Corporate admins can view issued invoices for their company.
- Invoice statuses are `draft`, `issued`, `partially_paid`, `paid`, `overdue`, and `cancelled`.
- Default terms are Net 15, configurable to 7, 15, or 30 days per company.
- A seven-calendar-day grace period begins after the due date. During grace, the portal shows overdue warnings. After grace, new corporate bookings are blocked by default, while already active rides continue uninterrupted.
- Velora admin may grant a temporary override or extension only through an audited server action. Repeated overdue behavior may result in company suspension.
- Initial payment is manual bank transfer.
- An authorized Velora admin records payment reference, amount, date, and notes through a secure API.
- Reconciliation actions are idempotent and retain operator UID, timestamp, previous state, and audit history.
- In the MVP, only a Velora admin may issue or cancel a final invoice. Corporate admins may view invoices and review draft ride data but cannot issue, alter, cancel, or mark an invoice paid. A dedicated Velora finance-admin role is future scope.
- Automatic invoice PDF generation is future implementation planning and is not implemented now.

Planned invoice content:

- Company legal name, billing address, and GST number when supplied.
- Invoice number, billing period, issue date, and due date.
- Ride-wise line items and corporate booking references.
- Subtotal, discount, taxable amount, GST components, total, amount paid, and balance due.
- Payment/reference details and reconciliation history as appropriately visible.

Every invoice issue, cancellation, and payment reconciliation action records operator UID, authoritative timestamp, and an audit event.

Corporate invoices, invoice-payment records, and associated financial audit records are retained for at least eight years. Corporate ride reports also remain available for eight years where legally and operationally appropriate. Protected financial records use archival rather than normal client-side deletion, and deletion must never break invoice or audit integrity. Implementation remains subject to applicable Indian legal, tax, privacy, and accounting requirements.

## Reporting MVP

- Date-wise rides.
- Employee-wise rides.
- Department-wise rides and spend.
- Cost-center-wise spend.
- Service-type spend.
- Monthly totals.
- Invoice status.
- Credit utilization.
- CSV export where practical.

Advanced analytics, accounting integrations, SAP/Tally integration, and automated tax filing are future scope.

## Cancellation

- Reuse existing general cancellation rules initially.
- Charge applicable cancellation fees to the company account.
- Corporate admins can see cancellation reasons and fees.
- Employees cannot waive a fee.
- Velora admin overrides require a trusted server action and audit history.

The implementation unit must audit the current cancellation route and define the authoritative fee source before corporate charging is enabled.

## Planned routes

These routes are approved for planning and do not exist unless already listed as current:

Public/current:

- `/corporate` — current marketing/lead form; later application entry without breaking existing leads.

Corporate portal:

- `/corporate/login`
- `/corporate/dashboard`
- `/corporate/company`
- `/corporate/employees`
- `/corporate/book`
- `/corporate/rides`
- `/corporate/approvals`
- `/corporate/invoices`
- `/corporate/reports`

Admin:

- `/admin/corporate` — preserve current lead management and extend deliberately.
- `/admin/corporate/[companyId]`
- `/admin/corporate/invoices`

Sensitive mutations require authenticated server APIs; route names and request contracts are finalized only in their bounded implementation specs.

## Proposed data model

All collections below are planning only.

### `corporateApplications/{applicationId}`

Applicant/company identity, legal and billing details, contacts, optional GST data, application status, submitted/updated timestamps, reviewer UID/timestamp, notes, rejection/change requests, and schema version. Applicant reads own application and may edit only permitted fields during `needs_changes`; admin review is server-controlled.

### `corporateAccounts/{companyId}`

Trusted approved company tenant: corporate account ID, legal/billing identity, operating status, payment terms, billing cycle, pricing-plan/discount reference, credit fields, approval metadata, and timestamps. Protected commercial/status fields are server-only.

### `corporateEmployees/{membershipId}`

Trusted company membership: company ID, user UID, role, employee identifier, department, cost center, limits, allowed services, booking permission, status, inviter/activation metadata, and usage aggregates where safe. The implementation should use a deterministic uniqueness strategy for the MVP's one-company-per-user invariant.

### `corporateInvitations/{invitationId}`

Server-created invitation with company, intended identity, role, expiry, status, creator, and hashed/safe acceptance material. Raw reusable invitation secrets must not be stored or logged.

### `corporateBookingApprovals/{bookingId}`

Company-scoped approval request linked one-to-one with a booking: policy snapshot, reasons/limits exceeded, status, requester, approver, timestamps, and notes. It cannot independently authorize dispatch without a trusted transaction updating the booking and credit reservation.

### `corporateCreditLedger/{entryId}`

Append-only/idempotent entries for reservation, release, final charge, cancellation charge, payment, credit override, and correction. Entries use integer paise and reference company, booking/invoice/payment, operator/event, timestamps, and reversal relationships. Client writes are denied.

### `corporateInvoices/{invoiceId}`

Company/billing-period snapshot, unique invoice number, immutable issued line items/totals, tax components, dates, status, paid/balance amounts, generation/issue metadata, and audit references. Draft recalculation and issue transitions are trusted server operations.

### `corporateInvoicePayments/{paymentId}`

Manual bank-transfer reconciliation: company/invoice IDs, amount paise, payment/reference dates, bank reference, notes, status, idempotency key, recorder UID/timestamp, and reversal/correction metadata. Client writes are denied.

### `corporateAuditLog/{eventId}`

Append-only actor, company, action, target type/ID, safe before/after status or changed-field summary, reason, source, and server timestamp. No secrets or unnecessary financial/customer personal data appear in logs.

### Existing `bookings/{clientRequestId}`

Remains the single ride record and dispatch source of truth with protected corporate additions described above. This preserves current driver/admin/customer compatibility and avoids a second dispatch engine.

## Security invariants

- Corporate users cannot approve their own company.
- Employees cannot associate themselves with arbitrary companies.
- Company membership and roles are trusted server-managed records.
- Corporate booking APIs verify company, membership, account, employee, policy, pricing, and credit status server-side.
- Suspended companies/employees cannot book.
- Corporate users access only their company; employees see only permitted company data and their own rides.
- Company pricing, discounts, credit, invoices, payment records, and financial transitions are protected.
- Admin actions record operator/reviewer UID and authoritative timestamps.
- No browser-authoritative invoice, credit, discount, approval, or payment state.
- No direct client writes to protected financial records.
- Unknown Firestore collections remain denied.
- Logs contain no secrets, invitation tokens, private financial data, or unnecessary personal data.

## Firestore and index planning

- Default deny all proposed collections, then add narrow owner/company/admin reads and server-only financial writes.
- Admin/client page checks never replace server/rules authorization.
- Required composite indexes will depend on final query contracts for company/status/date, employee/date, invoice period/status, and ledger company/time.
- Rules and emulator/API tests are mandatory in each implementation unit; rules must not be broadened to make UI code work.

## Phased implementation plan

Only the immediate bounded unit should receive a separate active implementation spec once its remaining inputs are resolved.

1. **Unit 002A — Corporate application and secure admin approval:** preserve existing leads, add an authenticated application, trusted review API, and corporate account creation.
2. **Unit 002B — Authentication, role routing, and dashboard shell:** trusted corporate membership resolution and protected portal layout.
3. **Unit 002C — Employee invitation and policy management:** activation/suspension, roles, department/cost center, limits, services, and permission.
4. **Unit 002D — Corporate booking and approvals:** reuse existing booking/dispatch, support self/employee/guest, policy evaluation, approval, and credit reservation.
5. **Unit 002E — Company pricing:** trusted percentage discount, snapshots, and tax-order decision implementation.
6. **Unit 002F — Credit ledger and final charge:** reservation/release/finalization, cancellation charges, overrides, and race/idempotency tests.
7. **Unit 002G — Monthly invoice generation and issue:** draft generation, line-item claiming, admin review/issue, due dates, and company visibility.
8. **Unit 002H — Manual bank-transfer reconciliation:** payments, partial payments, corrections/reversals, credit release, and audit history.
9. **Unit 002I — Reports and CSV export:** MVP dimensions, invoice/credit reporting, scoped exports.
10. **Unit 002J — End-to-end hardening:** rules/API tests, staging role journeys, financial reconciliation, accessibility, production setup, monitoring, and rollback.

A bounded planning-only Unit 002A specification now defines corporate application and secure admin approval. No Unit 002A application code is created by this definition task.

## Out of scope for initial MVP

- Employee-paid corporate rides and split payments.
- Automatic bank payouts.
- Multi-level manager approval chains.
- Bulk CSV employee import.
- SAP/Tally/accounting integration.
- Payroll deduction.
- Recurring employee transport or route planning.
- Multi-company employee membership.
- Online invoice payment.
- Advanced accounting automation and automated tax filing.
- Corporate mobile app.
- Public corporate APIs.
- Custom per-vehicle rate cards.
- Intercity/custom-tour corporate booking until separately approved.

## Final owner decisions

1. Default company credit is `10000000` paise (₹1,00,000), configurable only through audited Velora administration.
2. Default employee limits are `500000` paise per ride and `2500000` paise monthly; corporate admins may lower them, while increases beyond the company ceiling require trusted approval.
3. Corporate discount applies before GST; same-state supply uses CGST/SGST and inter-state supply uses IGST, with server-side paise calculations and tax-professional review.
4. PAN, applicable GST certificate, incorporation/registration proof, address proof, representative identity/designation/contact, and operationally necessary bank/billing details are required through protected storage.
5. Net 15 has a seven-day grace period, then new bookings are blocked by default without interrupting active rides; audited overrides/extensions and repeated-overdue suspension are supported.
6. Guest phone and OTP verification are required before confirmation; guests gain no corporate account access.
7. Only Velora admin may issue/cancel final invoices or reconcile payments in the MVP; finance-admin is future scope.
8. Corporate financial records and associated reports are retained for at least eight years with archival and legal/privacy safeguards.

No genuine Unit 002 business decision remains unresolved. Tax configuration still requires qualified professional review before production invoicing, and protected Storage requires technical implementation/setup in Unit 002A; these are implementation/compliance gates rather than missing product decisions.

## Completion criteria

- [x] Authenticated company portal direction and company-paid postpaid model approved.
- [x] Corporate application/approval lifecycle and trusted roles approved.
- [x] Initial booking services, policy, tenancy, pricing, credit, invoicing, settlement, reporting, cancellation, and security direction documented.
- [x] Existing `bookings`/dispatch reuse and protected corporate-field strategy approved.
- [x] Proposed routes, collections, phased units, compatibility constraints, and MVP exclusions documented.
- [x] Credit/limit, tax, document, suspension, guest, invoice-authority, and retention decisions approved.
- [x] Unit 002A completion criteria and external dependencies finalized in a bounded planning specification.

Unit 002 is completed. Future implementation evidence belongs to Units 002A–002J and must not be inferred from this business-definition completion.

## Validation

Documentation-only validation requires Markdown path/link checks, secret scanning, confirmation that no application source changed, TypeScript, lint, production build, and `git diff --check`.

Executed on 2026-07-15:

- Updated-file existence and Markdown link targets: passed.
- Changed-document secret scan: passed.
- Application-code change check: passed; only `context/` and `specs/` changed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with the same four pre-existing driver-dashboard warnings and no errors.
- `npm run build`: passed and generated 43 static pages.
- `git diff --check`: passed.

Final completion validation on 2026-07-16:

- Unit 002 completed-file placement and Unit 002A active-spec existence: passed.
- Documentation link, secret, whitespace, and application-code scope checks: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with the same four pre-existing driver-dashboard warnings and no errors.
- `npm run build`: passed and generated 43 static pages.
- `git diff --check`: passed.

## Rollback plan

Revert only Unit 002 documentation decisions. Current `/corporate`, `corporate_requests`, `/admin/corporate`, Firestore rules, and production behavior remain unchanged by this definition task.
