# PERMANENT DESIGN & LOGIC RULES
# "The Constitution" of the project.
# DO NOT MODIFY these rules without explicit user override.

## 1. Party Colors & Logic (Sejm Map)
- **Konfederacja**: MUST be Navy (`#142544`). Never Orange. Never Slate.
- **Polska 2050**: MUST be Yellow (`#eab308`).
- **Logic**: `getPartyColor` must check "Konfederacja" BEFORE "KO" to avoid substring matching errors.
- **Display**: In "Partie" mode, tooltips must NOT show vote results (Za/Przeciw).
- **Stability**: Sejm Hemicycle structure must be stable and render immediately (skeleton dots) even if data is loading. No "Wczytywanie..." flickers.

## 2. Data & Performance
- **Pagination**: The main Votes Archive (`VotesList`) MUST use server-side pagination with a limit of 100 items per chunk to maintain performance.
- **Consistency**: The ordering of votes in MP profiles MUST strictly match the ordering in the main archive (Date DESC, Voting Number DESC).
