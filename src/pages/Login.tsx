import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Car, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)
    if (mode === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setInfo('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Cars Health</h1>
          <p className="text-blue-200 text-sm mt-1">Suivi de maintenance de vos véhicules</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
              {isSubmitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <><LogIn className="w-4 h-4" /> Se connecter</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Créer le compte</>
              )}
            </button>
            {mode === 'login' && (
              <p className="text-center text-sm text-gray-500 mt-3">
                <button className="text-blue-600 hover:underline" onClick={() => navigate('/forgot-password')}>
                  Mot de passe oublié ?
                </button>
              </p>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>Pas encore de compte ?{' '}
                <button className="text-blue-600 font-medium hover:underline" onClick={() => { setMode('signup'); setError(null) }}>
                  S'inscrire
                </button>
              </>
            ) : (
              <>Déjà un compte ?{' '}
                <button className="text-blue-600 font-medium hover:underline" onClick={() => { setMode('login'); setError(null) }}>
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
