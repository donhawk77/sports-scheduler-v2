import { Routes, Route } from 'react-router-dom'
import { LandingView } from './views/LandingView'
import { CoachDashboardView } from './views/CoachDashboardView'
import { VenueDashboardView } from './views/VenueDashboardView'
import { VenueCalendarView } from './views/VenueCalendarView'
import { VenueCreateView } from './views/VenueCreateView'
import { ExploreView } from './views/ExploreView'
import { LoginView } from './views/LoginView'
import { PlayerDashboardView } from './views/PlayerDashboardView'
import { ProfileView } from './views/ProfileView'
import { ActiveSessionView } from './views/ActiveSessionView'
import { SessionEditorView } from './views/SessionEditorView'
import { ScheduleView } from './views/ScheduleView'
import { BookingsView } from './views/BookingsView'
import { MessagesView } from './views/MessagesView'
import { AdminDashboardView } from './views/AdminDashboardView'
import { MediaLibraryView } from './views/MediaLibraryView'
import { SessionDetailView } from './views/SessionDetailView'
import { GigBoardView } from './views/GigBoardView'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RequireAuth } from './components/auth/RequireAuth'

function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingView />} />
          <Route path="/login" element={<LoginView />} />

          {/* Coach Routes - Protected */}
          <Route path="/coach" element={
            <RequireAuth allowedRoles={['coach']}>
              <CoachDashboardView />
            </RequireAuth>
          } />
          <Route path="/coach/library" element={
            <RequireAuth allowedRoles={['coach']}>
              <MediaLibraryView />
            </RequireAuth>
          } />

          {/* Venue Routes - Protected */}
          <Route path="/venue" element={
            <RequireAuth allowedRoles={['venue']}>
              <VenueDashboardView />
            </RequireAuth>
          } />
          <Route path="/venue/calendar" element={
            <RequireAuth allowedRoles={['venue']}>
              <VenueCalendarView />
            </RequireAuth>
          } />
          <Route path="/venue/create" element={
            <RequireAuth allowedRoles={['venue']}>
              <VenueCreateView />
            </RequireAuth>
          } />

          {/* Player Routes - Protected */}
          <Route path="/player" element={
            <RequireAuth allowedRoles={['player']}>
              <PlayerDashboardView />
            </RequireAuth>
          } />
          <Route path="/profile" element={
            <RequireAuth>
              <ProfileView />
            </RequireAuth>
          } />
          <Route path="/bookings" element={
            <RequireAuth>
              <BookingsView />
            </RequireAuth>
          } />
          <Route path="/messages" element={
            <RequireAuth>
              <MessagesView />
            </RequireAuth>
          } />

          {/* Shared/Public Routes */}
          <Route path="/explore" element={<ExploreView />} />
          <Route path="/gigs" element={<GigBoardView />} />

          {/* Session Routes - Mixed Protection */}
          <Route path="/session/active" element={
            <RequireAuth>
              <ActiveSessionView />
            </RequireAuth>
          } />
          <Route path="/session/edit" element={
            <RequireAuth allowedRoles={['coach']}>
              <SessionEditorView />
            </RequireAuth>
          } />
          <Route path="/session/:id" element={<SessionDetailView />} />
          <Route path="/schedule" element={
            <RequireAuth>
              <ScheduleView />
            </RequireAuth>
          } />

          <Route path="/admin" element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminDashboardView />
            </RequireAuth>
          } />
        </Routes>
      </ErrorBoundary>
      <BottomNav />
    </>
  )
}

export default App
