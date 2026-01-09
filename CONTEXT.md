# Agency Simulator - Development Context

## Overview
A multiplayer business simulation game where teams run a creative agency, making strategic decisions about client acquisition, staffing, investments, and growth. Built for corporate training workshops facilitated by The Amber Group.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.IO
- **Deployment:** Vercel (client) + Render (server)

## Production URLs
- **Client:** https://agency-simulator.vercel.app
- **Server:** https://agency-simulator.onrender.com

## Game Mechanics

### Starting Position
- 6 starter clients (3x £100k, 2x £200k, 1x £500k retainers)
- 20 staff members
- £400k cash
- 60/100 reputation
- ~69% utilization (7,200 hrs work / 10,400 hrs capacity)
- 520 hours per staff member per quarter

### Client Satisfaction
- Varies by starter client (55-80%)
- Affected by: client satisfaction spend, burnout levels, over/under capacity
- Below 40% = at risk of churning
- Happy clients (45%+) generate project opportunities

### Opportunities
- **New Clients:** Generated each quarter, various win chances (35-65% base)
- **Existing Client Projects:** Generated from satisfied clients, higher win chances (70-95%)
- Win chance affected by: discount offered, quality level, reputation, tech/training levels, burnout, events

### Key Decisions Each Quarter
1. **Pitches:** Select opportunities, set discount (0-50%), choose quality (Budget/Standard/Premium)
2. **Staffing:** Hire (£15k each) or let go (£5k severance)
3. **Growth Focus:** Slider between Organic (existing clients) and New Biz
4. **Investments:** Client satisfaction spend, Technology, Training, Marketing, Wellbeing

### Financial Model
- Revenue from client retainers (quarterly)
- Costs: Staff salaries, investments, hiring/severance
- Profit = Revenue - Costs
- Bankruptcy if cash goes negative

### Game Configuration
- 4/6/8 quarter options
- 2-8 teams
- Contract lengths scale to game duration
- Random events add variety (Economy Tanks, Viral Trend, AI Boom, etc.)

## Key Files

### Server
- `server/src/index.ts` - Main server, socket handlers, game flow
- `server/src/game/engine.ts` - Core game logic, quarter processing
- `server/src/game/opportunities.ts` - Client opportunity generation
- `server/src/game/initialState.ts` - Starter clients and team setup
- `server/src/game/events.ts` - Random event system
- `server/src/types.ts` - TypeScript interfaces

### Client
- `client/src/App.tsx` - Main app, landing page, socket connection
- `client/src/components/GameBoard.tsx` - Main game UI wrapper
- `client/src/components/InputPanel.tsx` - Decision inputs (right panel)
- `client/src/components/Dashboard.tsx` - Team dashboard view
- `client/src/components/FacilitatorView.tsx` - Facilitator controls & prompts
- `client/src/components/Tabs/` - Results, Metrics, Clients, Notifications

## Features Built Today

### Core Gameplay
- [x] Quarter-based turn system
- [x] Pitch system with discount/quality per opportunity
- [x] Win chance calculation with multiple factors
- [x] Existing client project opportunities (from satisfied clients)
- [x] Client satisfaction and churn mechanics
- [x] Contract renewal system
- [x] Staffing decisions (hire/fire)
- [x] Multiple investment categories
- [x] Growth focus slider
- [x] Random market events
- [x] Bankruptcy detection

### Facilitator Features
- [x] Game creation (teams, quarters)
- [x] Real-time team status monitoring
- [x] Auto-process when all teams submit
- [x] Manual advance option if needed
- [x] 100+ varied facilitation prompts
- [x] Leaderboard view
- [x] Debrief data export

### UI/UX
- [x] Amber Group branding and colors
- [x] Smart currency formatting (£1.2m not £1200k)
- [x] Win chance badges on opportunities
- [x] Existing client project badges (purple)
- [x] Service type badges on clients
- [x] Utilization in header bar
- [x] Tab-based navigation
- [x] Dark theme with good contrast
- [x] Test mode for solo practice
- [x] Full end-game screen with leaderboard
- [x] Winner celebration
- [x] Bankruptcy popup and indicators

### Technical
- [x] Session persistence (reconnection support)
- [x] Contract scaling based on game length
- [x] Seeded random for reproducibility
- [x] WebSocket real-time updates
- [x] Production deployment config

## Bug Fixes Applied
- `discount` vs `discountPercent` field mismatch (pitches never won)
- Floating point display in client stats
- Unused variable TypeScript errors
- CORS configuration for production
- LeaderboardEntry missing fields

## Constants to Remember
- **520 hours/staff/quarter** - Must match in engine.ts, InputPanel.tsx, Dashboard.tsx
- Complexity hours: Low (100-200), Medium (200-400), High (350-600)
- Starter client hours: £100k=600hrs, £200k=1200hrs, £500k=3000hrs

## Future Considerations
- End game summary/debrief screen
- Historical comparison between quarters
- More detailed financial breakdown
- Team chat/messaging
- Save/load game state
- Custom event creation for facilitators
