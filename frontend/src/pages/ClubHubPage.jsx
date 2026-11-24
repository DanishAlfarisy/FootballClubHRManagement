import { NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, Trophy } from 'lucide-react'

export default function ClubHubPage() {
  return <><div className="subnav"><NavLink to="/club" end><CalendarDays />Events</NavLink><NavLink to="/club/achievements"><Trophy />Achievements</NavLink></div><Outlet /></>
}