# TestBridge AI Continuation Context

## Project Name

TestBridge

## Product Purpose

TestBridge is a professional online testing platform where:

- Test Creator creates tests
- Admin reviews and approves/rejects tests
- Test Taker attempts approved tests
- Test Taker can view result, pass/fail status, score, percentage, and answer review

## Tech Stack

- React
- TypeScript
- Vite
- Supabase
- Cloudflare Pages
- GitHub

## Local Project Path

E:\Exam_System\exam-system

## Production URLs

- https://testbridge.pages.dev
- https://www.testsbridge.co.in

## Important Instruction for Future ChatGPT Work

Always provide complete replacement files only.

Do not provide partial snippets unless explicitly asked.

Use Windows PowerShell commands.

## Very Important Product Label Rules

Database role values must NOT be changed:

- TUTOR
- STUDENT
- ADMIN

Frontend labels must show:

- Tutor -> Test Creator
- Student -> Test Taker
- Exam -> Test
- Exams -> Tests

Routes and filenames should remain unchanged for now:

- /tutor
- /student
- /admin
- TutorDashboard.tsx
- StudentDashboard.tsx
- TutorExamsPage.tsx
- StudentAvailableExamsPage.tsx

Do not rename database tables or columns:

- exams
- exam_questions
- exam_attempts
- exam_id
- student_id
- created_by

These internal names are okay because they are technical/database names.

## Current Hosting Status

The app is connected to Cloudflare Pages.

Cloudflare Pages auto deploys after git push.

After every push, test:

- https://testbridge.pages.dev
- https://www.testsbridge.co.in

Use hard refresh:

Ctrl + Shift + R

## Latest Completed Functional Work

### Frontend Labels Updated

User-facing text was changed:

- Tutor -> Test Creator
- Student -> Test Taker
- Exam/Exams -> Test/Tests

This was applied across:

- LoginPage.tsx
- RegisterPage.tsx
- Navbar.tsx
- TutorDashboard.tsx
- StudentDashboard.tsx
- TutorExamsPage.tsx
- CreateExamPage.tsx
- AddQuestionsPage.tsx
- StudentAvailableExamsPage.tsx
- ExamAttemptPage.tsx
- StudentResultsPage.tsx
- StudentResultReviewPage.tsx
- AdminDashboard.tsx
- AdminPendingExamsPage.tsx
- App.tsx

## Latest UI Issue and Fix

### Problem

After navbar changes, the UI looked like plain HTML and CSS appeared broken.

### Investigation

The original CSS used these working class names:

- navbar-brand
- navbar-brand-icon
- navbar-links
- navbar-user
- nav-link
- user-pill

A new Navbar.tsx introduced different class names:

- brand-logo
- brand-icon
- brand-text
- user-chip
- user-chip-content
- user-role-badge

This caused navbar layout and style mismatch.

Also there was confusion with browser cache and CSS loading.

### Final Working Approach

Keep original CSS structure and support both old and new classes where needed.

Navbar should preferably use original working classes:

- navbar-brand
- navbar-brand-icon
- nav-link
- user-pill

App.css must start directly with:

:root {

App.css must NOT contain markdown fences like:

```css