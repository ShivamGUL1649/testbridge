import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogIn,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type LoginPageProps = {
  onLoginSuccess: () => Promise<void>
}

function getDashboardPath(profile: UserProfile | null): string {
  if (profile?.role === 'ADMIN') return '/admin'
  if (profile?.role === 'TUTOR') return '/tutor'
  return '/student'
}

async function loadUserProfile(authUserId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_user_id, name, email, role, created_at')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    return null
  }

  return data as unknown as UserProfile
}

function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setErrorMessage('Email address is required.')
      return
    }

    if (!password.trim()) {
      setErrorMessage('Password is required.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    if (!data.user) {
      setErrorMessage('Unable to login. Please try again.')
      setIsLoading(false)
      return
    }

    const profile = await loadUserProfile(data.user.id)

    await onLoginSuccess()

    navigate(getDashboardPath(profile), { replace: true })
    setIsLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">
          <LogIn size={26} />
        </div>

        <p className="eyebrow">Welcome Back</p>
        <h1>Login to TestBridge</h1>

        <p>
          Login as Test Taker, Test Creator, or Admin to continue your testing
          workflow.
        </p>

        {errorMessage ? (
          <div className="alert-message alert-error">
            {errorMessage}
          </div>
        ) : null}

        <form className="form-card" onSubmit={handleLogin}>
          <label className="form-field">
            <span>Email Address</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@mail.com"
                disabled={isLoading}
              />
            </div>
          </label>

          <label className="form-field">
            <span>Password</span>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>
          </label>

          <button
            type="submit"
            className="primary-button full-width-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <LogIn size={18} />
            )}
            Login
          </button>
        </form>

        <p className="auth-switch">
          New user? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage