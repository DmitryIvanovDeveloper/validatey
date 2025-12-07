# Validatey - Screenshots and Page Descriptions

This document contains screenshots and descriptions of all application pages to demonstrate the functionality.

## 1. Dashboard (Home Page)
**Route:** `/`
**File:** `01-dashboard.png`

**Description:**
The main dashboard displays all user projects in a card-based layout. Each project card shows:
- Project name
- Status badge (Draft, Active, Completed)
- Creation date
- Quick link to view details

Users can create new projects using the "+ Create Project" button. For new users with no projects, an empty state is shown with a welcome message and call-to-action to create the first project.

**Key Features:**
- Overview of all projects at a glance
- Quick access to create new projects
- Project status indicators
- Responsive card layout

---

## 2. Create Project Wizard - Step 1: Define Target Segment
**Route:** `/projects/new`
**File:** `02-create-project-step1.png`

**Description:**
Multi-step wizard for creating a new validation project. Step 1 focuses on defining the target audience segment.

**Fields:**
- **Segment Description:** Text area for describing the target audience in detail (e.g., demographics, behavior, characteristics)
- **Demographics:** Text area for structured demographic information (age, location, profession, income, interests)

**Features:**
- Progress indicator showing all 4 steps
- Helpful placeholder examples in English
- Form validation
- Navigation between steps

---

## 3. Create Project Wizard - Step 2: Formulate Hypothesis
**Route:** `/projects/new` (Step 2)
**File:** `02-create-project-step2.png`

**Description:**
Second step where users define their product hypothesis and underlying assumptions.

**Fields:**
- **Hypothesis Description:** Detailed description of the product hypothesis and problem/solution
- **Assumptions:** Dynamic list of assumptions that support the hypothesis (can add/remove multiple)

**Features:**
- AI Helper button for assistance with formulation
- Dynamic assumption list management
- Clear instructions and examples

---

## 4. Create Project Wizard - Step 3: Edit Scenario
**Route:** `/projects/new` (Step 3)
**File:** `02-create-project-step3.png` (visual mode), `02-create-project-step3-json.png` (JSON mode)

**Description:**
Third step displays the AI-generated survey scenario based on the segment and hypothesis from previous steps.

**Features:**
- **Visual Mode (Default):** Questions displayed in user-friendly cards showing:
  - Question number and text
  - Question type (scale, open text, multiple choice)
  - Required/optional indicator
  - Options for scale questions
  - Clean, readable format
- **JSON Mode:** Technical JSON view for advanced editing
  - Formatted JSON with syntax highlighting
  - Real-time JSON validation
  - Error messages if JSON is invalid
- Automatic scenario generation via AI
- Regenerate button to create a new scenario
- Toggle button to switch between visual and JSON views

**Note:** 
- Scenario is automatically generated when reaching this step, creating the project in the background
- The visual mode is shown by default for better user experience
- If JSON parsing fails, an error message is displayed with instructions
- **Note on language:** The generated scenario questions may appear in Russian depending on the LLM service configuration, even though the interface is in English. This is a backend/LLM service configuration issue, not a frontend error.

---

## 5. Create Project Wizard - Step 4: Audience & Payment
**Route:** `/projects/new` (Step 4)
**File:** `02-create-project-step4.png`

**Description:**
Final step for configuring project launch parameters.

**Fields:**
- **Project Name:** Final name for the project
- **Audience Size:** Number of respondents (recommended: 100-200)
- **Price per Response:** Cost per completed survey response

**Features:**
- Real-time cost calculation
- Price summary showing total project cost
- Recommendations for audience size
- Complete button to finish project creation

---

## 6. Project Details
**Route:** `/projects/:projectId`
**File:** `03-project-details.png`

**Description:**
Detailed view of a specific project showing all information entered during creation.

**Sections:**
- **Project Overview:**
  - Project name
  - Status (Draft, Active, Completed)
  - Creation and update dates
