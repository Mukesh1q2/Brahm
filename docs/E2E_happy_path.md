# E2E happy path checklist

1) Chat → ethics badge/revise
- Open /chat
- Send a prompt that triggers a sensitive content check in the Mind stub
- Verify: assistant bubble shows Ethics: revise chip
- Click “View reasoning” → revision suggestion text is visible
- Click “Apply revision” → input is populated and sent (auto-apply on next time when toggled)

2) Save semantic → search in dashboard
- On a message bubble, click “Save semantic”
- Expect transient status (Saved semantic or Retrying… then Saved)
- Open /console/consciousness
- Go to Search tab, type a query and optionally add labels
- Click Search
- Expect results with matching content
- If backend is unreachable, the “search” status chip shows down

3) View council timeline
- In Chat, trigger a response with metadata envelope including workspace { spotlight, deliberation_trace, votes }
- The right-side panel Council tab appears automatically with:
  - Spotlight name
  - Trace cards per strategy
  - Votes with Δ from average and compact mode toggle
- Open the dashboard Workspace tab
  - See spotlight frequency and curiosity histogram
  - Timeline entries appear with timestamps

4) Diary snapshot and Postgres admin
- In the dashboard Overview, click “Record snapshot” (in Diary tab)
- In PG details, click “Get stats” → diary/semantic counts update
- Click “Cleanup 30d (semantic)”, confirm counts drop if records older than 30d exist
- Click “Keep latest N (semantic)”, enter a value (e.g., 1000) and confirm stats reflect change

5) Export/Import diaries
- In Diary tab, click “Export JSON” and download the export
- Modify a copy or reuse the file, then click “Import JSON” and select it
- Expect imported counts in the alert; Refresh to see entries

6) Playback + Charts sanity
- Switch Mode to Playback, scrub the slider, adjust speed
- Confirm Φ sparkline and micro-sparklines render as tokens stream in

7) Optional: E2E hooks
- If NEXT_PUBLIC_E2E_HOOKS=true, ChatComposer may auto-open the Diff tab on mocked envelopes
- Validate telemetry events fire without errors

