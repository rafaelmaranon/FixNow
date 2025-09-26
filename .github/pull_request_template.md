## What changed
- [ ] Agent loop (HA → DA → CA)
- [ ] Event schema
- [ ] API endpoints
- [ ] UI wiring

## Event schema touched?
- [ ] Added/changed fields:
  - [ ] `audience` set (homeowner | contractor | both)
  - [ ] `contractorId` when applicable
  - [ ] `jobId` always present
- [ ] Emit via `addEvent(...)` only

## Demo reliability
- [ ] Publish → RFO → Offer → Select → Award tested
- [ ] Booking {arrivalByIso} shown with countdown
- [ ] Contractor "Agent Feed" shows summaries (no homeowner raw text)

## Multi-Agent Collaboration Checklist
- [ ] **Homeowner Agent**: Voice/photo analysis → job publishing
- [ ] **Dispatcher Agent**: RFO broadcasting → offer collection → award management
- [ ] **Contractor Agent**: Bid generation → multiple personas (fast vs budget)
- [ ] **Event Flow**: Real-time collaboration visible in Agent Activity Ticker
- [ ] **Booking System**: Live countdown with contractor details

## Code Quality
- [ ] TypeScript types consistent across frontend/backend
- [ ] No secrets exposed in commits
- [ ] Error handling for async multi-agent flows
- [ ] Race condition prevention in offer selection
- [ ] CORS and security headers configured

## Demo Testing
- [ ] Voice interaction: "My kitchen sink is leaking badly"
- [ ] Agent ticker shows: Published → RFO → Offers → Award
- [ ] Booking banner appears with live countdown
- [ ] Contractor details and contact information
- [ ] Job status updates across all views
