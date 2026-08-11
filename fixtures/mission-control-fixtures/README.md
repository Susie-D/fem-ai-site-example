# Fictional workshop data

Every name, message, email, event, task, deadline, channel, and URL in this folder is fabricated for a publicly shareable workshop. None of the files contains information from a real Slack workspace, Gmail inbox, Google Calendar, company, customer, colleague, or private task history.

All datasets use the same fixed reference time, `2026-08-11T09:30:00-05:00`, and the `America/Chicago` time zone. IDs are stable so that refreshing a source does not duplicate its tasks.

- `slack.json` contains fictional read-only channel messages.
- `gmail.json` contains fictional read-only email previews using `example.com`.
- `calendar.json` contains fictional meetings and focus blocks.
- `tasks.json` seeds every board column, including blockers and waiting-on states.

The app reads these files through shared fixture adapters. Refresh inserts missing fixture records, preserves existing task statuses, and never overwrites user-created manual tasks. Reset deliberately restores the original fictional dataset.
