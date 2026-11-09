# Admission Portal Redesign — Progress

## Branch
`feature/admission-portal-redesign`

## Implemented
- Renamed the role-based **My Profile** navigation item to **Account**.
- Clarified that Account is for account details and basic security, keeping **Student Profile** separate.
- Refined dashboard hero, KPI-card sizing, and responsive dashboard columns.
- Improved mobile behavior for dashboard side panels, admission search filters, and search-result tables.
- Improved student dashboard content structure: Enrollment Guide, Important Reminders, policy content, and support are placed in the intended dashboard column.
- Added keyboard focus visibility and minimum touch-target refinements.
- Preserved existing navigation routes, role checks, Apps Script calls, and data workflows.

## Preserved
- Apps Script and Google Sheets backend.
- Existing authentication and role permissions.
- Existing student registration, enrollment, and reporting actions.
- Staff-managed requirements checklist; no online document-upload workflow added.

## Pending
- Add the approved institutional logos and building photograph under `assets/`.
- Connect the images to the dashboard banner and side panel after the binary assets are present.
- Perform visual testing in the Apps Script test deployment at desktop, tablet, and mobile widths.
- Review dashboard and admission-operation behavior with representative synthetic data.

## Safety
- This branch is isolated from `main`.
- No production deployment was made.
- No backend or spreadsheet schema changes were made.
- Do not merge or deploy without explicit approval.
