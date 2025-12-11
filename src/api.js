import axios from "axios";

const API_BASE = "http://localhost:4000";

export function getStudents() {
  return axios.get(`${API_BASE}/students`).then(res => res.data);
}

export function addStudent(roll, name) {
  return axios.post(`${API_BASE}/students`, { roll, name })
    .then(res => res.data);
}

export function getAttendance(date) {
  return axios
    .get(`${API_BASE}/attendance`, { params: { date } })
    .then(res => res.data);
}

export function saveAttendance(date, records) {
  return axios.post(`${API_BASE}/attendance`, { date, records })
    .then(res => res.data);
}

export function downloadCsv() {
  return axios.get("http://localhost:4000/download-csv", {
    responseType: "blob", // VERY IMPORTANT
  });
}