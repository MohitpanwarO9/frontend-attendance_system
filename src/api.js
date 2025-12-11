// src/api.js
import axios from "axios";
const API_BASE = "http://localhost:4000";

export function getClasses() {
  return axios.get(`${API_BASE}/classes`).then(r => r.data);
}
export function createClass(className) {
  return axios.post(`${API_BASE}/classes`, { className }).then(r => r.data);
}

export function getStudentsForClass(className) {
  return axios.get(`${API_BASE}/classes/${encodeURIComponent(className)}/students`).then(r => r.data);
}
export function addStudentToClass(className, roll, name) {
  return axios.post(`${API_BASE}/classes/${encodeURIComponent(className)}/students`, { roll, name }).then(r => r.data);
}

export function getAttendanceForClass(className, date) {
  return axios.get(`${API_BASE}/classes/${encodeURIComponent(className)}/attendance`, { params: { date } }).then(r => r.data);
}
export function saveAttendanceForClass(className, date, records) {
  return axios.post(`${API_BASE}/classes/${encodeURIComponent(className)}/attendance`, { date, records }).then(r => r.data);
}

export function downloadCsvForClass(className) {
  return axios.get(`${API_BASE}/classes/${encodeURIComponent(className)}/download-csv`, { responseType: "blob" });
}
