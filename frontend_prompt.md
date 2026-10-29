# MASTER BUILD PROMPT 2 — RESEARCHBRIDGE FRONTEND

## ROLE

Act as a senior frontend architect, Next.js and React engineer, UI/UX designer, TypeScript developer, accessibility specialist, and API integration engineer.

Your job is to implement the complete, modern, responsive frontend for ResearchBridge, a university research collaboration platform.

The FastAPI backend is being developed separately and must remain the authoritative source of business logic, database operations, authorization, and AI processing.

This is a real hackathon application. Build a cohesive, working product—not just a landing page, static dashboard, or collection of nonfunctional components.

Inspect the existing repository, understand the backend API contract, implement the frontend, run it, test the core workflows, and fix errors.

Do not stop after generating a plan or visual prototype.

## 1. PRODUCT VISION

ResearchBridge allows university students to discover professors, explore their research interests, read publications, identify advertised supervision opportunities, submit research requests, and communicate directly with professors.

Professors can manage academic profiles, publications, ongoing research projects, advertised openings, incoming applications, and conversations.

A floating Gemini-powered AI assistant helps users understand research papers, explore unfamiliar research topics, and plan their next research steps.

The entire experience should feel like a high-quality academic research network rather than a generic student-management dashboard.

## 2. REQUIRED STACK

Use:

- Next.js with the App Router.
- React.
- TypeScript in strict mode.
- Tailwind CSS.
- shadcn/ui or similarly accessible, well-maintained UI primitives.
- Lucide icons.
- Supabase JavaScript client for Auth and authorized Realtime subscriptions.
- A typed API client that communicates with the FastAPI backend.
- React Hook Form and Zod, where appropriate, for validated forms.
- A suitable query and caching strategy, such as TanStack Query, if it improves the implementation.

Use currently supported, compatible package versions. Check the repository and official documentation before installing or upgrading packages.

The frontend must be deployable to Vercel.

Do not build a separate Node.js backend or duplicate FastAPI endpoints in Next.js route handlers.

Do not expose server-only secrets to client components.

## 3. FIRST INSPECT THE BACKEND

Before creating pages, inspect the existing backend implementation, its README, available API routers, Pydantic schemas, authentication behavior, and OpenAPI contract.

Use the actual `/openapi.json` output or another generated backend API specification as the authoritative contract.

Understand the real request parameters, response structures, error formats, status enums, and required authorization headers.

Create a frontend API type layer from the actual contract. Prefer generated TypeScript types where practical.

Do not guess field names or invent endpoint URLs.

If an essential endpoint is missing, identify the precise gap. If you have access to the backend repository, implement or propose the corresponding backend change and keep the API contract synchronized. Do not hide missing functionality behind fake frontend data.

## 4. VISUAL DESIGN DIRECTION

Create a distinctive, polished, research-focused interface.

The visual quality should be comparable to a carefully designed modern SaaS application, with the information architecture of an academic discovery platform.

Use the following design principles:

- A refined academic visual identity.
- Deep navy or charcoal text, warm neutral surfaces, and restrained teal or blue accents.
- Clean typography and a consistent spacing system.
- Clear visual hierarchy.
- Excellent readability for publication titles, research descriptions, and long text.
- Subtle borders, restrained shadows, and polished hover and focus states.
- Consistent badges for application status and availability.
- Thoughtful use of whitespace.
- Responsive cards and tables.
- Small, purposeful animations rather than excessive movement.
- Accessible contrast and visible keyboard-focus states.

Avoid a generic admin dashboard, excessive gradients, unnecessary glassmorphism, large decorative illustrations, and oversized empty cards.

Use consistent design tokens for colors, spacing, border radii, typography, and elevation.

Build reusable components instead of duplicating interface elements across pages.

Include carefully designed loading skeletons, empty states, error states, form validation, success feedback, and responsive navigation.

The site should work on desktops, tablets, and mobile phones.

## 5. APPLICATION STRUCTURE

Use a sensible App Router structure with route groups for public pages and authenticated application pages.

Create a consistent application shell with:

