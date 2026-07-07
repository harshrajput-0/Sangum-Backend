// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/modules/marketing/pages/LandingPage'
import AboutPage from '@/modules/marketing/pages/AboutPage'
import { PublicLayout } from './layouts/PublicLayout'


import LegalLayout from '@/layouts/LegalLayout'
import LegalHubPage from '@/modules/marketing/legal/LegalHubPage'
import PrivacyPage from '@/modules/marketing/legal/PrivacyPage'
import TermsPage from '@/modules/marketing/legal/TermsPage'
import CookiesPage from '@/modules/marketing/legal/CookiesPage'
import DisclaimerPage from '@/modules/marketing/legal/DisclaimerPage'


function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* catch-all 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>


      <Route path="/legal" element={<LegalLayout />}>
        <Route index element={<LegalHubPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="disclaimer" element={<DisclaimerPage />} />
      </Route>
    </Routes>
  )
}

export default App