import React, { useEffect, useState } from "react";
import {
  getStudents,
  addStudent,
  getAttendance,
  saveAttendance,
} from "./api";

function formatDate(date) {
  // YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function App() {
  const [students, setStudents] = useState([]);
  const [today] = useState(() => formatDate(new Date()));
  const [attendance, setAttendance] = useState([]); // [{name, status}]
  const [newStudentName, setNewStudentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load students and today's attendance on start
  useEffect(() => {
    async function load() {
      const stu = await getStudents();
      setStudents(stu);

      const att = await getAttendance(today);
      // If no attendance yet, backend returns empty statuses
      setAttendance(att);
    }
    load();
  }, [today]);

  // When students list changes and attendance is empty (e.g., first time),
  // we ensure each student has an entry in attendance.
  useEffect(() => {
    if (students.length > 0 && attendance.length === 0) {
      setAttendance(students.map(name => ({ name, status: "" })));
    }
  }, [students, attendance]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await addStudent(newStudentName.trim());
    setNewStudentName("");
    const stu = await getStudents();
    setStudents(stu);

    // also add to current attendance state
    setAttendance(prev => {
      const exists = prev.find(p => p.name === newStudentName.trim());
      if (exists) return prev;
      return [...prev, { name: newStudentName.trim(), status: "" }];
    });

    setMessage("Student added");
    setTimeout(() => setMessage(""), 1500);
  };

  const handleStatusChange = (name, status) => {
    setAttendance(prev =>
      prev.map(rec =>
        rec.name === name ? { ...rec, status } : rec
      )
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      await saveAttendance(today, attendance);
      setMessage("Attendance saved for " + today);
    } catch (err) {
      console.error(err);
      setMessage("Error saving attendance");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Local Attendance System</h1>
      <p>Today: <strong>{today}</strong></p>
      {message && <p>{message}</p>}

      <div style={{ display: "flex", gap: 40 }}>
        {/* Left: Add students once */}
        <div style={{ flex: 1 }}>
          <h2>Add Students (one-time)</h2>
          <form onSubmit={handleAddStudent}>
            <input
              type="text"
              placeholder="Student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          <h3>All Students</h3>
          <ul>
            {students.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Right: Today's attendance */}
        <div style={{ flex: 2 }}>
          <h2>Mark Attendance for Today</h2>
          {attendance.length === 0 ? (
            <p>No students yet.</p>
          ) : (
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec) => (
                  <tr key={rec.name}>
                    <td>{rec.name}</td>
                    <td>
                      <input
                        type="radio"
                        name={rec.name}
                        checked={rec.status === "P"}
                        onChange={() => handleStatusChange(rec.name, "P")}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={rec.name}
                        checked={rec.status === "A"}
                        onChange={() => handleStatusChange(rec.name, "A")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={saving || attendance.length === 0}
            style={{ marginTop: 20 }}
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
