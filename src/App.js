// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  getStudents,
  addStudent,
  getAttendance,
  saveAttendance,
} from "./api";

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function App() {
  const [students, setStudents] = useState([]); // [{roll,name}]
  const [today] = useState(() => formatDate(new Date()));
  const [attendance, setAttendance] = useState([]); // [{roll,name,status}]
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load students + today's attendance
  useEffect(() => {
    async function load() {
      try {
        const stu = await getStudents(); // [{roll,name}]
        setStudents(stu);

        const att = await getAttendance(today); // [{roll,name,status}]
        if (att.length > 0) {
          setAttendance(att);
        } else {
          // No attendance yet: build from students
          setAttendance(
            stu.map((s) => ({
              roll: s.roll,
              name: s.name,
              status: "",
            }))
          );
        }
      } catch (e) {
        console.error("Error loading data", e);
        setError("Error loading data from server");
      }
    }
    load();
  }, [today]);

  // if students change but attendance empty, sync them
  useEffect(() => {
    if (students.length > 0 && attendance.length === 0) {
      setAttendance(
        students.map((s) => ({
          roll: s.roll,
          name: s.name,
          status: "",
        }))
      );
    }
  }, [students, attendance]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!newRoll.trim() || !newName.trim()) {
      setError("Roll and Name are required");
      return;
    }

    try {
      await addStudent(newRoll.trim(), newName.trim());

      // reload students
      const stu = await getStudents();
      setStudents(stu);

      // ensure attendance contains this new student
      setAttendance((prev) => {
        const exists = prev.find((p) => p.roll === newRoll.trim());
        if (exists) return prev;
        return [
          ...prev,
          { roll: newRoll.trim(), name: newName.trim(), status: "" },
        ];
      });

      setNewRoll("");
      setNewName("");
      setMessage("Student added");
    } catch (e) {
      console.error("Error adding student", e);
      setError("Error adding student (check backend / console)");
    } finally {
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 2500);
    }
  };

  const handleStatusChange = (roll, status) => {
    setAttendance((prev) =>
      prev.map((rec) =>
        rec.roll === roll ? { ...rec, status } : rec
      )
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const recordsToSend = attendance.map((rec) => ({
        roll: rec.roll,
        status: rec.status || "",
      }));

      await saveAttendance(today, recordsToSend);
      setMessage("Attendance saved for " + today);
    } catch (e) {
      console.error("Error saving attendance", e);
      setError("Error saving attendance");
    } finally {
      setSaving(false);
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 2500);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Local Attendance System</h1>
      <p>Today: <strong>{today}</strong></p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {/* Left: Add students */}
        <div style={{ flex: 1, border: "1px solid #ccc", padding: 16 }}>
          <h2>Add Students (one-time)</h2>
          <form onSubmit={handleAddStudent}>
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Roll number"
                value={newRoll}
                onChange={(e) => setNewRoll(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Student name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <button type="submit">Add</button>
          </form>

          <h3 style={{ marginTop: 20 }}>All Students</h3>
          {students.length === 0 ? (
            <p>No students yet.</p>
          ) : (
            <ul>
              {students.map((s) => (
                <li key={s.roll}>
                  {s.roll} - {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Today's attendance */}
        <div style={{ flex: 2, border: "1px solid #ccc", padding: 16 }}>
          <h2>Mark Attendance for Today</h2>
          {attendance.length === 0 ? (
            <p>No students to mark.</p>
          ) : (
            <table border="1" cellPadding="8">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec) => (
                  <tr key={rec.roll}>
                    <td>{rec.roll}</td>
                    <td>{rec.name}</td>
                    <td>
                      <input
                        type="radio"
                        name={String(rec.roll)}
                        checked={rec.status === "P"}
                        onChange={() => handleStatusChange(rec.roll, "P")}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={String(rec.roll)}
                        checked={rec.status === "A"}
                        onChange={() => handleStatusChange(rec.roll, "A")}
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
