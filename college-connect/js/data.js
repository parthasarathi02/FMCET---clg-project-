/* =========================================================
   College Connect - shared DEMONSTRATION data
   All values below are sample data, not real college data.
   Later, replace each block with Firestore / API reads.
   ========================================================= */

// helper: a date string N days from today (so Overdue/Pending demo always works)
function ccDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

window.CC_DATA = {
  // Demo accounts. Passwords here are for the DEMO ONLY (frontend data is never secure).
  students: [
    {
      id: "CS2301",
      password: "demo123",
      name: "Arjun Kumar",
      registerNo: "812023104001",
      department: "Computer Science and Engineering",
      year: 3,
      semester: 5,
      section: "A",
      busRouteId: "R1"
    },
    {
      id: "CS2302",
      password: "demo123",
      name: "Priya Sharma",
      registerNo: "812023104002",
      department: "Computer Science and Engineering",
      year: 3,
      semester: 5,
      section: "A",
      busRouteId: "R2"
    }
  ],

  // Weekday -> periods
  timetable: {
    Monday: [
      { start: "09:00", end: "09:50", subject: "Operating Systems", faculty: "Dr. R. Meena", room: "CS-201" },
      { start: "10:00", end: "10:50", subject: "Database Management Systems", faculty: "Prof. S. Karthik", room: "CS-201" },
      { start: "11:10", end: "12:00", subject: "Computer Networks", faculty: "Dr. A. Fathima", room: "CS-203" },
      { start: "13:00", end: "15:40", subject: "DBMS Laboratory", faculty: "Prof. S. Karthik", room: "Lab-2" }
    ],
    Tuesday: [
      { start: "09:00", end: "09:50", subject: "Computer Networks", faculty: "Dr. A. Fathima", room: "CS-203" },
      { start: "10:00", end: "10:50", subject: "Software Engineering", faculty: "Prof. L. Divya", room: "CS-202" },
      { start: "11:10", end: "12:00", subject: "Operating Systems", faculty: "Dr. R. Meena", room: "CS-201" },
      { start: "13:00", end: "13:50", subject: "Professional Ethics", faculty: "Dr. P. Nair", room: "CS-204" }
    ],
    Wednesday: [
      { start: "09:00", end: "09:50", subject: "Database Management Systems", faculty: "Prof. S. Karthik", room: "CS-201" },
      { start: "10:00", end: "10:50", subject: "Operating Systems", faculty: "Dr. R. Meena", room: "CS-201" },
      { start: "11:10", end: "12:00", subject: "Software Engineering", faculty: "Prof. L. Divya", room: "CS-202" },
      { start: "13:00", end: "15:40", subject: "Networks Laboratory", faculty: "Dr. A. Fathima", room: "Lab-3" }
    ],
    Thursday: [
      { start: "09:00", end: "09:50", subject: "Software Engineering", faculty: "Prof. L. Divya", room: "CS-202" },
      { start: "10:00", end: "10:50", subject: "Computer Networks", faculty: "Dr. A. Fathima", room: "CS-203" },
      { start: "11:10", end: "12:00", subject: "Database Management Systems", faculty: "Prof. S. Karthik", room: "CS-201" },
      { start: "13:00", end: "13:50", subject: "Professional Ethics", faculty: "Dr. P. Nair", room: "CS-204" }
    ],
    Friday: [
      { start: "09:00", end: "09:50", subject: "Operating Systems", faculty: "Dr. R. Meena", room: "CS-201" },
      { start: "10:00", end: "10:50", subject: "Computer Networks", faculty: "Dr. A. Fathima", room: "CS-203" },
      { start: "11:10", end: "12:00", subject: "Software Engineering", faculty: "Prof. L. Divya", room: "CS-202" },
      { start: "13:00", end: "13:50", subject: "Mentor Hour", faculty: "Dr. R. Meena", room: "CS-201" }
    ],
    Saturday: [
      { start: "09:00", end: "09:50", subject: "Database Management Systems", faculty: "Prof. S. Karthik", room: "CS-201" },
      { start: "10:00", end: "10:50", subject: "Professional Ethics", faculty: "Dr. P. Nair", room: "CS-204" }
    ]
  },

  // Attendance: percentage is CALCULATED in app.js, never stored here
  attendance: [
    { subject: "Operating Systems", attended: 38, conducted: 44 },
    { subject: "Database Management Systems", attended: 36, conducted: 42 },
    { subject: "Computer Networks", attended: 30, conducted: 43 },
    { subject: "Software Engineering", attended: 33, conducted: 40 },
    { subject: "Professional Ethics", attended: 18, conducted: 20 },
    { subject: "DBMS Laboratory", attended: 11, conducted: 12 },
    { subject: "Networks Laboratory", attended: 10, conducted: 12 }
  ],
  attendanceThreshold: 75,

  // Study materials. url:"" means "not uploaded yet" -> UI shows a clear message
  materials: [
    { subject: "Operating Systems", title: "Unit 1 - Process Management Notes", type: "PDF", url: "" },
    { subject: "Operating Systems", title: "OS Concepts (Open course)", type: "Link", url: "https://ocw.mit.edu/courses/6-828-operating-system-engineering-fall-2012/" },
    { subject: "Database Management Systems", title: "Normalization Slides", type: "PPT", url: "" },
    { subject: "Database Management Systems", title: "SQL Practice Tutorial", type: "Link", url: "https://www.w3schools.com/sql/" },
    { subject: "Computer Networks", title: "OSI vs TCP/IP Notes", type: "Notes", url: "" },
    { subject: "Software Engineering", title: "UML Diagrams Cheat Sheet", type: "PDF", url: "" },
    { subject: "Software Engineering", title: "Agile Guide", type: "Link", url: "https://agilemanifesto.org/" }
  ],

  // dueOffset = days from today (negative = already past)
  assignments: [
    { id: "A1", title: "Process Scheduling Simulation", subject: "Operating Systems", description: "Implement FCFS, SJF and Round Robin in C and compare average waiting time.", assignedOffset: -12, dueOffset: -2 },
    { id: "A2", title: "ER Diagram for Library System", subject: "Database Management Systems", description: "Draw an ER diagram and convert it into relational tables.", assignedOffset: -8, dueOffset: 3 },
    { id: "A3", title: "Subnetting Problems", subject: "Computer Networks", description: "Solve the 10 subnetting and CIDR problems given in class.", assignedOffset: -5, dueOffset: 5 },
    { id: "A4", title: "SRS Document - Mini Project", subject: "Software Engineering", description: "Prepare the Software Requirement Specification for your mini project.", assignedOffset: -3, dueOffset: 9 },
    { id: "A5", title: "Case Study - Whistle Blowing", subject: "Professional Ethics", description: "Write a one-page case study with your analysis.", assignedOffset: -14, dueOffset: -6 },
    { id: "A6", title: "SQL Queries - Set 2", subject: "Database Management Systems", description: "Write queries for joins, grouping and nested queries.", assignedOffset: -1, dueOffset: 12 }
  ],
  // statuses present before the student changes anything
  defaultSubmitted: ["A5"],

  // Bus routes: coordinates are SAMPLE locations around Chennai, India (simulated)
  buses: [
    {
      routeId: "R1",
      routeName: "Bus 7 - MADURAI to College",
      regNo: "TN 123456",
      driver: "Demo Driver (sample)",
      stops: [
        { name: "St.Michael HSS Bus Stand", lat: 12.9249, lng: 80.1000, time: "07:45" },
        { name: "Krishanapuram Colony", lat: 12.9516, lng: 80.1462, time: "08:00" },
        { name: "B.B kulam", lat: 12.9675, lng: 80.1491, time: "08:05" },
        { name: "Pandi Kovil", lat: 13.0067, lng: 80.2206, time: "08:32" },
        { name: "FMCET Campus", lat: 13.0358, lng: 80.2330, time: "08:45" }
      ]
    },
    {
      routeId: "R2",
      routeName: "Bus 13 - Thiru Nagar to College",
      regNo: "TN 5678",
      driver: "Demo Driver (sample)",
      stops: [
        { name: "Thiru Nagar", lat: 13.0850, lng: 80.2101, time: "07:30" },
        { name: "Palanganatham", lat: 13.0694, lng: 80.1948, time: "07:50" },
        { name: "Madura_clg", lat: 13.0500, lng: 80.2121, time: "07:55" },
        { name: "Ring Road", lat: 13.0319, lng: 80.2406, time: "08:30" },
        { name: "FMCET Campus", lat: 13.0358, lng: 80.2330, time: "09:00" }
      ]
    },
    {
      routeId: "R3",
      routeName: "Bus 32 - Kancharam Pettai to College",
      regNo: "TN 11 EF 9012",
      driver: "Demo Driver (sample)",
      stops: [
        { name: "Kancharam Pettai", lat: 12.9791, lng: 80.2209, time: "07:30" },
        { name: "Thiruppalai", lat: 13.0067, lng: 80.2570, time: "07:45" },
        { name: "Surya Nagar", lat: 13.0368, lng: 80.2676, time: "08:45" },
        { name: "FMCET Campus", lat: 13.0358, lng: 80.2330, time: "09:00" }
      ]
    }
  ],

  announcements: [
    { date: ccDay(-1), title: "Internal Assessment 2 timetable released", text: "IA-2 begins next week. Check the notice board for the schedule." },
    { date: ccDay(-3), title: "Bus 13 timing change", text: "Bus 13 will leave 10 minutes earlier on Friday (sample notice)." },
    { date: ccDay(-6), title: "Library extended hours", text: "Library stays open until 7 PM during the assessment week." }
  ]
};
