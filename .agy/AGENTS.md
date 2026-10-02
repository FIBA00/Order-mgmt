# Swarm Protocol v2.0

0. **The Golden Rule**: The `project_spec.md` is the absolute source of truth, if a task conflicts with the spec, follow the spec.
1. **Context loading**: Every time you start a task, reread `project_spec.md` to ensure alignment with global goals.
2. **Shared State (`sync.md`)**: Use ONLY for real time coordination, "Locks" (who is editing what right now ), and cross-agent requests.
3. **Private Reports**: Write All your activity and backlog items to your specific report:
   - Frontend Agent -> `frontend_report.md`
   - Backend Agent -> `backend_report.md`
   - Desktop Agent -> `desktop_report.md`
   - QA Agent -> `qa_report.md`

- make sure to write your reports frequently to prevent unnecessary elongated task runs.

4. **Format for Reports**:
   - ## Activity Log: [Date] | [Task] | [Suggested Commit]
   - ## Local Backlog: Tasks found during scan or needed next.
5. **Initial Handoff**: Your very first action must be an audit of your assigned folder to update your report with the "Current State".
