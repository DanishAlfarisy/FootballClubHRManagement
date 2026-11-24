
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Layout from './components/Layout';
import DataPage from './components/DataPage';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PersonnelPage from './pages/PersonnelPage';
import DocumentsPage from './pages/DocumentsPage';
import ClubHubPage from './pages/ClubHubPage';
import PayrollPage from './pages/PayrollPage';
import ContractsPage from './pages/ContractsPage';
import ProfilePage from './pages/ProfilePage';
import PersonnelSpecifiedPage from './pages/PersonnelSpecifiedPage'

const configs = {};

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', localStorage.theme === 'dark');

    supabase?.auth.getSession().then((r) => setSession(r.data.session));

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    }).data.subscription;

    if (!supabase) setSession(import.meta.env.DEV ? {} : null);

    return () => subscription?.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Main pages */}
        <Route index element={<Dashboard />} />
        <Route path="players" element={<PersonnelPage type="players" />} />
        <Route path="staff" element={<PersonnelPage type="staff" />} />
        <Route path="players/:id" element={<PersonnelSpecifiedPage type="players" />} />
        <Route path="staff/:id" element={<PersonnelSpecifiedPage type="staff" />} />

        {/* Management pages */}
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="payrolls" element={<PayrollPage />} />
        <Route path="documents" element={<DocumentsPage />} />

        {/* Profile page */}
        <Route path="profile" element={<ProfilePage />} />

        {/* Dynamic data pages */}
        {Object.entries(configs).map(([resource, [title, fields]]) => (
          <Route
            key={resource}
            path={resource}
            element={<DataPage title={title} resource={resource} fields={fields} />}
          />
        ))}

        {/* Club Hub */}
        <Route path="club" element={<ClubHubPage />}>
          <Route
            index
            element={
              <DataPage
                title="Club events"
                resource="events"
                dateField="event_date"
                fields={[
                  { key: 'title', label: 'Title', required: true },
                  { key: 'event_date', label: 'Date', type: 'datetime-local', required: true },
                  { key: 'location', label: 'Location' },
                  { key: 'status', label: 'Status', options: ['Scheduled', 'Completed', 'Cancelled'] },
                  { key: 'description', label: 'Description' },
                ]}
              />
            }
          />

          <Route
            path="achievements"
            element={
              <DataPage
                title="Achievements"
                resource="achievements"
                dateField="achievement_date"
                fields={[
                  { key: 'person_id', label: 'Personnel', optionsResource: 'people', required: true },
                  { key: 'title', label: 'Title', required: true },
                  { key: 'achievement_date', label: 'Date', type: 'date', required: true },
                 {key: 'recipient_type', label: 'Recipient Type', required: true, options: ['Player', 'Staff', 'Team', 'Club']},
                  { key: 'achievement_type', label: 'Achievement Type', required: true, options: ['Individual', 'Team', 'Club'] },
                  { key: 'description', label: 'Description' },
                ]}
              />
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
