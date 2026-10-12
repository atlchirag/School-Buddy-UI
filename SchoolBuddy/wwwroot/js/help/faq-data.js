/*
 * School Buddy - Help & FAQs static data.
 *
 * Shape (keep identical if this moves to an API):
 *   categories: [{ id, name, shortName, icon, description, order }]
 *   faqs:       [{ id, category, question, answer, keywords, order }]
 *
 * `category` on a FAQ is the category id.
 * `answer` is plain text. Formatting rules used by the renderer:
 *   - Lines starting with "1. ", "2. " ... become a numbered list.
 *   - Lines starting with "- " become a bullet list.
 *   - Any other line becomes a paragraph.
 *   - **text** is shown in bold (used for screen / button names).
 */
(function (window) {
    "use strict";

    var categories = [
        { id: "route-management", name: "Route Management", shortName: "Route Management", icon: "bi-signpost-split", description: "Create, edit and organise bus routes.", order: 1 },
        { id: "stop-management", name: "Stop Management", shortName: "Stop Management", icon: "bi-geo-alt", description: "Create stops and set their locations.", order: 2 },
        { id: "student-transport", name: "Student & Transport", shortName: "Student & Transport", icon: "bi-people", description: "Assign students to routes and stops.", order: 3 },
        { id: "bus-driver", name: "Bus & Driver Management", shortName: "Bus & Driver", icon: "bi-bus-front", description: "Buses, GPS devices and drivers.", order: 4 },
        { id: "live-tracking", name: "Live Tracking", shortName: "Live Tracking", icon: "bi-broadcast", description: "Follow buses on the map in real time.", order: 5 },
        { id: "attendance", name: "Attendance", shortName: "Attendance", icon: "bi-person-check", description: "RFID boarding and attendance records.", order: 6 },
        { id: "leave-management", name: "Leave Management", shortName: "Leave Management", icon: "bi-calendar-x", description: "Review and action parent leave requests.", order: 7 },
        { id: "notifications", name: "Notifications", shortName: "Notifications", icon: "bi-bell", description: "Parent alerts and push notifications.", order: 8 },
        { id: "reports", name: "Reports", shortName: "Reports", icon: "bi-graph-up", description: "Generate, filter and export reports.", order: 9 }
    ];

    var faqs = [
        /* ---------------- Route Management ---------------- */
        {
            id: "route-create", category: "route-management", order: 1,
            question: "How do I create a new route?",
            answer: [
                "1. In the sidebar, open **Master > Route**.",
                "2. Click the **Add Route** (+) button at the top of the route list.",
                "3. Choose the **Trip Creation Type** and **Select Bus** for the route.",
                "4. Enter a clear, unique **Route Name** (for example \"Route 5 - Morning\").",
                "5. Choose the **Trip Type**: **Pickup** (home to school) or **Drop** (school to home).",
                "6. Set the **Start Time** and **End Time**, and choose **Stoppage** or **Idle** under **Consider Point** if required.",
                "7. Click **Save Trip**. The route now appears in the route list.",
                "8. Open the route's **Stop Section** to add its stops."
            ].join("\n"),
            keywords: ["add route", "new route", "create trip", "pickup", "drop", "schedule"]
        },
        {
            id: "route-edit", category: "route-management", order: 2,
            question: "How do I edit an existing route?",
            answer: [
                "1. Open **Master > Route**.",
                "2. Find the route in the list (use the table search to filter).",
                "3. Click the **Edit Record** (pencil) icon on that row.",
                "4. In **Edit Route Timing**, update the route name, bus, trip type, start time or end time.",
                "5. Click **SAVE**.",
                "To change the stops on the route, use the **Stop Section** icon on the same row instead."
            ].join("\n"),
            keywords: ["modify route", "update route", "route timing", "change bus", "rename route"]
        },
        {
            id: "route-delete", category: "route-management", order: 3,
            question: "How do I delete or deactivate a route?",
            answer: [
                "1. Open **Master > Route**.",
                "2. Click the **Delete Record** (trash) icon on the route's row.",
                "3. Confirm the deletion.",
                "Before deleting, open **Student Wise** and move any assigned students to another route with **Migrate Student**, otherwise those students will be left without a route.",
                // "There is no separate \"inactive\" switch for a route. If a route is only paused for a while (for example during holidays), keep the route and add the dates under **Master > Holiday & Event** instead of deleting it."
            ].join("\n"),
            keywords: ["remove route", "deactivate", "disable route", "inactive", "trash"]
        },
        {
            id: "route-add-stops", category: "route-management", order: 4,
            question: "How do I add stops to a route?",
            answer: [
                "1. Open **Master > Route**.",
                "2. Click the **Stop Section** (bus) icon on the route's row.",
                "3. Click **Add Stop**.",
                "4. Enter the **Stop Name**, **Latitude** and **Longitude**.",
                "5. Click **SAVE**. Repeat for each stop, in the order the bus visits them.",
                // "If the bus has already been running on this route, you can use **Master > Automatic Stops** to detect stops from the bus's GPS history instead of typing coordinates."
            ].join("\n"),
            keywords: ["add stop", "stop section", "new stop", "halt"]
        },
        // {
        //     id: "route-stop-order", category: "route-management", order: 5,
        //     question: "How do I change the order of stops in a route?",
        //     answer: [
        //         "The **Stop Order** column in the route's **Stop Section** shows the sequence the bus follows.",
        //         "1. Open **Master > Automatic Stops**.",
        //         "2. Select the route and a date range, then load the stops.",
        //         "3. Set the **Order** value for each stop in the sequence the bus visits them.",
        //         "4. Click **Submit All**.",
        //         "Stops added manually through **Add Stop** take the next order number, so add them in route sequence. If the order is still wrong, delete and re-add the affected stops in the correct sequence, or contact School Buddy support."
        //     ].join("\n"),
        //     keywords: ["stop order", "sequence", "reorder stops", "arrange stops"]
        // },
        {
            id: "route-assign-bus", category: "route-management", order: 6,
            question: "How do I assign a bus to a route?",
            answer: [
                "A bus is selected when the route is created, and can be changed at any time.",
                "1. Open **Master > Route**.",
                "2. Click the **Edit Record** (pencil) icon on the route.",
                "3. Choose the bus from the vehicle list.",
                "4. Click **SAVE**.",
                "Only buses linked to your school's GPS account appear in the list. If a bus is missing, see \"How do I add a new bus?\"."
            ].join("\n"),
            keywords: ["vehicle", "assign vehicle", "change bus", "route bus"]
        },
        {
            id: "route-assign-driver", category: "route-management", order: 7,
            question: "How do I assign a driver to a route?",
            answer: [
                "Drivers are assigned to a bus, and the bus is assigned to the route. The driver of the route is therefore the driver of its bus.",
                "1. Check which bus the route uses in **Master > Route**.",
                "2. Open **Driver Management > Driver**.",
                "3. Click **Assign Unit** on the driver's row.",
                "4. Select the route's bus and save.",
                "If you change the route's bus later, also reassign the driver to the new bus."
            ].join("\n"),
            keywords: ["driver", "assign driver", "route driver", "assign unit"]
        },

        /* ---------------- Stop Management ---------------- */
        {
            id: "stop-create", category: "stop-management", order: 1,
            question: "How do I create a new stop?",
            answer: [
                "Every stop belongs to a route.",
                "1. Open **Master > Route**.",
                "2. Click the **Stop Section** (bus) icon on the route.",
                "3. Click **Add Stop**.",
                "4. Enter the **Stop Name**, **Latitude** and **Longitude**.",
                "5. Click **SAVE**.",
                "Use names parents will recognise, such as a landmark or society name."
            ].join("\n"),
            keywords: ["add stop", "new stop", "pickup point", "halt"]
        },
        {
            id: "stop-get-location", category: "stop-management", order: 2,
            question: "How do I get the location of a stop?",
            answer: [
                "You can get stop coordinates in two ways:",
                "- **From the bus's GPS history:** open **Master > Automatic Stops**, select the route and a date range when the bus ran normally, and School Buddy lists the places where the bus halted with their latitude and longitude. Name the correct halts and click **Submit All**.",
               " - **From the Route:** Go to **Route → Stops → Find the required stop**, then get the **Latitude** and **Longitude** from that stop row.",
"- Make sure the selected stop is the actual bus pickup point for accurate arrival alerts."
            ].join("\n"),
            keywords: ["location", "coordinates", "latitude", "longitude", "gps", "google maps", "automatic stops"]
        },
        {
            id: "stop-manual-latlng", category: "stop-management", order: 3,
            question: "Can I manually enter latitude and longitude?",
            answer: [
                "Yes. **Add Stop** and **Edit Stop** both have **Latitude** and **Longitude** fields you can type into.",
                "- Use decimal degrees, for example Latitude 33.7490 and Longitude -84.3880.",
                "- Latitude must be between -90 and 90; longitude between -180 and 180.",
                "- Use at least 4-5 decimal places for an accurate position.",
                "- Do not swap the two values. A swapped stop appears in the wrong place and arrival alerts will not fire."
            ].join("\n"),
            keywords: ["location", "lat", "lng", "coordinates", "manual", "decimal"]
        },
        {
            id: "stop-change-location", category: "stop-management", order: 4,
            question: "How do I change the location of an existing stop?",
            answer: [
                "1. Open **Master > Route** and click **Stop Section** on the route.",
                "2. Click the **Edit Stop** icon on the stop.",
                "3. Update the **Latitude** and **Longitude** (and the name if needed).",
                "4. Click **Save changes**.",
                "Students assigned to the stop stay assigned. Approaching and arrival alerts use the new location from the next trip."
            ].join("\n"),
            keywords: ["location", "move stop", "edit stop", "update coordinates"]
        },
        {
            id: "stop-assign-route", category: "stop-management", order: 5,
            question: "How do I assign a stop to a route?",
            answer: [
                "Stops are created inside a route, so a stop is linked to a route the moment you add it.",
                "1. Open **Master > Route**.",
                "2. Click **Stop Section** on the route the stop belongs to.",
                "3. Click **Add Stop** and save the stop there.",
                "To move a stop to a different route, add it to the new route and then delete it from the old route (after moving its students)."
            ].join("\n"),
            keywords: ["link stop", "stop to route", "route stop"]
        },
        {
            id: "stop-multiple-routes", category: "stop-management", order: 6,
            question: "Can the same stop be used in multiple routes?",
            answer: [
                "Yes, but each route keeps its own copy of the stop. Add the stop separately in each route's **Stop Section** using the same name and coordinates.",
                "This is common when the same point is used by a **Pickup** route in the morning and a **Drop** route in the afternoon.",
                "Because the copies are separate, if the location changes you must edit the stop in every route that uses it."
            ].join("\n"),
            keywords: ["shared stop", "same stop", "pickup and drop", "duplicate stop"]
        },

        /* ---------------- Student & Transport ---------------- */
        {
            id: "student-assign-route", category: "student-transport", order: 1,
            question: "How do I assign a student to a route?",
            answer: [
                "Students are assigned to a route through one of its stops. Make sure the student already exists in **Master > Students**.",
                "**One student at a time:**",
                "1. Open **Master > Route** and click **Stop Section** on the route.",
                "2. Click the **Assign Student** icon on the student's stop.",
                "3. Enter the **Student Name**, **Admission Number** and (optionally) the **RFID**.",
                "4. Save.",
                "**Many students at once:** on the same page, click **Download Sample**, fill in the Excel file, then use **Add Students Via Excel** to upload it."
            ].join("\n"),
            keywords: ["assign student", "allocate", "bulk", "excel", "admission number"]
        },
        {
            id: "student-pickup-stop", category: "student-transport", order: 2,
            question: "How do I assign a pickup stop to a student?",
            answer: [
                "1. Open **Master > Route** and find the route whose **Trip Type** is **Pickup**.",
                "2. Click **Stop Section** on that route.",
                "3. Click **Assign Student** on the stop where the student boards in the morning.",
                "4. Enter the student's details and save.",
                "The student's parent will now receive approaching and boarding alerts for this stop on the pickup trip."
            ].join("\n"),
            keywords: ["pickup", "morning", "boarding stop", "assign stop"]
        },
        {
            id: "student-drop-stop", category: "student-transport", order: 3,
            question: "How do I assign a drop stop to a student?",
            answer: [
                "1. Open **Master > Route** and find the route whose **Trip Type** is **Drop**.",
                "2. Click **Stop Section** on that route.",
                "3. Click **Assign Student** on the stop where the student gets off.",
                "4. Enter the student's details and save.",
                "A student normally has one pickup stop and one drop stop. They can be on different routes."
            ].join("\n"),
            keywords: ["drop", "afternoon", "deboarding stop", "assign stop"]
        },
        {
            id: "student-change-route", category: "student-transport", order: 4,
            question: "How do I change a student's assigned route?",
            answer: [
                "1. Open **Master > Route**.",
                "2. Click **Student Wise** to open the **Student Wise Bus Service List**.",
                "3. Find the student and click **Migrate Student** (pencil icon).",
                "4. In **Edit Student Transport Details**, select the new **Pickup** and/or **Drop** route and the stop on that route.",
                "5. Save.",
                "To remove a student from transport completely, use **Unassign Student** in the same list."
            ].join("\n"),
            keywords: ["migrate", "transfer", "move student", "change route", "student wise"]
        },
        {
            id: "student-change-stop", category: "student-transport", order: 5,
            question: "How do I change a student's pickup or drop stop?",
            answer: [
                "1. Open **Master > Route** and click **Student Wise**.",
                "2. Find the student and click **Migrate Student**.",
                "3. Keep the same route and select the new pickup stop, drop stop, or both.",
                "4. Save.",
                "Notifications switch to the new stop from the next trip. Let the parent know about the change."
            ].join("\n"),
            keywords: ["change stop", "pickup stop", "drop stop", "migrate", "update stop"]
        },

        /* ---------------- Bus & Driver Management ---------------- */
        {
            id: "bus-add", category: "bus-driver", order: 1,
            question: "How do I add a new bus?",
            answer: [
                "Buses come from your school's GPS tracking account, so a bus appears in School Buddy once its GPS device is installed and registered.",
                "1. Contact School Buddy support with the bus registration number and the GPS device IMEI.",
                "2. Once Support confirms that the bus is registered, it will appear under **Select Bus** when creating or editing a route, as well as in **Driver Management** and **Live Tracking**.",
                "3. Assign the bus to a route and a driver."
            ].join("\n"),
            keywords: ["new bus", "vehicle", "register bus", "fleet"]
        },
        {
            id: "bus-gps-device", category: "bus-driver", order: 2,
            question: "How do I assign a GPS device to a bus?",
            answer: [
                "GPS devices are installed and linked to buses by the School Buddy / GPS support team. The device's IMEI and SIM are mapped to the bus registration number on the tracking platform.",
                "To link or replace a device, send support the bus number, the new device IMEI and (for a replacement) the old IMEI.",
                "After linking, open **Live Tracking** and select the bus to confirm it shows a fresh location."
            ].join("\n"),
            keywords: ["gps", "device", "imei", "tracker", "sim"]
        },
        {
            id: "bus-assign-driver", category: "bus-driver", order: 3,
            question: "How do I assign a driver to a bus?",
            answer: [
                "1. Open **Driver Management > Driver**.",
                "2. If the driver is new, click **Add Driver** and enter their name, mobile number, licence number, licence dates and upload the DL copy.",
                "3. Click **Assign Unit** on the driver's row.",
                "4. Select the bus and save.",
                "The bus now shows in the driver's **Assigned Unit** column."
            ].join("\n"),
            keywords: ["driver", "assign unit", "add driver", "licence"]
        },
        {
            id: "bus-change-driver", category: "bus-driver", order: 4,
            question: "How do I change the driver assigned to a bus?",
            answer: [
                "1. Open **Driver Management > Driver**.",
                "2. Find the new driver and click **Assign Unit**.",
                "3. Select the bus and save. The bus is now linked to the new driver.",
                "Previous assignments are kept in the driver's history, so trips and performance stay linked to whoever was driving at the time."
            ].join("\n"),
            keywords: ["replace driver", "change driver", "reassign", "history"]
        },
        {
            id: "bus-active", category: "bus-driver", order: 5,
            question: "How do I check whether a bus is active?",
            answer: [
                "- **Dashboard:** the vehicle and fleet status sections show which buses are running, idle, stopped or not sending GPS.",
                "- **Live Tracking:** select the bus and check the time of its last location update. A recent update means the device is active.",
                "- **Reports > No GPS Report:** lists buses that have not sent GPS data.",
                "- **Reports > Fleet Summary:** shows the state of every bus for a date."
            ].join("\n"),
            keywords: ["active", "status", "online", "offline", "no gps", "running", "idle"]
        },

        /* ---------------- Live Tracking ---------------- */
        {
            id: "tracking-view", category: "live-tracking", order: 1,
            question: "How do I view the live location of a bus?",
            answer: [
                "1. Click your profile at the top-right and choose **Live Tracking**.",
                "2. Use **Select Vehicle** to choose the bus.",
                "3. The map shows the bus's current location, along with its status and last update time.",
                "You can also check live bus status from the vehicle sections of the **Dashboard**."
            ].join("\n"),
            keywords: ["live location", "map", "track bus", "where is bus", "location"]
        },
        {
            id: "tracking-not-updating", category: "live-tracking", order: 2,
            question: "Why is a bus location not updating?",
            answer: [
                "The location only updates when the GPS device sends new data. Common causes:",
                "- The bus ignition is off and the device is in sleep mode.",
                "- The bus is in an area with weak mobile network coverage (data is sent once signal returns).",
                "- The device has lost power or its wiring is loose.",
                "- The device SIM has no data balance or has expired.",
                "Check the last update time in **Live Tracking**. If it has not changed for a long time while the bus is running, check **Reports > No GPS Report** and contact support with the bus number."
            ].join("\n"),
            keywords: ["location", "not updating", "stale", "stuck", "gps", "signal"]
        },
        {
            id: "tracking-not-visible", category: "live-tracking", order: 3,
            question: "Why can't I see a bus on the map?",
            answer: [
                "- The bus is not in the **Select Vehicle** list: it is not registered on your school's GPS account yet. Contact support.",
                "- The bus is selected but no marker shows: the device has never sent a location, or has not reported for a long time. See \"Why is a bus location not updating?\".",
                "- The map is zoomed to another area: zoom out or select the bus again to re-centre.",
                "- The page shows an error: refresh the page. If your session has expired you will be asked to sign in again."
            ].join("\n"),
            keywords: ["map", "missing bus", "not visible", "marker"]
        },
        {
            id: "tracking-how-location", category: "live-tracking", order: 4,
            question: "How is the bus location determined?",
            answer: [
                "Each bus has a GPS device installed. The device works out its position from GPS satellites and sends it over the mobile network, together with speed, ignition status and time, at regular intervals.",
                "School Buddy reads the latest position for the bus from the GPS tracking platform and shows it on the map, along with the time it was recorded."
            ].join("\n"),
            keywords: ["gps", "location", "how tracking works", "device", "satellite"]
        },
        {
            id: "tracking-approaching", category: "live-tracking", order: 5,
            question: "How does School Buddy detect when a bus is approaching a stop?",
            answer: [
                "School Buddy compares the bus's live GPS position with the latitude and longitude saved for each stop on the route.",
                "When the bus comes within the configured distance of a stop, it is marked as approaching. Parents of students assigned to that stop are notified and the stop's ETA is updated.",
                "For this to work, stop coordinates must be accurate and the stops must be in the correct order on the route. You can review stop ETAs in **Analysis > Route Stop ETA**."
            ].join("\n"),
            keywords: ["approaching", "eta", "geofence", "near stop", "arrival", "location"]
        },

        /* ---------------- Attendance ---------------- */
        {
            id: "attendance-view", category: "attendance", order: 1,
            question: "How do I view student attendance?",
            answer: [
                "1. Open **Master > Attendance**.",
                "2. Select the date.",
                "3. Optionally use **Select Class** to narrow the list.",
                "4. The table shows each student's admission number, class, RFID, vehicle number and **Attendance Status**."
            ].join("\n"),
            keywords: ["attendance", "present", "absent", "class"]
        },
        {
            id: "attendance-recorded", category: "attendance", order: 2,
            question: "How is student attendance recorded?",
            answer: [
                "Attendance is recorded automatically when a student taps their RFID card on the reader inside the bus.",
                "Each tap is saved with the student, bus and time, and appears in **Master > Attendance** and in **Reports > RFID Report**.",
                "For this to work, the student must have the correct **RFID Tag** saved in **Master > Students**. You can upload many RFID tags at once with **Upload RFID Excel**."
            ].join("\n"),
            keywords: ["rfid", "card", "tap", "punch", "boarding"]
        },
        {
            id: "attendance-history", category: "attendance", order: 3,
            question: "How do I check attendance history?",
            answer: [
                "- **For a specific day:** open **Master > Attendance** and select that date.",
                "- **For a date range:** open **Reports**, choose **RFID Report**, set the date range and click **Generate Report**. It shows students as **Punched**, **Not Punched** or **Other Punched** (tapped on a different bus).",
                "Both screens can be exported to Excel, CSV or PDF."
            ].join("\n"),
            keywords: ["history", "past attendance", "rfid report", "date range"]
        },
        {
            id: "attendance-incorrect", category: "attendance", order: 4,
            question: "What should I do if attendance information is incorrect?",
            answer: [
                "1. Open **Master > Students** and check the student's **RFID Tag** matches the number on their card.",
                "2. Check the student is assigned to the right route and stop (**Master > Route > Student Wise**).",
                "3. Check the student did not tap on a different bus. These taps show as **Other Punched** in the RFID Report.",
                "4. Check the bus's RFID reader and GPS were working that day (**Reports > No GPS Report**).",
                "If the records are still wrong, contact support with the student's admission number, the date and the bus number."
            ].join("\n"),
            keywords: ["wrong attendance", "missing", "rfid", "incorrect", "fix"]
        },

        /* ---------------- Leave Management ---------------- */
        {
            id: "leave-parent-submit", category: "leave-management", order: 1,
            question: "How can a parent submit a leave request?",
            answer: [
                "Parents submit leave from the School Buddy Parent App:",
                "1. Sign in to the Parent App.",
                "2. Open the leave option for their child.",
                "3. Choose the leave dates, enter the reason and submit.",
                "The request then appears in **Master > Leave Requests** on the admin portal with the status **Pending**."
            ].join("\n"),
            keywords: ["parent app", "apply leave", "submit leave", "absence"]
        },
        {
            id: "leave-view", category: "leave-management", order: 2,
            question: "How can I view leave requests?",
            answer: [
                "1. Open **Master > Leave Requests**.",
                "2. Select the month.",
                "3. Click the **Pending Action**, **Approved** or **Rejected** summary card to show only requests with that status.",
                "4. Use the search box to find a student or parent."
            ].join("\n"),
            keywords: ["leave list", "pending leave", "month"]
        },
        {
            id: "leave-approve", category: "leave-management", order: 3,
            question: "How do I approve a leave request?",
            answer: [
                "1. Open **Master > Leave Requests** and click the **Pending Action** card.",
                "2. Find the request and click **Approve**.",
                "3. Optionally add a remark for the parent, then click **Confirm Approve**.",
                "The request moves to **Approved** and the parent is notified."
            ].join("\n"),
            keywords: ["approve", "accept leave"]
        },
        {
            id: "leave-reject", category: "leave-management", order: 4,
            question: "How do I reject a leave request?",
            answer: [
                "1. Open **Master > Leave Requests** and click the **Pending Action** card.",
                "2. Find the request and click **Reject**.",
                "3. Add a remark explaining the reason. It is optional, but the parent will see it.",
                "4. Click **Confirm Reject**.",
                "The request moves to **Rejected** and the parent is notified."
            ].join("\n"),
            keywords: ["reject", "decline leave", "remark"]
        },
        {
            id: "leave-status", category: "leave-management", order: 5,
            question: "How can I check the status of a leave request?",
            answer: [
                "Open **Master > Leave Requests**, select the month and look at the status badge on the request (**Pending**, **Approved** or **Rejected**). Click a status card at the top to list only requests with that status. Any remark you added is shown with the request.",
                "Parents can see the same status in the Parent App."
            ].join("\n"),
            keywords: ["leave status", "pending", "approved", "rejected"]
        },
        {
            id: "leave-parent-notified", category: "leave-management", order: 6,
            question: "How are parents notified when leave status changes?",
            answer: [
                "When you approve or reject a request, School Buddy sends a push notification to the parent's Parent App with the new status and your remark. The status also updates in the app's leave section.",
                "If a parent did not get the notification, see \"Why is a parent not receiving notifications?\"."
            ].join("\n"),
            keywords: ["leave notification", "parent alert", "push"]
        },

        /* ---------------- Notifications ---------------- */
        {
            id: "notif-how", category: "notifications", order: 1,
            question: "How does School Buddy send notifications?",
            answer: [
                "School Buddy sends push notifications to the Parent App using Firebase Cloud Messaging (FCM). Each time a parent signs in, the app registers a device token, which School Buddy uses to deliver messages to that phone.",
                "Notifications are sent for:",
                "- Bus approaching the student's stop",
                "- Student boarding and getting off the bus (RFID tap)",
                "- Leave request status changes",
                "- Route messages sent from **Master > Command**",
                "Sent notifications can be reviewed in **Reports > Notification Log**."
            ].join("\n"),
            keywords: ["push", "fcm", "firebase", "parent app", "alerts"]
        },
        {
            id: "notif-approaching", category: "notifications", order: 2,
            question: "How do bus approaching notifications work?",
            answer: [
                "1. The bus's GPS device reports its position.",
                "2. School Buddy checks the position against the next stops on the route.",
                "3. When the bus comes within the configured distance of a stop, parents of students assigned to that stop get an \"approaching\" notification.",
                "Accurate stop coordinates, correct stop order and correct student-to-stop assignment are all needed for parents to get the right alert at the right time."
            ].join("\n"),
            keywords: ["approaching", "eta", "near stop", "bus arriving"]
        },
        {
            id: "notif-boarding", category: "notifications", order: 3,
            question: "How are boarding and deboarding notifications triggered?",
            answer: [
                "When a student taps their RFID card on the reader in the bus, School Buddy records the tap and sends the parent a notification that the child has boarded (or got off) the bus, with the bus and time.",
                "When the student taps their RFID card on the reader at the school during deboarding, School Buddy records the tap and sends the parent a deboarding notification, including the school, bus details, and time.",
                "If the card is not tapped, or the RFID tag saved for the student is wrong, no notification is sent."
            ].join("\n"),
            keywords: ["boarding", "deboarding", "rfid", "tap", "punch"]
        },
        {
            id: "notif-not-received", category: "notifications", order: 4,
            question: "Why is a parent not receiving notifications?",
            answer: [
                "Check these in order:",
                "- The parent is signed in to the Parent App with the mobile number saved for the student.",
                "- Notifications are allowed for the app in the phone's settings, and battery saver is not blocking it.",
                "- The student is assigned to the correct route and stop.",
                "- For boarding alerts, the student's **RFID Tag** is correct.",
                "- The notification appears in **Reports > Notification Log**. If it is there, it was sent and the problem is on the phone. If it is not, check the route, stop and RFID setup.",
                "If all of this is correct, ask the parent to sign out and sign in again to refresh the device token."
            ].join("\n"),
            keywords: ["not receiving", "missing notification", "parent app", "push"]
        },
        // {
        //     id: "notif-fcm-token", category: "notifications", order: 5,
        //     question: "What should I check if an FCM token is invalid or expired?",
        //     answer: [
        //         "An FCM token is the address of the parent's phone for push notifications. It becomes invalid when the app is reinstalled, its data is cleared, the parent changes phone, or the app has not been opened for a long time.",
        //         "1. Ask the parent to update the Parent App to the latest version.",
        //         "2. Ask them to sign out and sign in again. This registers a new token.",
        //         "3. Make sure notifications are allowed for the app on the phone.",
        //         "4. Check **Reports > Login Reports** to confirm the new sign-in was recorded.",
        //         "5. Check **Reports > Notification Log** after the next trip to confirm delivery.",
        //         "If notifications still fail for a valid token, contact support with the parent's mobile number."
        //     ].join("\n"),
        //     keywords: ["fcm", "token", "expired", "invalid", "firebase", "reinstall"]
        // },

        /* ---------------- Reports ---------------- */
        {
            id: "report-transport", category: "reports", order: 1,
            question: "How do I view transportation reports?",
            answer: [
                "1. Open **Report** from the sidebar.",
                "2. Choose a category: **Fleet Reports**, **Distance Reports**, **Speed Reports** or **School Transport Reports**, or search by name.",
                "3. Click a report card (for example **Fleet Summary**, **Stoppage Summary**, **Running Summary** or **No GPS Report**).",
                "4. Choose the filters in the panel that opens and click **Generate Report**."
            ].join("\n"),
            keywords: ["fleet", "distance", "speed", "transport report", "report center"]
        },
        {
            id: "report-attendance", category: "reports", order: 2,
            question: "How do I view attendance reports?",
            answer: [
                "1. Open **Report** and select **School Transport Reports**.",
                "2. Click **RFID Report**.",
                "3. Select the date range (and route or students if shown) and click **Generate Report**.",
                "For a single day by class, **Master > Attendance** is quicker."
            ].join("\n"),
            keywords: ["attendance report", "rfid report", "punched"]
        },
        {
            id: "report-route-trip", category: "reports", order: 3,
            question: "How do I view route/trip reports?",
            answer: [
                "- **Stop arrival times:** open **Analysis**, choose the route and date, and view **Route Stop ETA**.",
                "- **Bus movement for a trip:** in **Report**, use **Stoppage Summary**, **Running Summary** or the distance reports for the route's bus and the trip's time range.",
                "- **Students on a route:** in **Master > Route**, open **View Details** on the route or use **Student Wise**, then **Export Excel**."
            ].join("\n"),
            keywords: ["route report", "trip report", "eta", "analysis", "stoppage"]
        },
        {
            id: "report-filter-date", category: "reports", order: 4,
            question: "How do I filter reports by date?",
            answer: [
                "1. Open **Report** and click the report you need.",
                "2. In the filter panel, set the **Start** and **End** date and time.",
                "3. Select the bus, route or other filters if shown.",
                "4. Click **Generate Report**.",
                "The end date must be after the start date. Large date ranges with many buses take longer to load, so narrow the range if a report is slow. Use **Reset** to clear the filters."
            ].join("\n"),
            keywords: ["date filter", "date range", "start date", "end date"]
        },
        {
            id: "report-export", category: "reports", order: 5,
            question: "Can reports be exported?",
            answer: [
                "Yes. After a report is generated, use the buttons above the table to export:",
                "- **Excel** or **CSV** for spreadsheets",
                "- **PDF** to share or archive",
                "- **Print** for a paper copy",
                "- **Copy** to paste into another document",
                "The export contains exactly the rows shown by your current filters and search."
            ].join("\n"),
            keywords: ["export", "download", "excel", "csv", "pdf", "print"]
        }
    ];

    window.SchoolBuddyFaqData = {
        categories: categories,
        faqs: faqs
    };
})(window);
