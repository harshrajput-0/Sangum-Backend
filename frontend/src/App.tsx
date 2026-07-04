// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './modules/preview/LandingPage'
import About from './modules/preview/About'
import { Layout } from './shared/components/layout/TestLayout'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
        {/* catch-all 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  )
}

export default App