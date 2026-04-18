import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './loginPage.jsx'
import Cctv from './cctvPage.jsx'
import Dashboard from './dashboardPage.jsx'
import Trafficlog from './trafficlogPage.jsx'
import Setting from './settingPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cctv" element={<Cctv />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trafficlog" element={<Trafficlog />} />
        <Route path="/setting" element={<Setting />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)