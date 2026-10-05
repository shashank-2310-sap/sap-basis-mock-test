import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TestSessionProvider } from './context/TestSession'
import { useQuestionSet } from './context/QuestionSetProvider'
import { Home } from './pages/Home'
import { TestSetup } from './pages/TestSetup'
import { TestRunner } from './pages/TestRunner'
import { Practice } from './pages/Practice'
import { Reports } from './pages/Reports'
import { ReportDetail } from './pages/ReportDetail'
import { NotFound } from './pages/NotFound'
import { ValidationError } from './pages/ValidationError'

export default function App() {
  // Fatal data problems in the ACTIVE set stop the app with a developer-facing
  // error, rather than silently running on a broken bank.
  const { set } = useQuestionSet()
  if (!set.validation.ok) return <ValidationError />

  return (
    <TestSessionProvider>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/test" element={<Layout><TestSetup /></Layout>} />
        {/* Full-screen test chrome: no global nav, so the user cannot casually
            navigate away mid-attempt. */}
        <Route path="/test/run" element={<TestRunner />} />
        <Route path="/practice" element={<Layout><Practice /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/report/:id" element={<Layout><ReportDetail /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </TestSessionProvider>
  )
}