- Responsive sidebar or navigation.
- Institution and profile information where relevant.
- Search access.
- Notification indicator.
- Current-user menu.
- Main content region.
- Floating AI assistant.
- Responsive mobile navigation.

Do not render student-only navigation to professors or administrator-only navigation to ordinary users.

Design the shell for different roles without duplicating the entire application.

## 6. PUBLIC PAGES AND AUTHENTICATION

### Landing page

Create a professional public landing page explaining the product's purpose.

Include:
- A clear headline describing student–professor research discovery.
- A concise explanation of the problem solved.
- A product preview or composed interface mockup built from actual frontend components.
- Feature sections for discovery, collaboration, research documents, and AI guidance.
- A clear sign-in and registration flow.
- A professional footer.

Avoid fake university partnerships, fictional impact statistics, and fabricated testimonials.

### Authentication

Implement:

- Sign up.
- Sign in.
- Email verification handling.
- Password reset.
- Logout.
- Session persistence.
- Loading and error states.
- Appropriate redirect behavior.
- Safe handling of expired or refreshed sessions.

Use Supabase Auth.

The authenticated access token must be attached to calls to FastAPI using the agreed API client.

Create a centralized API client that obtains the current access token, attaches the bearer authorization header, parses responses, and produces consistent typed errors.

Handle 401 responses gracefully, including refreshing the session when appropriate and retrying a request at most once when safe. Do not create infinite refresh loops.

The browser must never receive the Supabase service-role key or Gemini API key. Never rely on a client-side role value as the security authority.

### Onboarding

Create onboarding forms for the supported student and professor workflows.

For students, collect only the information needed to establish their profile and research interests.

For professor applicants, collect the required verification information and clearly communicate that professor access may require approval.

Never allow a user to grant themselves professor or administrator permissions through a form.

Use institution and department choices supported by the backend. Display clear states for pending, approved, rejected, or suspended accounts.

## 7. STUDENT EXPERIENCE

### A. Student dashboard

Build a useful dashboard containing:

- A welcoming header.
- The student's research-interest profile.
- Recommended professors and research projects.
- Reasons each recommendation matches the student's interests or skills.
- Summary of active research requests.
- Request-status indicators.
- Recent conversation activity.
- Unread message and notification counts.
- Quick actions for discovering research and managing documents.

Every item must come from the backend or the authenticated user's permitted data.

Do not calculate or display fake application statistics.

If data is unavailable, display a useful empty state or a recoverable error.

### B. Professor discovery page

Build a dedicated professor exploration experience.

Include:
- Search by name, research keyword, and relevant academic terms.
- Institution and department filters.
- Research-interest filters.
- Advertised availability filters.
- Sorting supported by the backend.
- Responsive professor cards.
- Pagination or an appropriate load-more interaction.

Each card should display available information such as:
- Professor name and academic title.
- Department and institution.
- Research interests.
- Short biography.
- A concise selection of publications.
- Advertised supervision availability and last-updated information if available.
- Open research opportunities.
- A clear action to view the complete profile.

Make the availability label precise. Distinguish open to applications, limited openings, full capacity, and unknown availability if the backend supports those states.

Do not equate an enabled account with available supervision capacity.

### C. Professor profile detail

Create a comprehensive academic profile page.

Organize it into clear sections or tabs:

1. Overview.
2. Research interests.
3. Ongoing research.
4. Publications.
5. Advertised openings.
6. Supervision requirements.
7. Availability and expected commitment.

Display DOIs and external publication links when available.

Use an excellent publication-list layout that remains readable when titles, author lists, or abstracts are long.

Only show information authorized for the viewer.

Provide a clear research-request call to action when the student is eligible to contact the professor.

### D. Research request form

Build a polished, validated application form.

Include appropriate fields for:
- Selected professor and optional research project.
- Request subject.
- Motivation statement.
- Relevant skills and previous experience.
- Research interests.
- Proposed weekly availability.
- Supporting document, if supported by the backend.

Help the student write a specific, respectful research request. Show field-level guidance and validation.

Before submission, show a clear review state.

After successful submission, display the actual confirmation and the new request status returned by the backend.

