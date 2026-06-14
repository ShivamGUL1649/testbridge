# TestBridge Project Context

## Project

TestBridge is an online testing platform.

## Tech Stack

- React
- TypeScript
- Vite
- Supabase
- Cloudflare Pages

## Local Path

E:\Exam_System\exam-system

## Live URLs

- https://testbridge.pages.dev
- https://www.testsbridge.co.in

## Important Rules

- Give complete replacement files only, not partial snippets.
- Use Windows PowerShell commands.
- Do not change database role values:
  - TUTOR
  - STUDENT
  - ADMIN
- Frontend labels should show:
  - Tutor → Test Creator
  - Student → Test Taker
  - Exam/Exams → Test/Tests
- Routes and file names can remain:
  - /tutor
  - /student
  - /admin
  - TutorDashboard.tsx
  - StudentDashboard.tsx
- Do not rename database tables/columns:
  - exams
  - exam_questions
  - exam_attempts
  - exam_id
  - student_id

## Latest Completed Work

- Frontend labels changed from Tutor/Student/Exam to Test Creator/Test Taker/Test.
- Navbar UI issue fixed.
- CSS issue fixed by restoring original CSS structure and adding only required latest classes.
- Build passed locally.

## Important UI Fix

The UI became plain HTML after navbar/CSS changes.

Root causes:
- Navbar class names were changed.
- App.css was using older working class names.
- CSS/cache confusion happened during local testing.

Final working approach:
- Keep original CSS structure.
- Navbar should use existing classes like:
  - navbar-brand
  - navbar-brand-icon
  - nav-link
  - user-pill
- App.css must start directly with:

:root {

- App.css must not contain markdown fences like:

```css