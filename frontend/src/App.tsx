// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/modules/marketing/pages/LandingPage'
import AboutPage from '@/modules/marketing/pages/AboutPage'
import { PublicLayout } from './layouts/PublicLayout'
import ContactPage from './modules/marketing/pages/ContactPage'

import LegalHubPage from '@/modules/marketing/pages/LegalHubPage'
import TermsPage from '@/modules/marketing/legal/TermsPage'
import PrivacyPage from './modules/marketing/legal/PrivacyPolicyPage'
import DisclaimerPage from './modules/marketing/legal/DisclaimerPage'
import CookiePolicyPage from './modules/marketing/legal/CookiePolicyPage'
import RegisterPage from './shared/hooks/RegisterPage'





function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* /legal, /legal/terms, /legal/privacy, /legal/disclaimer, /legal/cookies */}
        <Route path="/legal">
          <Route index element={<LegalHubPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="disclaimer" element={<DisclaimerPage />} />
          <Route path="cookies" element={<CookiePolicyPage />} />
        </Route>

        {/* catch-all 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  )
}

export default App