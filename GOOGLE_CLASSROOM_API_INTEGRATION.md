# Google Classroom API Integration for Reviewer Organizer

## Context
Reviewer Organizer is a React + Vite + TypeScript PWA with Supabase backend.
This task adds Google Classroom as an **import source**: authenticated students
can pull their enrolled courses, coursework, and materials (including downloadable
PDFs and lesson content) into their Reviewer Organizer subjects.

**Auth model:** OAuth 2.0 via Google Identity Services (GIS). This is NOT
Windows NTLM, not cookie-based, not `-UseDefaultCredentials`. The user clicks
a popup, logs into Google, approves scopes, and the browser receives an access
token directly. No backend, no credential files, no cookie jars.

---

## Architecture: Tiered Import Strategy

Because university GSuite admins may block third-party OAuth apps, this
integration uses a **tiered fallback system**. Implement ALL tiers. The UI
should attempt Tier 1 first; if blocked, offer Tier 2; if that is also
blocked, offer Tier 3. Tier 4 already exists in the app.

```
Tier 1: Google Classroom API (OAuth) ......... best UX, real-time
  |  blocked by admin?
Tier 2: Google Drive API only (OAuth) ........ often less restricted
  |  also blocked?
Tier 3: Manual file import (ZIP/PDF upload) .. always works, no auth
  |  user prefers even simpler?
Tier 4: Manual PDF upload .................... already implemented
```

---

## Step 0: Google Cloud Project Setup (HUMAN TASK, Codex cannot do this)

Marvin must complete these steps in the browser before any code works.
Codex should verify `.env.local` has `VITE_GOOGLE_CLIENT_ID` set before
attempting any Google API calls. If missing, show a setup prompt to the user.

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or reuse existing).
3. **Enable APIs** (APIs & Services > Library):
   - Google Classroom API (required for Tier 1)
   - Google Drive API (required for Tier 1 file downloads AND Tier 2)
4. **Create OAuth 2.0 Credentials:**
   - APIs & Services > Credentials > Create Credentials > OAuth client ID.
   - Application type: **Web application**.
   - Authorized JavaScript origins:
     - `http://localhost` (required by Google for local dev)
     - `http://localhost:5173` (Vite dev server)
     - `https://burgosmarvin79-cyber.github.io` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (dev)
     - `https://burgosmarvin79-cyber.github.io/reviewer-organizer/` (production)
   - Copy the **Client ID**. You do NOT need the client secret for a browser SPA.
5. **Configure OAuth Consent Screen:**
   - User type: **External**.
   - App name: "Reviewer Organizer"
   - Scopes to add (all readonly):
     ```
     https://www.googleapis.com/auth/classroom.courses.readonly
     https://www.googleapis.com/auth/classroom.coursework.me.readonly
     https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly
     https://www.googleapis.com/auth/drive.readonly
     ```
   - Test users: add the university Gmail (e.g., `marvin@university.edu.ph`).
   - Leave in **Testing** mode (max 100 test users, no Google verification needed).
6. **Update project files:**

   `.env.local` (do NOT commit this file):
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

   `.env.example` (commit this):
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```

   `.gitignore` (verify `.env.local` is listed; it should already be).

---

## Step 1: Install Dependencies

```bash
npm install @react-oauth/google
```

- Package: `@react-oauth/google` v0.13.5 (1.1M weekly downloads, MIT license)
- Wraps Google Identity Services SDK for React
- Provides `GoogleOAuthProvider`, `useGoogleLogin`, scope helpers
- Supports implicit flow (access token returned to browser, no backend needed)
- CORS verified: `classroom.googleapis.com` returns proper `access-control-allow-origin`
  headers for any origin including `localhost`

No other packages needed. All API calls use native `fetch()`.

---

## Step 2: Add Google OAuth Provider

### `src/main.tsx`

Wrap the existing app tree with `GoogleOAuthProvider`. Place it OUTSIDE
the Supabase auth provider but INSIDE React StrictMode.

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// In the render tree:
<React.StrictMode>
  <GoogleOAuthProvider clientId={googleClientId}>
    {/* existing Supabase provider and App */}
  </GoogleOAuthProvider>
</React.StrictMode>
```

**Guard:** If `googleClientId` is empty string, `GoogleOAuthProvider` will
not crash but `useGoogleLogin` will fail silently. The import UI component
(Step 5) must check for this and show "Google Classroom not configured" instead
of the connect button.

