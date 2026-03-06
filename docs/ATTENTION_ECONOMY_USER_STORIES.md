# Attention Economy User Stories

## Onboarding and "Attention Economy" Setup
How new users first learn the game rules.

### USER STORY 1.1 (Registration and First Currency)

As a (as) indie creator (Segment A),
I want to (I want) receive a welcome bonus (e.g., 5 credits) upon registration and immediately see an explanation that "1 credit = 5 minutes of quality feedback",
So that (so that) I understand the platform's economy and can make my first request, even without having done anything yet.

### USER STORY 1.2 (Role Separation)

As a (as) system,
I want to (I want) determine user type during registration (indie / team) through a simple question ("Are you here to exchange feedback or hire respondents for your team?"),
So that (so that) I can set up different interfaces and rules for them (for Segment B — immediately offer subscription, for Segment A — include in credit system).

## 2. Creating Feedback Request (Credit Spending)
How users ask for help.

### USER STORY 2.1 (Task Publication)

As a (as) indie creator,
I want to (I want) create a "validation request", selecting its type (survey, prototype link, invitation to 15-min interview) and specifying how many credits (time) I'm willing to pay for a quality response,
So that (so that) my task is visible in the feed, and I attract respondents motivated by my "credit-worthiness".

### USER STORY 2.2 (Request Structuring)

As a (as) product manager (Segment B) using a paid account,
I want to (I want) create a task with extended settings (target audience: "PMs in B2B SaaS only", attach NDA, use hypothesis template),
So that (so that) I get relevant and secure feedback that meets corporate standards.

## 3. Searching and Completing Tasks (Credit Earning)
How users "pay with time" to gain the ability to ask themselves.

### USER STORY 3.1 (Tasks Feed)

As a (as) indie creator with empty credit wallet,
I want to (I want) see a feed of open requests from other users, filtered by topics I'm interested in (e.g., "EdTech", "Mobile Apps"),
So that (so that) I can choose a task that would be interesting and easy for me to provide feedback on, and earn credits.

### USER STORY 3.2 (Feedback Giving Process)

As a (as) user completing a task,
I want to (I want) follow the link/take the survey/schedule an interview, and after completion click "Feedback Given",
So that (so that) the system automatically credits me with the promised credits, and the task author receives notification.

### USER STORY 3.3 (Quality Verification)

As a (as) task author,
I want to (I want) rate the received feedback (like/dislike) within 24 hours,
So that (so that) the platform can block spammers and low-quality "helpers", and credits for poor feedback can be returned to me (author) or burned.

## 4. Matching and Execution (Closing the Loop)
How the system connects supply and demand.

### USER STORY 4.1 (Automatic Matching for Segment B)

As a (as) product manager with paid subscription,
I want to (I want) create a task and select "Find respondents for me" option, specifying budget in credits (which I purchased with money),
So that (so that) the system automatically sends push notifications to suitable (by profile) and active Segment A users, motivating them to respond faster.

### USER STORY 4.2 (Fast Exchange for Segment A)

As a (as) indie creator,
I want to (I want) receive notification: "User X just gave feedback on your survey. Your credits have been deducted. Want to also check what they posted?",
So that (so that) the "you-me, me-you" cycle closes faster, and I feel the fairness of the exchange.

## 5. Retention and Premium Features (Monetization and Growth)
How to motivate users to stay and pay.

### USER STORY 5.1 (Segment A Needs Escalation)

As a (as) active indie user who has earned many credits,
I want to (I want) be able to exchange my credits for "priority display" of my task in the feed or access to "experts" pool (e.g., PMs from Segment B),
So that (so that) I can get feedback faster and better quality, even if my credit balance allows me to do so.

### USER STORY 5.2 (Hybrid Purchase for Segment A)

As a (as) indie creator in a hurry,
I want to (I want) have a button "Buy 10 credits for $5" without giving feedback,
So that (so that) I can urgently get responses when I don't have time to help others.

### USER STORY 5.3 (Influence Dashboard)

As a (as) any user,
I want to (I want) see my "influence profile": how many feedbacks I've given, how many received, my quality rating,
So that (so that) I have a reputation, and my requests inspire more trust from others.

## Flow Visualization

Here is how these stories assemble into screen logic:

**Flow for Segment A (Indie):**

Main screen: Balance: 15 credits.

Action: Want to get feedback.

Task creation screen: Specify topic, set price of 5 credits.

System: Checks balance (15 > 5). Reserves 5 credits. Task goes to feed.

Feed screen (for others): See task with 5 credit reward.

Another user: Completes task (takes survey).

System: Deducts 5 credits from author, credits 5 credits to executor.

Author: Receives notification "New feedback! Rate quality to unlock funds for executor".

**Flow for Segment B (Team):**

Main screen: Subscription status "Business Pro".

Action: Create research.

Creation screen: Fill hypothesis template, check "Requires NDA", select "Respondents with rating >4.5 only".

System: Calculates cost in credits (or shows "Included in your 50 interviews/month package").

Publication: Task goes not to general feed, but to "premium feed" and with priority notifications to active Segment A users.

Respondent (Segment A): Sees task, completes, receives increased reward (e.g., +10 credits instead of normal 5).

Team (Segment B): Receives structured report and interview recordings.