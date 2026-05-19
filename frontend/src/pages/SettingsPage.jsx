import { useState } from 'react'
import { useAuth } from '../hooks'
import { useToast } from '../context/ToastContext'
import { 
  User, 
  Settings as SettingsIcon, 
  Key, 
  Bell, 
  Lock, 
  Copy, 
  Check, 
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  // Tab State
  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState('ihemanthm@gmail.com')
  const [phone, setPhone] = useState('+1 555-0199')

  // Password reset Form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Notification toggles state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    detractorEscalation: true,
    weeklyReport: true
  })

  // API Key State
  const [apiKey, setApiKey] = useState('pc_live_51MzkxNDc1OTIwMDB...')
  const [isKeyCopied, setIsKeyCopied] = useState(false)

  const handleProfileSave = (e) => {
    e.preventDefault()
    success('Profile updated successfully!')
  }

  const handlePasswordReset = (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      showError('Confirm password does not match new password.')
      return
    }
    setIsResetting(true)
    setTimeout(() => {
      setIsResetting(false)
      success('Password successfully reset!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }, 1000)
  }

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    success('Preferences updated!')
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText('pc_live_51MzkxNDc1OTIwMDB4YzljY2ZhYjg5NWE1OTRh')
    setIsKeyCopied(true)
    success('API Key copied to clipboard')
    setTimeout(() => setIsKeyCopied(false), 2000)
  }

  const generateNewKey = () => {
    setApiKey('pc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
    success('New API key generated successfully')
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-primary-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Configure profile preferences, user credentials, notification templates, and API integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar (Left Column) */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-primary-600/20 to-secondary-500/10 border border-primary-500/20 text-primary-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'notifications' 
                ? 'bg-gradient-to-r from-primary-600/20 to-secondary-500/10 border border-primary-500/20 text-primary-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notification Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'security' 
                ? 'bg-gradient-to-r from-primary-600/20 to-secondary-500/10 border border-primary-500/20 text-primary-400' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API & Security</span>
          </button>
        </div>

        {/* Content Panel (Right Column) */}
        <div className="flex-1 glass-panel p-6 border-slate-800">
          
          {/* PROFILE SETTINGS TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
                General Profile Details
              </h3>
              
              <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Username</label>
                    <input 
                      type="text" 
                      value={user?.username || ''} 
                      disabled
                      className="w-full bg-slate-950/40 border border-slate-850 rounded-lg px-4 py-2.5 text-slate-400 text-sm outline-none cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">User Role</label>
                    <input 
                      type="text" 
                      value={user?.role || ''} 
                      disabled
                      className="w-full bg-slate-950/40 border border-slate-850 rounded-lg px-4 py-2.5 text-slate-400 text-sm outline-none cursor-not-allowed capitalize" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Full Display Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name" 
                    className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">E-Mail Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Mobile Phone</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555-0100" 
                    className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white shadow-md active:scale-95 transition-all"
                  >
                    Save Profiles Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* NOTIFICATION PREFERENCES TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
                Webhook & Notification Alerts
              </h3>

              <div className="space-y-5 max-w-xl">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Email Alerts</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Receive daily notifications of detractor reviews.</p>
                  </div>
                  <button onClick={() => toggleNotification('emailAlerts')} className="text-primary-500">
                    {notifications.emailAlerts ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">SMS / SMS Warnings</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Get immediate texts when high severity issues are flagged.</p>
                  </div>
                  <button onClick={() => toggleNotification('smsAlerts')} className="text-primary-500">
                    {notifications.smsAlerts ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Detractor Escalation Queue</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Push negative reviews directly to slack feedback channels.</p>
                  </div>
                  <button onClick={() => toggleNotification('detractorEscalation')} className="text-primary-500">
                    {notifications.detractorEscalation ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Weekly Reports Digest</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Generate weekly visual NPS digests to admin dashboard.</p>
                  </div>
                  <button onClick={() => toggleNotification('weeklyReport')} className="text-primary-500">
                    {notifications.weeklyReport ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & API KEYS TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              {/* API Key Panel */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider border-b border-slate-850 pb-3">
                  API Key Management
                </h3>
                <p className="text-xs text-slate-500 max-w-lg">
                  Use this token to push external orders or register custom webhooks into PulseCheck platform using cURL.
                </p>

                <div className="flex items-center gap-3 max-w-lg">
                  <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-xs font-mono text-slate-300 overflow-x-auto whitespace-nowrap">
                    {apiKey}
                  </div>
                  <button
                    onClick={copyApiKey}
                    className="p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy to Clipboard"
                  >
                    {isKeyCopied ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={generateNewKey}
                    className="p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Regenerate Key"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Password Reset */}
              <div className="space-y-4 pt-4 border-t border-slate-850">
                <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider pb-1">
                  Change Credentials
                </h3>

                <form onSubmit={handlePasswordReset} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPass ? 'text' : 'password'} 
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-955/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-4 py-2.5 text-slate-200 text-sm outline-none transition-all" 
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isResetting ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
