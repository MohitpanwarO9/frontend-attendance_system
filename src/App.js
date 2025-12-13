import { useEffect, useState } from "react";
import "./App.css";
import {
  getClasses,
  createClass,
  getStudentsForClass,
  addStudentToClass,
  getAttendanceForClass,
  saveAttendanceForClass,
  downloadCsvForClass,
  deleteClassApi,
} from "./api";

const today = new Date().toISOString().slice(0, 10);

function App() {
  const [classes, setClasses] = useState([]);
  const [activeClass, setActiveClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [newClass, setNewClass] = useState("");
  const [roll, setRoll] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    getClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (!activeClass) return;

    Promise.all([
      getStudentsForClass(activeClass),
      getAttendanceForClass(activeClass, today),
    ]).then(([stu, att]) => {
      setStudents(stu);
      setAttendance(att.length ? att : stu.map((s) => ({ ...s, status: "" })));
    });
  }, [activeClass]);

  return (
    <>
      {/* Header */}
      <div className="header">
        <h1>Attendance System</h1>
        <span>{today}</span>
      </div>

      {/* Layout */}
      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <h2>Classes</h2>
          {classes.map((c) => (
            <div
              key={c}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <button
                className={`class-btn ${activeClass === c ? "active" : ""}`}
                onClick={() => setActiveClass(c)}
                style={{ flex: 1 }}
              >
                {c}
              </button>

              <button
                className="delete-btn"
                title="Delete class"
                onClick={async () => {
                  const confirmDelete = window.confirm(
                    `Are you sure you want to delete the class "${c}"?\n\nThis will permanently delete all attendance data.`
                  );

                  if (!confirmDelete) return;

                  await deleteClassApi(c);

                  const updatedClasses = await getClasses();
                  setClasses(updatedClasses);

                  // Reset selection if deleted class was active
                  if (activeClass === c) {
                    setActiveClass("");
                    setStudents([]);
                    setAttendance([]);
                  }
                }}
              >
                🗑
              </button>
            </div>
          ))}

          <div className="new-class">
            <input
              placeholder="New class"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            />
            <button
              onClick={async () => {
                await createClass(newClass);
                setClasses(await getClasses());
                setActiveClass(newClass);
                setNewClass("");
              }}
            >
              Create Class
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {!activeClass ? (
            <p>Select a class to start attendance</p>
          ) : (
            <>
              {/* Add Student */}
              <div className="card">
                <h3>Add Student – {activeClass}</h3>
                <input
                  placeholder="Roll"
                  value={roll}
                  onChange={(e) => setRoll(e.target.value)}
                />
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ marginLeft: 6 }}
                />
                <button
                  onClick={async () => {
                    await addStudentToClass(activeClass, roll, name);
                    setStudents(await getStudentsForClass(activeClass));
                    setRoll("");
                    setName("");
                  }}
                  style={{ marginLeft: 6 }}
                >
                  Add
                </button>
              </div>

              {/* Attendance */}
              <div className="card">
                <h3>Attendance – {today}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Name</th>
                      <th>P</th>
                      <th>A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((s) => (
                      <tr key={s.roll}>
                        <td>{s.roll}</td>
                        <td>{s.name}</td>
                        <td>
                          <input
                            type="radio"
                            checked={s.status === "P"}
                            onChange={() =>
                              setAttendance((prev) =>
                                prev.map((x) =>
                                  x.roll === s.roll ? { ...x, status: "P" } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="radio"
                            checked={s.status === "A"}
                            onChange={() =>
                              setAttendance((prev) =>
                                prev.map((x) =>
                                  x.roll === s.roll ? { ...x, status: "A" } : x
                                )
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="actions">
                  <button
                    onClick={() =>
                      saveAttendanceForClass(
                        activeClass,
                        today,
                        attendance.map((x) => ({
                          roll: x.roll,
                          status: x.status,
                        }))
                      )
                    }
                  >
                    Save Attendance
                  </button>

                  <button onClick={() => downloadCsvForClass(activeClass)}>
                    Download CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