---

## Step 3: Google Classroom Auth Hook

### `src/hooks/useGoogleClassroom.ts`

```ts
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { useState, useCallback, useRef } from 'react';

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

const DRIVE_ONLY_SCOPES =
  'https://www.googleapis.com/auth/drive.readonly';

export type ImportTier = 'classroom' | 'drive-only' | 'manual';

interface UseGoogleClassroomReturn {
  isAuthenticated: boolean;
  activeTier: ImportTier;
  error: string | null;
  login: () => void;
  loginDriveOnly: () => void;
  logout: () => void;
  fetchClassroomApi: (endpoint: string) => Promise<any>;
  fetchDriveFile: (fileId: string) => Promise<Blob>;
  fetchDriveList: (query: string) => Promise<any>;
}

export function useGoogleClassroom(): UseGoogleClassroomReturn {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<ImportTier>('manual');
  const [error, setError] = useState<string | null>(null);
  const tokenExpiresAt = useRef<number>(0);

  const handleSuccess = (
    tier: ImportTier,
    tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>
  ) => {
    setAccessToken(tokenResponse.access_token);
    setActiveTier(tier);
    setError(null);
    // Google implicit tokens expire in 3600s; track for UX
    tokenExpiresAt.current = Date.now() + (tokenResponse.expires_in ?? 3600) * 1000;
  };

  const handleError = (err: Pick<TokenResponse, 'error_description'> | undefined) => {
    const msg = err?.error_description || 'Google login failed';
    // Detect admin block: Google returns "access_denied" or "disallowed_useragent"
    if (msg.includes('access_denied') || msg.includes('disallowed')) {
      setError('blocked');
    } else {
      setError(msg);
    }
  };

  // Tier 1: Full Classroom + Drive scopes
  const login = useGoogleLogin({
    scope: CLASSROOM_SCOPES,
    onSuccess: (res) => handleSuccess('classroom', res),
    onError: handleError,
    onNonOAuthError: (err) => {
      if (err.type === 'popup_closed') {
        setError('Popup closed before completing sign-in');
      } else {
        setError('popup_failed');
      }
    },
  });

  // Tier 2: Drive-only scope (fallback if Classroom scope is admin-blocked)
  const loginDriveOnly = useGoogleLogin({
    scope: DRIVE_ONLY_SCOPES,
    onSuccess: (res) => handleSuccess('drive-only', res),
    onError: handleError,
    onNonOAuthError: (err) => setError(err.type || 'popup_failed'),
  });

  const logout = useCallback(() => {
    setAccessToken(null);
    setActiveTier('manual');
    setError(null);
    tokenExpiresAt.current = 0;
  }, []);

  const isTokenExpired = useCallback(() => {
    return Date.now() >= tokenExpiresAt.current;
  }, []);

  const authFetch = useCallback(
    async (url: string): Promise<Response> => {
      if (!accessToken) throw new Error('Not authenticated with Google');
      if (isTokenExpired()) {
        setError('token_expired');
        setAccessToken(null);
        throw new Error('Google token expired. Please reconnect.');
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) {
        setError('token_expired');
        setAccessToken(null);
        throw new Error('Google token expired. Please reconnect.');
      }
      return res;
    },
    [accessToken, isTokenExpired]
  );

  // Classroom API (Tier 1 only)
  const fetchClassroomApi = useCallback(
    async (endpoint: string) => {
      const res = await authFetch(
        `https://classroom.googleapis.com/v1/${endpoint}`
      );
      if (res.status === 403) {
        // Classroom API specifically blocked by admin
        const body = await res.json().catch(() => ({}));
        const reason = body.error?.status || '';
        if (reason === 'PERMISSION_DENIED') {
          setError('classroom_blocked');
          throw new Error(
            'Classroom API blocked by university admin. Try Drive-only mode.'
          );
        }
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message || `Classroom API ${res.status}`);
      }
      return res.json();
    },
    [authFetch]
  );

  // Drive file download (Tier 1 and Tier 2)
  const fetchDriveFile = useCallback(
    async (fileId: string): Promise<Blob> => {
      const res = await authFetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
      );
      if (res.status === 403) {
        throw new Error(
          'Cannot download this file. The teacher may have restricted downloads.'
        );
      }
      if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
      return res.blob();
    },
    [authFetch]
  );

  // Drive file listing (Tier 2: browse shared files without Classroom API)
  const fetchDriveList = useCallback(
    async (query: string) => {
      const params = new URLSearchParams({
        q: query,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
        pageSize: '100',
      });
      const res = await authFetch(
        `https://www.googleapis.com/drive/v3/files?${params}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message || `Drive API ${res.status}`);
      }
      return res.json();
    },
    [authFetch]
  );

  return {
    isAuthenticated: !!accessToken,
    activeTier,
    error,
    login,
    loginDriveOnly,
    logout,
    fetchClassroomApi,
    fetchDriveFile,
    fetchDriveList,
  };
}
```

---

## Step 4: Classroom Import Service

### `src/services/classroomImport.ts`

```ts
// ---- Types matching VERIFIED Google Classroom API v1 response shapes ----

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  description?: string;
  courseState: string;        // ACTIVE, ARCHIVED, PROVISIONED, DECLINED, SUSPENDED
  alternateLink?: string;
  teacherFolder?: { id: string; title: string; alternateLink: string };
}

export interface DriveFileRef {
  driveFile: {
    id: string;
    title: string;
    alternateLink: string;
    thumbnailUrl?: string;
  };
  shareMode?: string;
}

export interface ClassroomMaterial {
  driveFile?: DriveFileRef;
  youtubeVideo?: { id: string; title: string; alternateLink: string };
  link?: { url: string; title: string };
  form?: { formUrl: string; title: string; responseUrl: string };
}

export interface ClassroomCoursework {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: ClassroomMaterial[];
  state: string;              // PUBLISHED, DRAFT, DELETED
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  workType?: string;          // ASSIGNMENT, SHORT_ANSWER_QUESTION, MULTIPLE_CHOICE_QUESTION
}

export interface ClassroomCourseWorkMaterial {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  materials?: ClassroomMaterial[];
  state: string;
  alternateLink?: string;
  creationTime?: string;
}

// ---- API fetch functions ----

type FetchApi = (endpoint: string) => Promise<any>;

export async function getCourses(fetchApi: FetchApi): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = [];
  let pageToken = '';
  do {
    const params = `courseStates=ACTIVE&pageSize=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await fetchApi(`courses?${params}`);
    if (data.courses) courses.push(...data.courses);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return courses;
}

export async function getCoursework(
  fetchApi: FetchApi, courseId: string
): Promise<ClassroomCoursework[]> {
  const items: ClassroomCoursework[] = [];
  let pageToken = '';
  do {
    const params = `pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await fetchApi(`courses/${courseId}/courseWork?${params}`);
    if (data.courseWork) items.push(...data.courseWork);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

export async function getCourseMaterials(
  fetchApi: FetchApi, courseId: string
): Promise<ClassroomCourseWorkMaterial[]> {
  const items: ClassroomCourseWorkMaterial[] = [];
  let pageToken = '';
  do {
    const params = `pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await fetchApi(`courses/${courseId}/courseWorkMaterials?${params}`);
    if (data.courseWorkMaterial) items.push(...data.courseWorkMaterial);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

export interface ExtractedFile {
  fileId: string;
  title: string;
  parentTitle: string;
  mimeType?: string;
}

export function extractDriveFiles(
  items: Array<ClassroomCoursework | ClassroomCourseWorkMaterial>
): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const seenIds = new Set<string>();
  for (const item of items) {
    for (const mat of item.materials || []) {
      if (mat.driveFile) {
        const id = mat.driveFile.driveFile.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          files.push({
            fileId: id,
            title: mat.driveFile.driveFile.title,
            parentTitle: item.title,
          });
        }
      }
    }
  }
  return files;
}

export function extractTextContent(
  items: Array<ClassroomCoursework | ClassroomCourseWorkMaterial>
): Array<{ title: string; description: string; links: string[] }> {
  const notes: Array<{ title: string; description: string; links: string[] }> = [];
  for (const item of items) {
    if (!item.description && !(item.materials || []).some((m) => m.link)) continue;
    const links: string[] = [];
    for (const mat of item.materials || []) {
      if (mat.link) links.push(`${mat.link.title || 'Link'}: ${mat.link.url}`);
      if (mat.youtubeVideo)
        links.push(`Video: ${mat.youtubeVideo.title} - ${mat.youtubeVideo.alternateLink}`);
    }
    notes.push({
      title: item.title,
      description: item.description || '',
      links,
    });
  }
  return notes;
}
```

---

## Step 5: Drive-Only Import Service (Tier 2 Fallback)

### `src/services/driveImport.ts`

When Classroom API is admin-blocked but Drive API works, students can browse
their own Drive for course-related files.

```ts
type FetchDriveList = (query: string) => Promise<any>;
type FetchDriveFile = (fileId: string) => Promise<Blob>;

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

// Search for PDFs and documents in student's Drive
export async function searchDriveForPdfs(
  fetchDriveList: FetchDriveList
): Promise<DriveItem[]> {
  const data = await fetchDriveList(
    "mimeType='application/pdf' and trashed=false"
  );
  return data.files || [];
}

// Search by keyword (course name, subject, etc.)
export async function searchDriveByName(
  fetchDriveList: FetchDriveList,
  keyword: string
): Promise<DriveItem[]> {
  const escaped = keyword.replace(/'/g, "\\'");
  const data = await fetchDriveList(
    `name contains '${escaped}' and trashed=false`
  );
  return data.files || [];
}

// Search for files shared with the student (covers Classroom-distributed files)
export async function searchSharedWithMe(
  fetchDriveList: FetchDriveList,
  keyword?: string
): Promise<DriveItem[]> {
  let query = "sharedWithMe=true and trashed=false";
  if (keyword) {
    const escaped = keyword.replace(/'/g, "\\'");
    query += ` and name contains '${escaped}'`;
  }
  const data = await fetchDriveList(query);
  return data.files || [];
}

// Filter to only downloadable PDFs (respect 50MB PRD limit)
export function filterDownloadable(
  files: DriveItem[],
  maxSizeBytes: number = 50 * 1024 * 1024
): DriveItem[] {
  return files.filter((f) => {
    if (f.mimeType !== 'application/pdf') return false;
    if (f.size && parseInt(f.size, 10) > maxSizeBytes) return false;
    return true;
  });
}
```

---

## Step 6: Manual File Import (Tier 3 Fallback)

### `src/services/manualImport.ts`

This handles ZIP file imports and bulk PDF uploads. This tier requires
ZERO Google auth and works regardless of admin restrictions.

```ts
// Accepts a ZIP file, extracts PDFs and JSON metadata
export async function importFromZip(
  zipFile: File
): Promise<{ pdfs: File[]; metadata: Record<string, any>[] }> {
  // Use JSZip (already common in PWAs) or native DecompressionStream
  // For Codex: install JSZip if not present: npm install jszip
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipFile);

  const pdfs: File[] = [];
  const metadata: Record<string, any>[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    if (path.endsWith('.pdf')) {
      const blob = await entry.async('blob');
      const name = path.split('/').pop() || 'document.pdf';
      pdfs.push(new File([blob], name, { type: 'application/pdf' }));
    }

    if (path.endsWith('.json')) {
      const text = await entry.async('text');
      try {
        metadata.push(JSON.parse(text));
      } catch {
        // skip malformed JSON
      }
    }
  }

  return { pdfs, metadata };
}

// Bulk PDF upload from file input (multiple files)
export function validatePdfFiles(
  files: FileList,
  maxSizeMb: number = 50
): { valid: File[]; rejected: Array<{ name: string; reason: string }> } {
  const valid: File[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  const maxBytes = maxSizeMb * 1024 * 1024;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.type !== 'application/pdf') {
      rejected.push({ name: f.name, reason: 'Not a PDF file' });
    } else if (f.size > maxBytes) {
      rejected.push({ name: f.name, reason: `Exceeds ${maxSizeMb}MB limit` });
    } else {
      valid.push(f);
    }
  }

  return { valid, rejected };
}
```

**Additional dependency for Tier 3:**
```bash
npm install jszip
```

---

## Step 7: Import UI Component

### `src/components/GoogleClassroomImport.tsx`

Build the component with this UX flow:

```
┌─────────────────────────────────────────────────┐
│  Import Study Materials                          │
│                                                  │
│  [Connect Google Classroom]  <- Tier 1 attempt   │
│  [Browse Google Drive]       <- Tier 2 fallback  │
│  [Upload Files / ZIP]        <- Tier 3 fallback  │
│                                                  │
│  ─── After Tier 1 auth ───                      │
│  Course: [dropdown of enrolled courses]          │
│                                                  │
│  Materials:                                      │
│  ☑ Lesson 1 - Intro to Algebra (PDF, 2.1MB)    │
│  ☑ Lesson 2 - Linear Equations (PDF, 5.4MB)    │
│  ☐ Quiz 1 - Basic Operations (no file)          │
│  ☑ Study Guide Chapter 1 (PDF, 1.8MB)          │
│                                                  │
│  [Import 3 Selected Items]                       │
│                                                  │
│  ─── Error state (admin blocked) ───            │
│  ⚠ Google Classroom access is restricted by     │
│    your university. Try these alternatives:      │
│  [Browse Google Drive Instead]                   │
│  [Upload Files Manually]                         │
└─────────────────────────────────────────────────┘
```

**Key implementation rules for Codex:**

1. Check `import.meta.env.VITE_GOOGLE_CLIENT_ID` before showing Google buttons.
   If empty, show only Tier 3 (manual upload).

2. When `login()` (Tier 1) returns error `'blocked'` or `'classroom_blocked'`,
   automatically show Tier 2 option with explanation text.

3. When `loginDriveOnly()` (Tier 2) also returns `'blocked'`, show only Tier 3
   with message: "Your university restricts Google app connections. You can
   still import files manually."

4. For Tier 1 (Classroom): call `getCourses()`, let user pick a course, then
   fetch both `getCoursework()` and `getCourseMaterials()` in parallel using
   `Promise.all`. Merge results and show checkboxes.

5. For Tier 2 (Drive-only): show a search box. User types course name or
   keyword. Call `searchSharedWithMe()` to find files teachers shared.
   Also offer `searchDriveForPdfs()` to browse all PDFs.

6. All downloaded files go through the existing `src/db.ts` storage path
   (same as manual PDF upload). Respect the 50MB limit from PRD.

7. Text content (assignment descriptions, links, video references) should
   create notes via the existing notes creation flow in `src/db.ts`.

---

## Step 8: Token Lifecycle Rules

| Scenario | Behavior |
|----------|----------|
| Fresh session | No Google token. Show connect buttons. |
| After successful OAuth | Token stored in React state only. Never in localStorage, never in Supabase, never in IndexedDB. |
| Token expires (~1hr) | `authFetch` detects 401 or checks `tokenExpiresAt`. Sets `error='token_expired'`. UI shows "Session expired, reconnect" button. |
| User closes popup | `onNonOAuthError` fires with `popup_closed`. Show friendly message, do not disable buttons. |
| User revokes in Google settings | Next API call returns 401. Same as token expired. |
| Page refresh | Token is lost (React state). User reconnects when needed. This is intentional for security. |

**Do NOT attempt silent token refresh.** The implicit flow does not support
refresh tokens. `prompt: 'none'` is unreliable (blocked by 3rd-party cookie
restrictions in Safari, Firefox, Brave). Keep it simple: user clicks "Connect"
again when expired.

---

## Step 9: Environment Variables

| Variable | File | Required | Purpose |
|----------|------|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | `.env.local` | For Tier 1 and 2 | OAuth client ID from Google Cloud Console |
| `VITE_SUPABASE_URL` | `.env.local` | Yes | Already exists |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Yes | Already exists |

**No server-side secrets needed.** No `client_secret`. No API key.
The entire flow runs in the browser using the implicit OAuth grant.

---

## Step 10: Testing Checklist

### Tier 1 (Classroom API)
- [ ] `VITE_GOOGLE_CLIENT_ID` missing: only manual upload buttons shown
- [ ] OAuth popup opens with university GSuite consent screen
- [ ] After consent, `GET /v1/courses` returns enrolled courses (check `data.courses` is not undefined)
- [ ] Pagination works: if student has >50 courses, all are loaded
- [ ] Coursework and materials list correctly for a selected course
- [ ] `extractDriveFiles()` deduplicates (same file attached to multiple assignments)
- [ ] Drive `alt=media` downloads PDF successfully
- [ ] 403 on Drive download shows "teacher restricted downloads" message (not a crash)
- [ ] Downloaded PDF saves to Supabase storage under user's bucket
- [ ] Text content (descriptions, links) creates notes in correct subject
- [ ] 50MB limit enforced: files over 50MB are skipped with warning
- [ ] Token expiry after 1 hour shows reconnect prompt (not a crash)
- [ ] Popup closed by user shows friendly message, buttons still work

### Tier 2 (Drive-only fallback)
- [ ] When Tier 1 returns `PERMISSION_DENIED`, UI offers "Browse Google Drive Instead"
- [ ] `loginDriveOnly()` requests only `drive.readonly` scope
- [ ] `searchSharedWithMe()` returns files shared by teachers
- [ ] Search by keyword filters results correctly
- [ ] PDF download and save works same as Tier 1

### Tier 3 (Manual import)
- [ ] ZIP import extracts PDFs and ignores non-PDF files
- [ ] Malformed ZIP shows error message
- [ ] Bulk PDF upload validates file type and size
- [ ] Rejected files shown with reason (not silently dropped)

### Tier transitions
- [ ] Admin blocks Classroom: smooth transition to Tier 2 offer
- [ ] Admin blocks all Google: smooth transition to Tier 3
- [ ] User can always access Tier 3 regardless of Google status

---

## Known Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| University admin blocks third-party OAuth | HIGH (many universities do this) | Tier 1 unusable | Tier 2 and 3 fallbacks. Error detection in hook auto-suggests alternatives. |
| University admin blocks ALL external OAuth | MEDIUM | Tier 1 and 2 unusable | Tier 3 (manual upload) always works. Zero Google dependency. |
| Teacher restricts file downloads in Drive | LOW-MEDIUM | Individual PDFs fail to download | Per-file error handling with skip option. Show which files failed. |
| Google rate limits (100 requests/100s per user) | LOW | Pagination slows down | Unlikely for a single student's data. If hit, add exponential backoff. |
| Token expires mid-import | LOW | Partial import | Track which files succeeded. Show "X of Y imported, reconnect to continue." |
| `@react-oauth/google` breaking change | LOW | Build fails | Pin to `^0.13.5` in package.json. |
| Google Takeout disabled by admin | MEDIUM | Cannot use Takeout as fallback | That is why Tier 3 is manual ZIP/PDF, not Takeout. User creates ZIP themselves. |

---

## API Reference (Verified)

### Google Classroom API v1

| Endpoint | Response Key | Returns |
|----------|-------------|---------|
| `GET /v1/courses?courseStates=ACTIVE&pageSize=50` | `courses`, `nextPageToken` | Array of Course objects |
| `GET /v1/courses/{id}/courseWork?pageSize=100` | `courseWork`, `nextPageToken` | Array of CourseWork objects |
| `GET /v1/courses/{id}/courseWorkMaterials?pageSize=100` | `courseWorkMaterial`, `nextPageToken` | Array of CourseWorkMaterial objects |
| `GET /v1/courses/{id}/announcements?pageSize=100` | `announcements`, `nextPageToken` | Array of Announcement objects (optional) |

### Google Drive API v3

| Endpoint | Returns |
|----------|---------|
| `GET /drive/v3/files/{id}?alt=media` | Raw file bytes (Blob) |
| `GET /drive/v3/files?q=<query>&fields=files(id,name,mimeType,size)` | File metadata list |

### Auth headers for ALL calls
```
Authorization: Bearer <access_token>
```
No API key needed when using OAuth. CORS is fully supported from any origin.

---

## File Summary for Codex

| File | Action | Purpose |
|------|--------|---------|
| `src/main.tsx` | MODIFY | Wrap app with `GoogleOAuthProvider` |
| `src/hooks/useGoogleClassroom.ts` | CREATE | OAuth hook with tiered login, API fetch, token lifecycle |
| `src/services/classroomImport.ts` | CREATE | Classroom API data fetching with pagination and type-safe responses |
| `src/services/driveImport.ts` | CREATE | Drive-only search and filter for Tier 2 fallback |
| `src/services/manualImport.ts` | CREATE | ZIP extraction and bulk PDF validation for Tier 3 |
| `src/components/GoogleClassroomImport.tsx` | CREATE | Import UI with tiered fallback flow |
| `.env.example` | MODIFY | Add `VITE_GOOGLE_CLIENT_ID` |
| `.gitignore` | VERIFY | Ensure `.env.local` is listed |
| `package.json` | MODIFY (auto) | `@react-oauth/google` and `jszip` added by npm install |
