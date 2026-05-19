import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { USER_ROLE_LABELS } from '../../utils/constants'
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings,
  Menu,
  X
} from 'lucide-react'

export default function Header({ toggleMobileSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Dummy notifications
  const notifications = [
    { id: 1, title: 'Campaign finished', desc: 'Outbound voice survey for Apple MacBook completed', time: '5m ago', read: false },
    { id: 2, title: 'Escalation Alert', desc: 'Detractor feedback from Jane Smith needs review', time: '1h ago', read: false },
    { id: 3, title: 'CSV uploaded successfully', desc: '124 new orders added to queue', time: '3h ago', read: true }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      {/* Sidebar Toggle for Mobile / Logo info */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleMobileSidebar}
          className="p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Search Bar */}
        <div className="relative hidden sm:block w-64 md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search orders, calls, campaigns..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/50 border border-slate-800/80 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Action Icons & User Dropdown */}
      <div className="flex items-center space-x-4">
        {/* Help Link */}
        <Link 
          to="/help" 
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Documentation"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden animate-slide-up">
              <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                <span className="text-xs text-primary-400 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                {notifications.map(item => (
                  <div key={item.id} className={`p-4 hover:bg-slate-850 transition-colors ${!item.read ? 'bg-primary-950/5' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-semibold ${!item.read ? 'text-primary-400' : 'text-slate-300'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-slate-800 bg-slate-950/20">
                <span className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-medium">View all notifications</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-850 transition-colors"
          >
            {/* Avatar Circle with initials */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-semibold shadow-inner">
              {user?.full_name?.split(' ').map(n => n[0]).join('') || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
                {USER_ROLE_LABELS[user?.role] || 'User'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-450 hidden md:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden py-1 animate-slide-up">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.username}</p>
              </div>
              
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <User className="w-4 h-4 mr-2.5 text-slate-400" />
                Profile
              </Link>
              
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2.5 text-sm text-rose-450 hover:bg-rose-950/20 border-t border-slate-800 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 mr-2.5 text-rose-450" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
