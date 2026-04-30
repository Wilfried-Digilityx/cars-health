import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Car, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { user, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user && success) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSubmitting(true)
    const err = await updatePassword(password)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
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
          <p className="text-blue-200 text-sm mt-1">Créer un nouveau mot de passe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mot de passe réinitialisé !</h2>
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
                Votre mot de passe a été changé avec succès.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center"
              >
                Aller à la connexion
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Créer un nouveau mot de passe</h2>
              <p className="text-gray-600 text-sm mb-6">
                Entrez votre nouveau mot de passe ci-dessous.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Nouveau mot de passe</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input
                    className="form-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Lock className="w-4 h-4" /> Réinitialiser le mot de passe</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
