# Smoke test instructions (manual)

# Flag on/off
# 1) With NEXT_PUBLIC_GLOBAL_MODEL_SELECTOR=true, run `npm run dev` and verify header selector visible only in Expert.
# 2) With NEXT_PUBLIC_GLOBAL_MODEL_SELECTOR=false, restart dev server, verify header selector absent; page pickers work.

# Mode gating
# Toggle Expert in header and confirm visibility changes.

# Precedence
# Set global=gpt-4o-mini; Panini override=gpt-4o.
# Verify network requests via browser DevTools (or console telemetry badges):
# - Panini uses X-Model: gpt-4o
# - Console/Canvas use X-Model: gpt-4o-mini
# Clear override; Panini falls back to global.

# Router semantics
# Set global=auto; helper text shows "Default model (router may escalate)"; requests include X-Model: auto.

# A11y sanity
# Focus on header select and check visible outline; ensure label present; contrast acceptable.