Prevent accidental duplicate submissions through loading states and server-confirmed responses.

Do not fabricate successful submission when the server returns an error.

### E. Student request management

Create a request list and a request-detail page.

Display:
- Professor and associated project.
- Date submitted.
- Current status.
- Status history when supported.
- Request details.
- Professor responses.
- Additional-information requests.
- Conversation history.
- Permitted actions, such as withdrawal.

Use accessible status labels and ensure the UI reflects the latest backend state.

## 8. PROFESSOR EXPERIENCE

### A. Professor dashboard

Create a separate dashboard for verified professors.

Include:
- Research profile completion.
- Current projects and advertised openings.
- Incoming research requests.
- Pending decisions.
- Accepted students or collaborations where the backend supports them.
- Recent messages and unread indicators.
- Recent publication or project activity.
- A quick action for updating advertised supervision availability.

Distinguish application counts, actual active collaborations, and advertised capacity. Do not merge these into a misleading single number.

### B. Academic profile editor

Create a complete profile editor that allows professors to manage the fields permitted by the backend.

Include:
- Name and academic title where editable.
- Biography.
- Institution and department display.
- Research interests.
- Skills or preferred student prerequisites.
- Office information when provided.
- Advertised availability.
- Supervision capacity information.
- Relevant profile links.
- Profile visibility if supported.

Use correct save, cancel, validation, and error behavior.

Do not let professors edit protected institutional assignments, administrator-controlled fields, or another professor's profile.

### C. Publication management

Build a publication-management interface.

Professors must be able to:
- Add a publication.
- Edit an existing publication.
- Add an abstract, authors, year, venue, DOI, and URL.
- Associate a permitted PDF when supported.
- View publication details.
- Delete publications with an appropriate confirmation step.

Use a good empty state for new professors without publications.

### D. Research-project management

Create forms and list views for creating, editing, publishing, closing, or archiving research opportunities according to backend capabilities.

Include:
- Project title.
- Research problem.
- Description.
- Research interests.
- Expected prerequisites and skills.
- Duration.
- Commitment.
- Working arrangement.
- Available openings.
- Application deadline.
- Eligibility criteria.

Make publication state explicit. Unsaved forms must never be displayed as published opportunities.

### E. Incoming requests and decisions

Create an applicant-management interface with request cards or a searchable table.

Allow professors to review each request, read the student's submitted information, open authorized supporting documents, and respond.

Implement only actions supported by the backend:
- Review.
- Accept.
- Reject.
- Request additional information.
- Open the request-specific conversation.

Ask for confirmation on consequential actions when appropriate. Show an explicit success or error state after the server responds.

Do not perform application decisions solely through local UI state.

## 9. REQUEST-SPECIFIC REALTIME MESSAGING

Build a polished two-part messaging experience: an inbox and an individual conversation view.

The interface should include:
- Conversation list.
- Professor or student identity.
- Relevant request or project context.
- Last message preview.
- Unread state.
- Timestamp.
- Message history.
- Message composer.
- Send/loading states.
- Read state where supported.
- Responsive mobile layout.

Use FastAPI endpoints to load conversation data and persist messages.

For realtime updates, integrate Supabase Realtime using authorized subscriptions and the project's actual RLS policies. Subscribe only to relevant tables or channels, and filter events by the appropriate conversation or request.

Do not make private channels public to solve subscription problems.

Handle reconnection, duplicate events, and subscription cleanup. If realtime is unavailable, provide a reasonable polling fallback or a clear degraded state.

A sent message must not appear as permanently delivered before the server confirms persistence. An optimistic display is acceptable only when failure can be rolled back or clearly shown.

Never expose messages from another request or institution.

## 10. DOCUMENT LIBRARY AND RESEARCH PAPERS

Build a dedicated document library and paper-detail experience.

Include:
- Authorized document upload.
- Upload progress.
- File type and file-size validation.
- Document metadata.
- Ownership and permitted visibility.
- Document detail view.
- Summary generation.
- Summary display.
- Ask-a-question action.
- Download or preview using the authorized backend flow.
- Delete action when permitted.

Initially prioritize PDFs because they are the principal research-paper format.

