import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { useForm } from '../hooks/useForm'
import { useToast } from '../context/ToastContext'
import { validateRequired, validateMinLength } from '../utils/validators'
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Info,
  AlertCircle
} from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading: authLoading } = useAuth()
  const { error: toastError } = useToast()
  const [apiError, setApiError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const validate = (values) => {
    const errors = {}
    if (!validateRequired(values.username)) errors.username = 'Username is required'
    if (!validateRequired(values.password)) errors.password = 'Password is required'
    if (values.password && !validateMinLength(values.password, 8)) {
      errors.password = 'Password must be at least 8 characters'
    }
    return errors
  }

  const { values, errors, handleChange, handleSubmit, isSubmitting } = useForm(
    { username: '', password: '' },
    async values => {
      const result = await login(values.username, values.password)
      if (result.success) {
        navigate('/dashboard')
      } else {
        setApiError(result.error)
      }
    },
    validate
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4 relative overflow-hidden">
      {/* Background blobs for premium decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel p-8 md:p-10 border-slate-800 shadow-2xl relative">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 shadow-lg shadow-primary-500/20 mb-3">
              <span className="text-white font-bold text-2xl font-poppins">P</span>
            </div>
            <h1 className="text-3xl font-bold font-poppins bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
              PulseCheck
            </h1>
            <p className="text-slate-400 text-sm mt-1">Outbound Voice Feedback Platform</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {apiError && (
              <div className="flex items-center gap-3 bg-danger-950/40 border border-danger-800/40 text-danger-300 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  name="username"
                  value={values.username}
                  onChange={handleChange}
                  placeholder="operator1, reviewer1, admin"
                  className={`
                    w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border focus:outline-none focus:ring-1 rounded-lg text-slate-200 placeholder-slate-650 transition-all duration-200
                    ${errors.username ? 'border-danger-550 focus:border-danger-550 focus:ring-danger-500/50' : 'border-slate-800 focus:border-primary-500 focus:ring-primary-500/50'}
                  `}
                />
              </div>
              {errors.username && <p className="text-danger-400 text-xs mt-1.5">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`
                    w-full pl-10 pr-10 py-2.5 bg-slate-950/40 border focus:outline-none focus:ring-1 rounded-lg text-slate-200 placeholder-slate-650 transition-all duration-200
                    ${errors.password ? 'border-danger-550 focus:border-danger-550 focus:ring-danger-500/50' : 'border-slate-800 focus:border-primary-500 focus:ring-primary-500/50'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-danger-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={authLoading || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-semibold rounded-lg shadow-lg shadow-primary-600/10 hover:shadow-primary-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {authLoading || isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              <Info className="w-4 h-4 text-primary-400" />
              <span>Demo Credentials</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-450 font-mono">
              <div className="flex justify-between">
                <span>Operator:</span>
                <span className="text-slate-300">operator1 / TestPassword123</span>
              </div>
              <div className="flex justify-between">
                <span>Reviewer:</span>
                <span className="text-slate-300">reviewer1 / TestPassword123</span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="text-slate-300">admin / TestPassword123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
