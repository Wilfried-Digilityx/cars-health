import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Car, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { user, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const err = await resetPassword(email)
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
          <p className="text-blue-200 text-sm mt-1">Réinitialiser votre mot de passe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Email envoyé !</h2>
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
                Vérifiez votre email pour les instructions de réinitialisation de mot de passe.
              </div>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center"
              >
                Retour à la connexion
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Mot de passe oublié ?</h2>
              <p className="text-gray-600 text-sm mb-6">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
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
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Mail className="w-4 h-4" /> Envoyer le lien</>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Vous vous souvenez de votre mot de passe ?{' '}
                <button
                  className="text-blue-600 font-medium hover:underline"
                  onClick={() => navigate('/login')}
                >
                  Se connecter
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