After selecting an authorized paper, students and professors should be able to request an AI summary and see clear loading, success, retry, and failure states.

Present the structured summary in a readable academic layout, including:
- Plain-language overview.
- Research problem.
- Methodology.
- Findings.
- Claimed contributions.
- Limitations.
- Key terms.
- Prerequisites.
- Potential follow-up work.
- Suggested next steps.
- Questions to discuss with a professor.

Display only fields returned by the backend. Never invent missing results or present speculative AI output as fact.

Support summary caching through the backend's actual summary endpoint. Do not send the Gemini API key or directly call Gemini from the browser.

## 11. FLOATING GEMINI AI ASSISTANT

This feature is central to the product.

Build a persistent, floating AI assistant button positioned in the bottom-right corner of the application.

When clicked, open a compact but polished assistant panel. It should not cover the entire site or make the primary workflows difficult to use.

Support a collapsible panel, a clear close control, a conversation history, a message composer, and helpful loading and failure states.

The assistant should support contextual conversation about:
- The current professor profile.
- The current research project.
- A selected or authorized research paper.
- The user's research interests.
- Research preparation and next steps.
- Preparing a professor-contact request.

Examples of questions:
- "Explain this paper in simple English."
- "What is the main problem being solved?"
- "What do I need to learn before trying this research?"
- "Which parts of this methodology are important?"
- "What questions should I ask the professor?"
- "How can I prepare a research proposal for this opening?"

Send messages to the actual FastAPI Gemini endpoint.

Use the backend-supported conversation ID and document-context fields. Do not invent an independent chat backend or send unauthorized document content from the browser.

When opened on a paper page, provide a context action such as "Ask about this paper." When opened on a professor page, provide a context action such as "Understand this professor's research."

Clear or switch context deliberately when the user changes papers or profiles. Make the active context visible so that users understand what the assistant is discussing.

Render returned text safely. Do not dangerously inject raw HTML returned by the AI.

The assistant must not invent professor availability, application results, publications, or approvals.

## 12. NOTIFICATIONS

Build a notification center with:
- Unread count.
- Notification list.
- Relevant date and time.
- Read/unread states.
- Mark as read.
- Mark all as read when supported.
- Navigation to the relevant request, message, or project.

Use the backend notification endpoints and permitted realtime events.

Do not implement browser notifications without a clear user-facing permission flow.

## 13. ADMINISTRATOR EXPERIENCE

Create a protected administration interface for authorized administrators.

Include:
- Pending professor verification requests.
- Professor approval and rejection.
- Institution and department management.
- Account status management.
- Relevant reports or audit views when the backend supports them.

Clearly indicate pending reviews and completed decisions.

Implement confirmation steps before sensitive actions.

The interface may hide admin-only routes for other users, but backend authorization remains mandatory.

Never trust a user role supplied by a browser request or local storage.

## 14. API CLIENT AND FRONTEND ARCHITECTURE

Create a maintainable structure similar to:

frontend/
  app/
  components/
    layout/
    ui/
    professors/
    publications/
    projects/
    requests/
    messaging/
    documents/
    ai/
    notifications/
  features/
  hooks/
  lib/
    api/
    supabase/
    auth/
    validation/
    utils/
  types/
  public/
  tests/
  .env.example

Use the actual backend contract to build a typed API layer.

Keep network calls outside presentational components where practical.

Use reusable query hooks, explicit loading states, controlled cache invalidation, and safe error handling.

Use Server Components for suitable noninteractive layouts and content. Use Client Components where state, event handling, realtime subscriptions, forms, or browser APIs are necessary.

Keep secret-dependent logic out of browser bundles.

Use semantic HTML, accessible labels, keyboard navigation, appropriate modal focus handling, and meaningful screen-reader text.

Avoid unnecessary global state. Introduce a shared state-management library only if a real requirement justifies it.

## 15. FORMS, ERRORS AND EMPTY STATES

Every interactive control must work.

For all forms:
- Validate fields.
- Display field-specific errors.
- Disable submission when appropriate.
- Show pending state during requests.
- Handle API validation errors.
- Preserve user input where safe.
- Show clear success or failure feedback.

