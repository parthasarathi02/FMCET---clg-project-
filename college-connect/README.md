# College Connect - Smart Student & Campus Transport Management System
Mini project: HTML5 + CSS3 + vanilla JS frontend, optional zero-dependency Node backend.
All data is **sample/demonstration data**. Bus location is **simulated**. Fonts (Bricolage Grotesque, Figtree) load from Google Fonts and fall back to system fonts offline.

## Structure
```
college-connect/
  index.html  dashboard.html  academic.html  bus.html  assignments.html
  css/style.css
  js/data.js      <- all sample data (replace with Firestore later)
  js/app.js       <- login, shell, calculations, all 5 modules
  server/server.js  <- optional backend (stores assignment status in data/submissions.json)
  data/           <- backend storage folder
  package.json
```

## Run
**Frontend only (VS Code Live Server):** install the "Live Server" extension, open the folder,
right-click `index.html` -> "Open with Live Server". Assignment status is saved in LocalStorage.

**With backend:** install Node.js 18+, then in the project folder run `node server/server.js`
and open http://localhost:3000. Status is then saved on the server (and mirrored in the browser).

## Demo login
| Student ID | Password | Bus route |
|---|---|---|
| CS2301 | demo123 | Route 1 |
| CS2302 | demo123 | Route 2 |

The login is a demo. Page protection in JavaScript is NOT real security; real protection needs
server-side authorization (Firebase Auth + Firestore security rules).

## Testing checklist
- [ ] Open dashboard.html while logged out -> redirected to login
- [ ] Wrong password shows error; short ID/password shows field errors
- [ ] Show/Hide password works; "Fill demo login" works
- [ ] Login -> dashboard shows name, ID, register no, attendance 82.6%, pending count, next class, bus
- [ ] Academic: weekday selector changes timetable; attendance overall = total attended / total conducted; low subjects flagged (Computer Networks 69.8%)
- [ ] Materials: search works; unuploaded file shows "not uploaded yet" message; links open
- [ ] Bus: route change updates reg no/stops/map; Refresh moves bus; auto-move toggle; offline -> fallback message
- [ ] Assignments: search, 4 filters, mark submitted/not submitted, refresh page -> status persists
- [ ] Overdue count matches due dates
- [ ] Resize to phone width: sidebar becomes a menu button, no horizontal scroll
- [ ] Logout returns to login and protected pages redirect again

## 13-day plan
1. Requirements, folder setup, theme  2. Login + validation  3. data.js + session guard
4. Dashboard  5. Timetable  6. Attendance  7. Materials  8. Bus page + simulation
9. Leaflet map + fallback  10. Assignments + persistence  11. Responsive + polish
12. Firebase Auth/Firestore (optional)  13. Testing, report, demo rehearsal

## Real bus tracking (what is needed)
A GPS tracker in each bus, or a driver phone app using the browser/Android Geolocation API with
the driver's permission, sending lat/lng every few seconds to Firestore `busLocations/{busId}`.
The student page then listens to that document instead of the simulation.

## Firebase integration steps
1. Create a project at console.firebase.google.com; add a Web app; copy the config object.
2. Enable Authentication -> Email/Password. Create users as `<studentId>@college.example`
   (map student ID to email) and add a `students/{uid}` document for each.
3. Add the Firebase SDK (modular, via CDN `<script type="module">`) in a new `js/firebase.js`;
   put the config there (the web config is not secret, security comes from the rules).
4. Replace `Auth.login` with `signInWithEmailAndPassword`, `Auth.current` with `onAuthStateChanged`.
5. Create Firestore collections and replace the reads of `CC_DATA`:
```
students/{uid}        name, registerNo, department, year, semester, busId
timetables/{dept_year_sem_section}   days: { Monday: [ {start,end,subject,faculty,room} ] }
attendance/{uid}/subjects/{subject}  attended, conducted
materials/{id}        subject, title, type, url   (files in Firebase Storage if needed)
assignments/{id}      title, subject, description, assignedDate, dueDate
assignments/{id}/submissions/{uid}  status, submittedAt
buses/{busId}         regNo, routeName, stops[ {name,lat,lng,time} ]
busLocations/{busId}  lat, lng, updatedAt   (written only by the driver app/device)
announcements/{id}    title, text, date
```
6. Security rules (starting point):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    match /students/{uid} { allow read: if signedIn() && request.auth.uid == uid; }
    match /attendance/{uid}/{doc=**} { allow read: if signedIn() && request.auth.uid == uid; }
    match /assignments/{id} {
      allow read: if signedIn();
      match /submissions/{uid} { allow read, write: if signedIn() && request.auth.uid == uid; }
    }
    match /{col}/{id} {
      allow read: if signedIn() && col in ['timetables','materials','buses','busLocations','announcements'];
    }
    // writes to attendance, timetables, materials, buses, busLocations: staff/driver custom claims only
  }
}
```
7. Add a loading state while Firestore data arrives (the pages already have empty/loading states).

## Demo script (5 minutes)
1. Intro: problem (students juggle timetable, attendance, bus, assignments in many places).
2. Login with wrong password (validation), then demo credentials.
3. Dashboard: profile, attendance, pending assignments, next class, bus, notices.
4. Academic: change weekday; show attendance formula and low-attendance warning; search materials.
5. Bus: switch route, Refresh, explain it is simulated and how real GPS would work.
6. Assignments: search, filter Overdue, mark submitted, reload to show persistence.
7. Logout; open dashboard URL directly to show the session guard.
8. Close: Firebase roadmap and Android conversion possibility.