- **Segment:** Full description and demographics
- **Hypothesis:** Hypothesis description and all assumptions
- **Scenario:** Generated survey scenario (if available)

**Navigation:**
- Back to Projects
- Manage Invitations
- Progress (project statistics)
- Report (analysis and insights)

**Features:**
- Complete project information display
- Quick navigation to related pages
- Clear section organization

---

## 7. Project Progress
**Route:** `/projects/:projectId/progress`
**File:** `04-project-progress.png`

**Description:**
Real-time statistics and progress tracking for a project.

**Metrics Displayed:**
- Total invitations sent
- Responses received
- Completion rate
- Response rate
- Early signals and trends

**Features:**
- Visual progress indicators
- Response statistics
- Time-based analytics
- Early signal detection

---

## 8. Project Report
**Route:** `/projects/:projectId/report`
**File:** `05-project-report.png`

**Description:**
Comprehensive analysis and validation report for the project.

**Report Sections:**
- **Verdict:** Overall validation result (Validated/Invalidated/Needs More Data)
- **Key Metrics:**
  - Validation score
  - Confidence level
  - Response quality
- **Cluster Analysis:** Respondent segments and patterns
- **Alternative Interpretations:** Different ways to interpret the data
- **Recommendations:** Actionable insights and next steps

**Features:**
- AI-generated insights
- Data visualization
- Actionable recommendations
- Export capabilities

---

## 9. Invitation Manager
**Route:** `/projects/:projectId/invitations`
**File:** `06-invitation-manager.png`

**Description:**
Manage invitations and track respondent participation.

**Features:**
- Generate invitation links
- View invitation status
- Track sent invitations
- Monitor response rates
- Copy invitation links
- Send invitations via email (if integrated)

**Information Displayed:**
- Total invitations
- Sent vs. pending
- Response tracking
- Invitation links with tokens

---

## 10. Survey View (Respondent)
**Route:** `/survey/:token`
**File:** `07-survey-view.png`

**Description:**
The survey interface that respondents see when they click on an invitation link.

**Features:**
- Progress bar showing completion status
- Question-by-question navigation
- Multiple question types:
  - Scale questions (1-5 or 1-10)
  - Open text questions
  - Multiple choice
  - Audio recording (if enabled)
- Back/Next navigation
- Auto-save functionality
- Completion confirmation

**User Experience:**
- Clean, distraction-free interface
- Mobile-responsive design
- Clear instructions
- Progress indication

---

## 11. Projects List
**Route:** `/projects`
**File:** `08-projects-list.png`

**Description:**
Alternative list view of all projects (if different from dashboard).

**Features:**
- Simple list layout
- Project links
- Quick navigation
- Filter and search capabilities (if implemented)

---

## 12. Not Found (404)
**Route:** Any invalid route
**File:** `09-not-found.png`

**Description:**
Error page displayed when a user navigates to a non-existent route.

**Features:**
- Friendly error message
- Navigation back to home
- Helpful links

---

## Application Flow

### Creating a Project:
1. Dashboard → Click "Create Project"
2. Step 1: Define Segment → Fill in audience details
3. Step 2: Formulate Hypothesis → Enter hypothesis and assumptions
4. Step 3: Edit Scenario → Review/Edit AI-generated scenario
5. Step 4: Audience & Payment → Set parameters and complete

### Managing a Project:
1. Dashboard → Click on project card
2. Project Details → View full information
3. Invitation Manager → Generate and send invitations
4. Progress → Monitor responses in real-time
5. Report → View analysis and insights

### Responding to Survey:
1. Respondent receives invitation link
2. Clicks link → Opens Survey View
3. Answers questions step by step
4. Completes survey → Gets confirmation

---

## Technical Notes

- All pages are responsive and mobile-friendly
- UI is translated to English
- Modern, clean design with consistent styling
- Loading states and error handling throughout
- Real-time updates where applicable
- AI integration for scenario generation and analysis