For all data-heavy pages:
- Provide loading skeletons.
- Handle an empty result set.
- Handle network and server failures.
- Offer a retry action where sensible.
- Provide pagination and filter-reset actions when applicable.

Do not silently swallow errors.

Do not display fake success messages.

If the user's session expires, show an appropriate sign-in flow without losing safe unsaved work unnecessarily.

## 16. NO FAKE DATA OR PLACEHOLDER FUNCTIONALITY

Do not leave critical buttons as no-ops.

Do not use hardcoded arrays of fictional professors, applications, publications, or notifications in the actual application.

Temporary fixtures are allowed only in isolated tests or explicitly labeled development previews.

The integrated application must load records from FastAPI.

If an endpoint is unavailable, report the missing contract instead of silently replacing it with local mock data.

Do not implement persistent application data in localStorage. Local storage may be used for harmless presentation preferences, but not as the source of truth for accounts, permissions, requests, messages, documents, or application status.

## 17. PERFORMANCE AND RELIABILITY

Implement:
- Search debouncing where useful.
- Pagination.
- Proper list keys.
- Appropriate image sizing and optimization.
- Sensible caching and invalidation.
- Request cancellation when appropriate.
- Safe handling of rapid repeat actions.
- Responsive layouts.
- Clean subscription lifecycles.
- Error boundaries or equivalent localized failure handling.
- Appropriate metadata and page titles.

Avoid loading entire document histories or unbounded result sets at once.

Use deterministic empty and error states instead of an interface that silently breaks when one panel's API request fails.

## 18. VERCEL DEPLOYMENT

Prepare the frontend for Vercel deployment.

Create a frontend `.env.example` containing placeholders for the actual variables required by the implementation.

Expected public variables will usually include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or the current publishable-key equivalent used by the project.
- `NEXT_PUBLIC_API_BASE_URL`

Keep server-only values unprefixed and out of client bundles. Never expose the Supabase service-role or secret key or the Gemini API key.

Document the exact environment variables that need to be set for local development, Vercel previews, and production.

Support a deployed API base URL without hardcoding localhost into the production build.

Document the required FastAPI CORS origin, Supabase Auth site URL, and allowed redirect URLs.

Verify that the application can build successfully using the installed dependency versions and the documented setup.

## 19. TESTING AND ACCEPTANCE CRITERIA

Write tests for the most important frontend behavior, using appropriate unit, component, or browser tests.

Cover at least:
- Login and logout states.
- Authentication-protected route behavior.
- Role-specific navigation.
- Student professor discovery.
- Search and filters.
- Professor profile rendering.
- Research request submission and validation.
- Professor request decisions.
- Conversation rendering and message failures.
- Realtime subscription cleanup.
- PDF upload validation.
- Summary generation and error handling.
- AI conversation context.
- Notifications.
- Permission-related API errors.

Verify the core workflows end to end where a backend test environment is available.

Do not claim that external integrations were tested unless they were actually exercised.

## 20. DEFINITION OF DONE

The frontend is complete when:

- The application builds successfully.
- Authentication works with Supabase.
- Student, professor, and administrator experiences are distinct.
- Professor discovery and profiles use real backend data.
- Publications and research projects can be managed according to permissions.
- Research request submission and status management work.
- Request-specific messaging is connected to the backend.
- Authorized document uploads and paper summaries work.
- The floating Gemini assistant supports contextual conversations.
- Notifications are integrated.
- Responsive and accessible UI states are implemented.
- No critical action is a dummy button.
- The environment setup and Vercel deployment instructions are documented.
- The frontend and backend API contracts agree.
- The tests are executed, and reproducible failures are fixed.

At the end, provide:
1. The actual pages and features implemented.
2. The resulting file structure.
3. The commands for local development.
4. The automated tests run and their actual results.
5. Any remaining backend dependencies.
6. Any remaining manual Supabase configuration.
7. Exact Vercel deployment steps.

Begin by inspecting the completed backend and its API contract. Then implement the full frontend in a sequence that preserves working functionality and finishes with a real integration check.