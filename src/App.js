// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  getClasses, createClass,
  getStudentsForClass, addStudentToClass,
  getAttendanceForClass, saveAttendanceForClass,
  downloadCsvForClass
} from "./api";

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

export default function App() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [newClassName, setNewClassName] = useState("");

  const [students, setStudents] = useState([]); // [{roll,name}]
  const [attendance, setAttendance] = useState([]); // [{roll,name,status}]
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState("");

  const today = formatDate(new Date());

  useEffect(() => {
    async function load() {
      const cls = await getClasses();
      setClasses(cls);
      if (cls.length > 0 && !selectedClass) {
        setSelectedClass(cls[0]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadForClass() {
      if (!selectedClass) {
        setStudents([]); setAttendance([]); return;
      }
      const stu = await getStudentsForClass(selectedClass);
      setStudents(stu);

      const att = await getAttendanceForClass(selectedClass, today);
      if (att && att.length > 0) {
        setAttendance(att);
      } else {
        setAttendance(stu.map(s => ({ roll: s.roll, name: s.name, status: "" })));
      }
    }
    loadForClass();
  }, [selectedClass, today]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await createClass(newClassName.trim());
    const cls = await getClasses();
    setClasses(cls);
    setSelectedClass(newClassName.trim());
    setNewClassName("");
    setMsg("Class created");
    setTimeout(()=>setMsg(""),2000);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedClass) { setMsg("Select class first"); return; }
    if (!newRoll.trim() || !newName.trim()) return;
    await addStudentToClass(selectedClass, newRoll.trim(), newName.trim());
    const stu = await getStudentsForClass(selectedClass);
    setStudents(stu);
    setAttendance(prev => {
      if (prev.find(p => p.roll === newRoll.trim())) return prev;
      return [...prev, { roll: newRoll.trim(), name: newName.trim(), status: "" }];
    });
    setNewRoll(""); setNewName("");
    setMsg("Student added");
    setTimeout(()=>setMsg(""),2000);
  };

  const handleStatusChange = (roll, status) => {
    setAttendance(prev => prev.map(r => r.roll === roll ? { ...r, status } : r));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) { setMsg("Select class"); return; }
    const records = attendance.map(r => ({ roll: r.roll, status: r.status || "" }));
    await saveAttendanceForClass(selectedClass, today, records);
    setMsg("Attendance saved");
    setTimeout(()=>setMsg(""),2000);
  };

  const handleDownload = async () => {
    if (!selectedClass) { setMsg("Select class"); return; }
    const resp = await downloadCsvForClass(selectedClass);
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedClass.replace(/\s+/g,"_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Attendance — select class</h1>
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <div style={{ marginBottom: 16 }}>
        <strong>Classes:</strong>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="">-- select class --</option>
          {classes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <form onSubmit={handleCreateClass} style={{ display: "inline-block", marginLeft: 16 }}>
          <input placeholder="New class name" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
          <button type="submit" style={{ marginLeft: 8 }}>Create Class</button>
        </form>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 320 }}>
          <h3>Students in {selectedClass || "—"}</h3>
          <form onSubmit={handleAddStudent}>
            <input placeholder="Roll" value={newRoll} onChange={e=>setNewRoll(e.target.value)} />
            <input placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} />
            <button type="submit">Add Student</button>
          </form>
          <ul>
            {students.map(s => <li key={s.roll}>{s.roll} — {s.name}</li>)}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Mark Attendance for {today}</h3>
          {attendance.length === 0 ? <p>No students</p> : (
            <table border="1" cellPadding="6">
              <thead><tr><th>Roll</th><th>Name</th><th>P</th><th>A</th></tr></thead>
              <tbody>
                {attendance.map(r => (
                  <tr key={r.roll}>
                    <td>{r.roll}</td>
                    <td>{r.name}</td>
                    <td><input type="radio" name={r.roll} checked={r.status==="P"} onChange={()=>handleStatusChange(r.roll,"P")} /></td>
                    <td><input type="radio" name={r.roll} checked={r.status==="A"} onChange={()=>handleStatusChange(r.roll,"A")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: 12 }}>
            <button onClick={handleSaveAttendance}>Save Attendance</button>
            <button onClick={handleDownload} style={{ marginLeft: 8 }}>Download CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
