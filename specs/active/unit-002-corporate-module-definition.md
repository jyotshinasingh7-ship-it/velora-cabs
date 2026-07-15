# Unit 002 — Corporate Module Definition

- Status: proposed; blocked on owner business decisions
- Owner: Velora project owner
- Created: 2026-07-15
- Last updated: 2026-07-15
- Related decision IDs: VEL-ADR-007
- Related Bible sections: `context/project-overview.md` (Corporate), `context/architecture.md` (`corporate_requests`)

## Owner goal

Define whether Velora corporate remains a lead funnel or becomes a secure company transport platform before any implementation.

## Business context

Marketing currently presents corporate transport benefits. The code supports enquiry capture and admin lead visibility, not corporate operations.

## Current repository truth

- `/corporate` renders marketing sections and `components/CorporateForm.tsx`.
- The form creates `corporate_requests` through client Firestore.
- `/admin/corporate` provides admin lead handling.
- Firestore rules permit public create and admin read/update/delete.
- No corporate authentication role, company tenant, employee management, approval policy, contracted pricing, invoicing, monthly billing, or corporate reports are verified.

## Problem statement

Product claims, roles, tenancy, commercial rules, workflows, data retention, and completion criteria must be agreed before building a full module.

## Scope

- Decide lead-generation-only versus full portal.
- Define company onboarding, account ownership, employee/rider management, approval policies, contract pricing, credit limits, monthly billing, GST invoices, reports, support, and audit requirements.
- Define MVP and phased boundaries.

## Out of scope

No corporate application code, schema, routes, rules, UI, or billing integration changes in this documentation unit.

## User roles

Potential roles requiring owner decision: company admin, approver, employee/rider, Velora operations/admin, finance.

## User journey

Current: visitor reads corporate offering → submits enquiry → Velora admin reviews lead. Future journey is undefined.

## UX behavior

Preserve current corporate marketing/form design unless a separately approved UI spec exists.

## Data model

Current: `corporate_requests`. Possible future records—companies, memberships, policies, contracted rates, bookings, invoices, payments—are proposals only.

## API changes

None approved.

## Firestore rules

Current public lead creation/admin management stays. Any tenant system requires strict company membership and server-side privilege checks.

## Security constraints

No client-created company role, cross-company reads, client-selected contract price, or invoice/payment authority. Define data retention and personally identifiable information handling.

## Compatibility requirements

Preserve existing `corporate_requests` leads and admin handling through any future migration.

## Files to create

Future files depend on approved product definition.

## Files to modify

None in this unit until approved.

## External setup

Potential invoicing/GST/payment/accounting systems require separate owner/vendor decisions.

## Implementation plan

1. Owner answers business questions.
2. Record approved decisions.
3. Split approved MVP into bounded implementation units.
4. Design tenancy/security/schema before UI implementation.

## Validation commands

Documentation-only until implementation units are approved.

## Automated tests

To be defined per approved implementation unit.

## Manual test checklist

To be defined after product scope approval.

## Failure/edge cases

Tenant isolation, employee departure, approval chains, disputed rides, credit limit, tax changes, invoice corrections, cancelled bookings, and account suspension require decisions.

## Completion criteria

- Owner selects lead-only or full portal direction.
- MVP roles, journeys, commercial rules, data model, security, integrations, and definition of done are approved and logged.
- Follow-on implementation specs are created; no code is required for this definition unit.

## Rollback plan

Retain current lead workflow and mark rejected proposals with reasons.

## Documentation/Bible updates

Update overview, architecture, glossary, progress, and decisions after owner approval.

## Final result

Needs owner decisions:

1. Lead-generation only or authenticated portal?
2. Who contracts/pays: company, employee, or mixed?
3. Required roles and approval chain?
4. Contract pricing and credit terms?
5. Monthly billing and GST invoice requirements?
6. Required reports/accounting integration?
7. MVP launch market and compliance/data-retention requirements?
