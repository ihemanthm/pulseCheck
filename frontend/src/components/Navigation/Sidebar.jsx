import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { 
  LayoutDashboard, 
  ClipboardList, 
  UploadCloud, 
  Phone, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  ArrowRight
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ordersAPI } from '../../api/orders'
import { callsAPI } from '../../api/calls'

export default function Sidebar({ isOpen, toggleCollapse, isCollapsed }) {
  const { user } = useAuth()
  const location = useLocation()
  const [stats, setStats] = useState({ pendingOrders: 0, totalCalls: 0 })

  useEffect(() => {
    async function fetchSidebarStats() {
      try {
        if (!user) return
        const ordersData = await ordersAPI.listOrders('pending', null, 1, 1)
        const callsData = await callsAPI.listCalls(null, 1, 1)
        setStats({
          pendingOrders: ordersData?.total || 0,
          totalCalls: callsData?.total || 0
        })
      } catch (err) {
        console.error('Failed to load sidebar stats', err)
      }
    }
    fetchSidebarStats()
    const interval = setInterval(fetchSidebarStats, 15000)
    return () => clearInterval(interval)
  }, [user])

  const isActive = (path) => location.pathname === path

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['operator', 'reviewer', 'admin'] },
    { path: '/orders', label: 'Orders', icon: ClipboardList, roles: ['operator', 'reviewer', 'admin'] },
    { path: '/upload', label: 'Upload CSV', icon: UploadCloud, roles: ['operator', 'admin'] },
    { path: '/calls', label: 'Call Campaigns', icon: Phone, roles: ['operator', 'reviewer', 'admin'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['reviewer', 'admin'] },
    { path: '/review', label: 'Reviews', icon: ShieldCheck, roles: ['reviewer', 'admin'] },
  ]

  const allowedItems = menuItems.filter(item => item.roles.includes(user?.role))

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300
        md:translate-x-0 md:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-secondary-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <span className="text-white font-bold text-lg font-poppins">P</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold font-poppins bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              PulseCheck
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {allowedItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                ${active 
                  ? 'bg-gradient-to-r from-primary-600/20 to-secondary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(37,99,235,0.05)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
              {!isCollapsed && active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Quick Statistics panel at bottom */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-xl bg-slate-950/40 border border-slate-800/80 animate-fade-in">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Live Monitor</h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Outbound Calls</span>
              <span className="font-mono font-medium text-slate-200">{stats.totalCalls}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Orders in Queue</span>
              <span className={`font-mono font-medium ${stats.pendingOrders > 0 ? 'text-amber-400 animate-pulse-soft' : 'text-slate-400'}`}>
                {stats.pendingOrders}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Footer collapse toggle button */}
      <div className="p-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200 hidden md:block"
        >
          <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  )
}
