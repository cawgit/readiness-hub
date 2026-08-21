# CAP Readiness Hub

![Version](https://img.shields.io/badge/version-1.16.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A Google Apps Script web application for Civil Air Patrol units to track member readiness, cadet progression, senior member qualifications, and emergency services status.

Designed primarily for Wings and below, this tool provides dashboards and analytics based on CAPWATCH data exports.

## Features

- **Home Dashboard** - At-a-glance overview of unit health and key metrics
- **Senior Member Dashboard** - Education & Training levels (1-5), ES qualifications, promotions
- **Cadet Dashboard** - Rank progression, phase milestones, HFZ tracking, achievements
- **Unit Overview** - Staff coverage, duty position tracking, recruiting/retention metrics
- **ES Readiness** - Emergency Services team composition, qualification tracking, skill evaluator coverage
- **Org Chart** - Visual organizational hierarchy with metrics overlay
- **Reports & Export** - PDF and data exports for unit analysis

## Try It Now (Preview)

Want to see the Readiness Hub in action before setting up the full version? A **browser-based preview** is available at:

**[https://cap-miwg.github.io/readiness-hub/](https://cap-miwg.github.io/readiness-hub/)**

1. Export your CAPWATCH data as a ZIP file
2. Open the preview link above
3. Click **Import** and upload your ZIP file
4. Browse all dashboards with your real data

The preview runs entirely in your browser — no data is uploaded to any server. It updates automatically with each new release.

> **Note:** The preview version is read-only and does not include data sync, feedback submission, or other features that require a Google Apps Script backend. For the full experience, follow the setup instructions below.

## Screenshots

### Home Dashboard
![Home Dashboard](screenshots/Home.png)

### Unit Overview
![Unit Overview](screenshots/Unit%20Overview.png)

### Senior Member Dashboard
![Senior Dashboard](screenshots/Senior%20Dashboard.png)

### Senior Member Profile
![Senior Profile](screenshots/Senior%20Profile.png)
![Senior Profile Details](screenshots/Senior%20Profile%202.png)

### Cadet Dashboard
![Cadet Dashboard](screenshots/Cadet%20Dashboard.png)

### Cadet Profile
![Cadet Profile](screenshots/Cadet%20Profile.png)
![Cadet Profile Details](screenshots/Cadet%20Profile%202.png)

### ES Skill Tree
![ES Skill Tree](screenshots/ES%20Skill%20Tree.png)

### Org Chart
![Org Chart](screenshots/Org%20Chart.png)

### Reports
![Reports](screenshots/Reports.png)

## Prerequisites

- Google Workspace account
- Access to CAPWATCH data exports for your unit
- A Google Drive folder with your CAPWATCH exports (automated daily sync recommended)

## Quick Start

### 1. Copy the Project Files

Copy the Apps Script project files to a new Google Apps Script project:
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy only the `.html` and `.gs` files from the **root** of this repository into the project

> **Important:** Do **NOT** copy the `offline/` folder, `.github/` folder, or any non-`.html`/`.gs` files. Those are build infrastructure for the [browser-based preview version](https://cap-miwg.github.io/readiness-hub/) and are not part of the Apps Script project.

### 2. Configure Required Settings

Configuration is stored securely in Script Properties (not in the code):

1. In the Apps Script editor, select `setupScriptProperties` from the function dropdown
2. Click **Run** to initialize the default property structure
3. Go to **Project Settings** (gear icon) > **Script Properties**
4. Edit these required properties:

| Property | Description | Example |
|----------|-------------|---------|
| `SOURCE_FOLDER_ID` | Google Drive folder ID with CAPWATCH exports | `1ABC...xyz` |
| `DB_SPREADSHEET_ID` | Google Sheet ID for data storage | `1DEF...abc` |
| `APP_NAME` | Full display name for your unit | `Michigan Wing Readiness Hub` |
| `APP_SHORT_NAME` | Short name for header bar and browser tab | `Readiness Hub` |

**Finding IDs:**
- **Folder ID**: Open your Drive folder, copy from URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
- **Spreadsheet ID**: Create a new Google Sheet, copy from URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

**Optional Configuration Properties:**

| Property | Description | Default |
|----------|-------------|---------|
| `LOGO_DRIVE_FILE_ID` | Google Drive file ID for logo image | (no logo) |
| `DB_SHEET_NAME` | Name of the data sheet tab | `DB` |
| `LOGS_SHEET_NAME` | Name of the logs sheet tab | `Logs` |
| `GITHUB_OWNER` | GitHub username/org for feedback | - |
| `GITHUB_REPO` | Repository name for feedback | `readiness-hub` |
| `GITHUB_TOKEN` | Personal access token (add manually) | - |
| `CAPWATCH_ORGID` | CAP organization ID for auto-download | - |

**Finding Logo File ID:**
- Upload your logo image to Google Drive
- Right-click > Share > Change to "Anyone with the link can view"
- Copy the file ID from URL: `https://drive.google.com/file/d/{FILE_ID}/view`

**Utility Functions:**
- `setupScriptProperties()` - Initialize default property values
- `showCurrentConfig()` - Display current configuration (masks sensitive values)

### 3. Run Initial Data Sync

1. In the Apps Script editor, select `syncDriveToSheet` from the function dropdown
2. Click **Run**
3. Authorize the required permissions when prompted
4. Wait for the sync to complete (check the Execution Log)

### 4. Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Select type: **Web app**
3. Configure:
   - Execute as: **Me**
   - Who has access: **Anyone with access** (or restrict to your organization)
4. Click **Deploy** and copy the web app URL

> Want the hub to appear in the Google Workspace App Launcher (the nine-dot grid)? See [Optional: Add to the Google Workspace App Launcher](#optional-add-to-the-google-workspace-app-launcher) below.

### 5. Set Up Automated Sync (Recommended)

1. In Apps Script, click the clock icon (Triggers)
2. Click **+ Add Trigger**
3. Configure:
   - Function: `syncDriveToSheet`
   - Event source: Time-driven
   - Type: Hour timer
   - Interval: Every hour
4. Save

### 6. Help the Hub Recognize Who Signs In (Optional)

The hub opens on the signed-in user's own unit, so people land on their squadron
instead of on wing HQ. It identifies them in this order, stopping at the first
match:

1. The CAP ID on their Google Workspace account (**Directory** > **Users** >
   *user* > **User information** > **Employee ID / external IDs**). Label the ID
   `CAPID` if you keep other numbers there too.
2. The email address on their CAPWATCH member record. Members who list their
   Workspace address in eServices are matched without any admin setup.
3. The unit number in their org unit path, if your OU tree names its units for
   their charters (`/CA-001/CA-010/CA-111` resolves to unit 111).

None of this is a permission check — every unit stays selectable, and this only
decides which one is showing on arrival. Accounts that match nothing, including
service accounts and staff assigned above the wing, open on wing HQ.

## CAPWATCH Data Requirements

The app expects these CAPWATCH export files in your source folder:

### Configuration Files
- `PL_Paths.txt` - Level path definitions
- `PL_Groups.txt` - Task groups
- `PL_Tasks.txt` - Task definitions
- `PL_TaskGroupAssignments.txt` - Task-to-group mappings
- `CdtAchvEnum.txt` - Cadet achievement enumeration
- `Achievements.txt` - ES achievement catalog
- `Tasks.txt` - ES task definitions
- `AchvStepTasks.txt` - ES achievement prerequisites
- `AchvStepAchv.txt` - ES achievement dependencies

### Member Data Files
- `Member.txt` - Member demographics
- `Organization.txt` - Unit/organization hierarchy
- `DutyPosition.txt` - Senior member duty assignments
- `CadetDuty.txt` - Cadet duty assignments
- `SeniorLevel.txt` - Legacy senior level completions
- `SpecTrack.txt` - Specialty track enrollments
- `MbrCommittee.txt` - Committee assignments
- `MbrContact.txt` - Member contact info
- `MbrAchievements.txt` - Member ES achievements
- `MbrTasks.txt` - Member ES task completions
- `PL_MemberTaskCredit.txt` - Member task completions
- `PL_MemberPathCredit.txt` - Member path progress

### Cadet-Specific Files
- `CadetRank.txt` - Cadet rank history
- `CadetAchv.txt` - Cadet achievements
- `CadetAchvAprs.txt` - Cadet achievement approvals
- `CadetActivities.txt` - Cadet activity participation
- `CadetHFZInformation.txt` - Physical fitness test results
- `CadetPhase.txt` - Phase progression
- `CadetAwards.txt` - Cadet awards

### Additional Files
- `Training.txt` - Training records
- `SeniorAwards.txt` - Senior member awards
- `OFlight.txt` - Orientation flight records
- `ORGStatistics.txt` - Organizational statistics

## Optional: GitHub Feedback Integration

The app includes an optional feedback feature that creates GitHub issues. To enable:

1. Create a GitHub personal access token with `repo` scope
2. In Apps Script: Go to **Project Settings** (gear icon) > **Script Properties**
3. Add/edit these properties:

| Property | Value |
|----------|-------|
| `GITHUB_TOKEN` | Your personal access token |
| `GITHUB_OWNER` | Your GitHub username or organization |
| `GITHUB_REPO` | Repository name (default: `readiness-hub`) |

**Optional IT Chatbot Integration:**

If you have an IT chatbot that should be notified of new issues, add these properties:

| Property | Value |
|----------|-------|
| `CHATBOT_WEBAPP_URL` | URL to your IT chatbot web app |
| `CHATBOT_API_KEY` | API key for the chatbot |

## Optional: CAPWATCH Auto-Download

If you don't already have CAPWATCH files being placed in your `SOURCE_FOLDER_ID` folder (e.g., via [gsuite-automation](https://github.com/cap-miwg/gsuite-automation) or manual upload), the app can download CAPWATCH data directly from the CAP eServices API.

### Setup

1. In Apps Script: Go to **Project Settings** > **Script Properties**
2. Set `CAPWATCH_ORGID` to your organization ID (e.g., `223` for Michigan Wing)
3. In the Apps Script editor, select `setCapwatchAuthorization` from the function dropdown and click **Run**
4. Enter your eServices username and password when prompted
5. Test by selecting `getCapwatch` and clicking **Run** — files should appear in your `SOURCE_FOLDER_ID` folder

### Automated Daily Download + Sync

To schedule daily automatic downloads:

1. In the Apps Script editor, select `setupCapwatchTrigger` from the function dropdown
2. Click **Run** — this creates a daily trigger at 4 AM Eastern (3 AM CST)
3. The trigger downloads fresh CAPWATCH data, then syncs it to the database sheet

The trigger time avoids the CAPWATCH API daily blackout window (12:00–2:30 AM CST).

> **Note:** If you already have a separate `syncDriveToSheet` hourly trigger, you can keep both. The download+sync trigger handles the full pipeline; the hourly sync trigger provides additional refresh cycles throughout the day.

| Property | Description | Example |
|----------|-------------|---------|
| `CAPWATCH_ORGID` | Your CAP organization ID | `223` |

**Credentials** are stored per-user in UserProperties (not in Script Properties). Each admin who needs to run the download must set their own credentials via `setCapwatchAuthorization()`.

## Optional: Add to the Google Workspace App Launcher

To put the hub in the nine-dot App Launcher next to Gmail and Drive, publish it as a **private Google Workspace Marketplace listing** with a Web App integration. There is no setting inside Apps Script or in this repository that does it — the launcher only shows Marketplace-installed apps, so this is entirely a Cloud console + Admin console task, done once per domain by a Workspace super admin.

> **Read this first:** step 1 attaches the script to a standard Cloud project and **cannot be undone**. Every user has to re-authorize afterward, and the Admin SDK APIs behind `AdminDirectory` / `AdminReports` must be re-enabled by hand. Do it when you can tolerate a short outage, not mid-drill-weekend.

### 1. Move the script to a standard Cloud project

1. In the [Cloud console](https://console.cloud.google.com), create a project (or pick an existing one) and note its **Project number** under **Project settings**
2. Enable the **Admin SDK API** in that project — the `AdminDirectory` and `AdminReports` advanced services stop working without it
3. In the Apps Script editor, go to **Project Settings** > **Google Cloud Project** > **Change project**, enter the project number, and click **Set project**

### 2. Configure the OAuth consent screen

In the Cloud console under **APIs & Services** > **OAuth consent screen**, set the user type to **Internal** and fill in the app name, support email, and developer contact.

### 3. Enable and configure the Marketplace SDK

1. Enable the **Google Workspace Marketplace SDK** (not the Marketplace *API*) for the project
2. Open the SDK's **App Configuration** tab and set:

| Field | Value |
|-------|-------|
| App visibility | **Private** — restricts install to your domain. **This choice is permanent.** |
| App integration | **Web App** |
| Universal navigation URL | Your deployed web app URL (the `/exec` link from step 4 of the Quick Start) |
| OAuth scopes | The same scopes listed in `appsscript.json` |

3. Fill in the **Store Listing** tab: name, description, developer info, and icons at **96x96** and **48x48** pixels
4. Save the draft, then **Publish**

Private listings skip Google's review queue, so publishing is immediate.

### 4. Install it for your domain

In the [Admin console](https://admin.google.com), go to **Apps** > **Google Workspace Marketplace apps** > **Apps list** > **Add app** > **Private apps**, select the listing, and install it for everyone or for specific organizational units. The icon appears in the App Launcher for those users, usually within a few minutes.

### Notes

- Because the deployment executes as **the deploying user**, members opening the hub from the launcher will not see a separate consent prompt — the tile is effectively a managed shortcut to the web app URL.
- Update the universal navigation URL in the Marketplace SDK whenever you create a *new* deployment rather than updating the existing one, or the tile will point at the old version.
- Users can hide or reorder launcher tiles themselves; admins control which apps are installed, not where each user's icons sit.

## Optional: Cadet Rank Insignia Images

The cadet dashboard displays rank insignia. By default, these use placeholder Google Drive image IDs.

To use your own images:
1. Upload rank insignia images to Google Drive
2. Make them viewable by anyone with the link
3. Update the `CADET_RANK_INSIGNIA` object in `ConfigConstants.html` with your file IDs

To disable images, set the values to empty strings.

## CAP Terminology Glossary

### Rank Structure
- **Officer ranks**: 2d Lt, 1st Lt, Capt, Maj, Lt Col, Col
- **Enlisted ranks**: SSgt, TSgt, MSgt, SMSgt, CMSgt
- **Cadet ranks**: C/AB (entry grade, no insignia) and C/Amn through C/Col

### Cadet Program
- **Phases I-IV**: Learning, Leadership, Command, Executive. Spaatz is the capstone award after Phase IV, not a fifth phase — `CADET_PHASES` carries it as bucket 5 purely so it gets its own block on the progress timeline
- **Milestones**: Wright Brothers (4), Billy Mitchell (10), Amelia Earhart (14), Ira C. Eaker (20), Carl A. Spaatz (21)
- **HFZ**: Healthy Physical Fitness zone test
- **TIG**: Time in Grade (56 days minimum between ranks; none from C/AB to C/Amn, which CAPVA 60-100 lists as "Upon Joining")

### Senior Member Programs
- **Levels 1-5**: Professional development pathway
- **Specialty Tracks**: Additional certifications (AE, CP, ES, etc.)

### Emergency Services
- **GES**: General Emergency Services (foundational qualification)
- **SET**: Skills Evaluator Training
- **Team types**: Ground Teams, Aircrew, sUAS, Mission Base, Command Staff
- **Status**: ACTIVE, TRAINING, EXPIRED

## Troubleshooting

### "Database sheet not found" error
Run `syncDriveToSheet` manually from the Apps Script editor.

### Data not updating
- Check that CAPWATCH files are in your source folder
- Verify the sync trigger is running (check Executions in Apps Script)
- Clear the app cache by running `syncDriveToSheet` again

### Slow initial load
The first load after sync may take a few seconds to build the cache. Subsequent loads will be faster.

### Missing CAPWATCH files
The app logs warnings for missing files but continues to function. Check the Apps Script execution logs for details.

## Versioning

This project uses [Semantic Versioning](https://semver.org/) (Major.Minor.Patch):

- **Major**: Significant changes that may alter workflows or require re-deployment
- **Minor**: New features and enhancements (backward-compatible)
- **Patch**: Bug fixes and small tweaks

Current version: **1.16.1** (defined in `ConfigConstants.html`)

### Release Process

1. Update `APP_VERSION` in `ConfigConstants.html`
2. Commit all changes
3. Create an annotated git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z: description"`
4. Push the tag: `git push origin vX.Y.Z`
5. Create a GitHub Release from the tag with release notes

### Changelog

See [GitHub Releases](https://github.com/cap-miwg/readiness-hub/releases) for a detailed changelog of each version.

## Contributing

Issues and pull requests are welcome! Please:
1. Open an issue to discuss major changes
2. Follow the existing code style
3. Test your changes with actual CAPWATCH data

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built for the Civil Air Patrol volunteer community to help units track readiness and member development.

---

*This project is not officially affiliated with Civil Air Patrol National Headquarters.*
