# Agency Simulator - Testing Scenarios

## 🔧 Pre-Test Setup
- [ ] Server running (Render: https://agency-simulator.onrender.com)
- [ ] Client running (Vercel: https://agency.rapid-learn.co.uk)
- [ ] Open browser console to watch for errors

---

## 1. ACCESS CONTROL

### 1.1 Player Access (No Code Required)
- [ ] Load the app - should see landing page immediately (no access gate)
- [ ] "Join as Player" tab is default selected
- [ ] Can enter Game ID and Agency Name without any code

### 1.2 Facilitator Access Code
- [ ] Click "Facilitator" tab
- [ ] Should see access code input (not game creation form)
- [ ] Enter wrong code → "Invalid access code" error
- [ ] Enter correct code (`AMBER2025`) → Shows game creation form
- [ ] Refresh page → Should still be authenticated (session storage)
- [ ] Contact message shows "chris@rapid-learn.co.uk"

---

## 2. GAME CREATION (Facilitator)

### 2.1 Create Game
- [ ] Select number of teams (2-8)
- [ ] Select game length (4/6/8 quarters)
- [ ] Click "Create Game"
- [ ] Alert shows Game ID and quarter length
- [ ] Redirected to Facilitator View
- [ ] Shows "Waiting for teams to join"

### 2.2 Facilitator View
- [ ] Shows Game ID prominently
- [ ] Shows current quarter (Q1)
- [ ] Team connection status panel visible
- [ ] "Process Quarter" button visible (disabled until teams submit)

---

## 3. PLAYER JOIN FLOW

### 3.1 Join Game
- [ ] Enter valid Game ID (from facilitator)
- [ ] Enter Agency Name
- [ ] Click "Join Game"
- [ ] Successfully joins and sees game board
- [ ] Header shows: Agency name, Team number, Game ID
- [ ] Stats bar shows: Cash (£400k), Rep (60), Staff (20), Utilisation (~69%), Burnout, Clients (6)

### 3.2 Invalid Join
- [ ] Enter invalid Game ID → Error message
- [ ] Enter empty agency name → Should not submit

### 3.3 Test Mode
- [ ] Click "Quick Test Mode" 
- [ ] Creates single-player game instantly
- [ ] Auto-advances quarters after submit

---

## 4. GAME BOARD UI

### 4.1 Header Stats
- [ ] Cash displays with £ and smart formatting (£400k not £400000)
- [ ] Reputation shows /100
- [ ] Staff count correct (20)
- [ ] Utilisation shows percentage with color coding
- [ ] Burnout shows percentage
- [ ] Clients count correct (6)

### 4.2 Tabs
- [ ] "Quarterly Results" tab - empty on Q1, shows data after processing
- [ ] "Agency Metrics" tab - shows charts/metrics
- [ ] "Client Pipeline" tab - shows 6 starter clients
- [ ] "Notifications" tab - shows game messages

### 4.3 Client Pipeline Tab
- [ ] Shows all 6 starter clients
- [ ] Each client shows: Name, Service type badge, Budget, Hours, Satisfaction %, Quarters remaining
- [ ] Satisfaction colors: Green (good), Yellow (warning), Red (at risk)
- [ ] No floating point numbers (should be rounded)

---

## 5. INPUT PANEL (Right Side)

### 5.1 Capacity Planning
- [ ] Shows current hours vs capacity bar
- [ ] Shows staff count and hours per staff (520)
- [ ] Color coding for utilisation level

### 5.2 Client Opportunities
- [ ] Shows available opportunities for the quarter
- [ ] Each opportunity shows:
  - [ ] Client name
  - [ ] Service type icon/badge
  - [ ] Budget (£)
  - [ ] Hours required
  - [ ] Win chance badge (e.g., "65% win")
- [ ] Win chance color: Green (≥70%), Yellow (≥50%), Red (<50%)

### 5.3 Existing Client Projects (if any)
- [ ] Shows purple "🔄 Existing Client" badge
- [ ] Higher win chances (70-95%)
- [ ] Purple border on tile

### 5.4 Selecting Opportunities
- [ ] Click checkbox to select opportunity
- [ ] Selected tile highlights (cyan border)
- [ ] Discount slider appears (0-50%)
- [ ] Quality buttons appear (Budget/Standard/Premium)
- [ ] Can select multiple opportunities

### 5.5 Staffing Section
- [ ] Hire slider (0-5)
- [ ] Shows cost per hire (£15k)
- [ ] Let Go slider (0-5)
- [ ] Shows severance cost (£5k)

### 5.6 Growth Focus Slider
- [ ] Slider from Organic (0) to New Biz (100)
- [ ] Default at 50
- [ ] Labels update as you slide

### 5.7 Investments Section
- [ ] Client Satisfaction spend (slider)
- [ ] Technology spend
- [ ] Training spend
- [ ] Marketing spend
- [ ] Wellbeing spend
- [ ] All show £ values

### 5.8 Budget Summary
- [ ] Shows projected costs
- [ ] Updates as you change inputs
- [ ] Shows if over/under budget

### 5.9 Submit Button
- [ ] "Submit Decisions" button at bottom
- [ ] Click submits inputs
- [ ] Button changes to "Submitted ✓" and disables
- [ ] Can't submit twice

---

## 6. QUARTER PROCESSING

### 6.1 Auto-Advance (All Teams Submitted)
- [ ] When all teams submit, quarter auto-processes
- [ ] No facilitator action needed
- [ ] Results appear for all teams

### 6.2 Results Display
- [ ] "Quarterly Results" tab updates
- [ ] Shows: Revenue, Costs, Profit
- [ ] Shows: Clients won, Clients lost, Clients churned
- [ ] Shows: Staff changes, Reputation change
- [ ] Notifications update with events

### 6.3 Pitch Outcomes
- [ ] Server console shows pitch results (if you have access):
  - `🎯 Pitch for ClientName: winChance=65.0%, roll=42.1, WON!`
- [ ] Won clients appear in Client Pipeline
- [ ] Lost pitches don't add clients

### 6.4 Client Satisfaction
- [ ] Existing clients satisfaction changes
- [ ] Happy clients may generate project opportunities next quarter
- [ ] Unhappy clients (<40%) may churn

---

## 7. MULTI-QUARTER GAMEPLAY

### 7.1 Quarter Progression
- [ ] After Q1 results, Q2 begins
- [ ] New opportunities generated
- [ ] Existing client projects may appear (from happy clients)
- [ ] Events may trigger (Economy changes, etc.)
- [ ] Submit button re-enables

### 7.2 Contract Renewals
- [ ] Clients with 1 quarter remaining show renewal decision
- [ ] Can choose to renew or let expire

### 7.3 Bankruptcy
- [ ] If cash goes negative → Bankruptcy popup appears
- [ ] Shows 💀 "BANKRUPT" message
- [ ] Can dismiss to watch other teams
- [ ] Can't submit decisions anymore

---

## 8. END GAME

### 8.1 Final Quarter
- [ ] After last quarter processes, game ends
- [ ] All players see end game screen

### 8.2 End Game Screen
- [ ] Shows winner celebration (🏆 or 🎉 if you won)
- [ ] Shows "X takes the crown!"
- [ ] Full leaderboard with rankings (🥇🥈🥉)
- [ ] Your team highlighted with amber border
- [ ] Bankrupt teams marked in red
- [ ] Stats for each team: Profit, Cash, Rep, Clients, Staff, Score
- [ ] "Your Performance" summary (if player)
- [ ] "Play Again" button returns to landing

### 8.3 Scoring
- [ ] Score = Profit + (Rep × 1000) + (Clients × 5000)
- [ ] Highest score wins (not just highest profit)

---

## 9. FACILITATOR FEATURES

### 9.1 Team Monitoring
- [ ] Shows all teams and their status
- [ ] Shows who has submitted
- [ ] Shows connection status (connected/disconnected)

### 9.2 Manual Controls
- [ ] "Process Quarter" button (if needed)
- [ ] "End Game" button

### 9.3 Debrief Prompts
- [ ] Facilitator sees discussion prompts
- [ ] Prompts relevant to team situations
- [ ] Different prompts each quarter

### 9.4 Leaderboard
- [ ] Shows rankings during game
- [ ] Updates after each quarter

---

## 10. CONNECTION & RECONNECTION

### 10.1 Disconnect/Reconnect
- [ ] Close browser tab
- [ ] Reopen and navigate back to game
- [ ] Should auto-reconnect with session token
- [ ] State preserved (same quarter, same inputs)

### 10.2 Connection Indicator
- [ ] Green dot = connected
- [ ] Red dot = disconnected/connecting

---

## 11. EDGE CASES

### 11.1 Stress Tests
- [ ] Submit with no pitches selected → Should work (just no new clients)
- [ ] Submit with max hiring → Check budget
- [ ] Submit with all sliders at max → Check budget limits

### 11.2 Game Length Scaling
- [ ] 4-quarter game: Contracts scale down
- [ ] 8-quarter game: Full contract lengths
- [ ] Starter client contracts shouldn't exceed game length

### 11.3 Multiple Browsers
- [ ] Open same game in two browsers
- [ ] Join as different teams
- [ ] Both see each other's status in facilitator view
- [ ] Quarter advances when both submit

---

## 12. VISUAL/UI CHECKS

### 12.1 Branding
- [ ] Amber Group logo displays on landing page
- [ ] Orange/amber color scheme throughout
- [ ] Fonts rendering correctly

### 12.2 Responsive
- [ ] Works on desktop (primary)
- [ ] Readable on tablet
- [ ] Mobile may be cramped but functional

### 12.3 Dark Theme (Game Board)
- [ ] Good contrast on all text
- [ ] Buttons clearly visible
- [ ] Selected states obvious

---

## 🐛 Known Issues to Watch For

1. **Pitch not winning** - If 0% win rate, check server console for field mismatch
2. **NaN in displays** - Floating point not rounded
3. **Utilisation stuck low** - Check client hours are correct (should start ~69%)
4. **No existing client projects** - Need happy clients (45%+ satisfaction)
5. **CORS errors** - Check Vercel URL is in server CORS config

---

## ✅ Sign-Off

| Test Area | Tester | Date | Pass/Fail | Notes |
|-----------|--------|------|-----------|-------|
| Access Control | | | | |
| Game Creation | | | | |
| Player Join | | | | |
| Game Board UI | | | | |
| Input Panel | | | | |
| Quarter Processing | | | | |
| Multi-Quarter | | | | |
| End Game | | | | |
| Facilitator | | | | |
| Reconnection | | | | |
| Edge Cases | | | | |
| Visual/UI | | | | |

---

*Last updated: January 2025*
