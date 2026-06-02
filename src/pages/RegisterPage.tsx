import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  UserPlus,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserRole } from '../types'

type RegisterPageProps = {
  onRegisterSuccess: () => Promise<void>
}

function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setErrorMessage('Full name is required.')
      return
    }

    if (!email.trim()) {
      setErrorMessage('Email address is required.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (signUpError) {
      setErrorMessage(signUpError.message)
      setIsLoading(false)
      return
    }

    if (!data.user) {
      setErrorMessage('Unable to create user account.')
      setIsLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      auth_user_id: data.user.id,
      name: name.trim(),
      email: email.trim(),
      role,
    })

    if (profileError) {
      setErrorMessage(profileError.message)
      setIsLoading(false)
      return
    }

    await onRegisterSuccess()

    if (role === 'TUTOR') {
      navigate('/tutor', { replace: true })
    } else {
      navigate('/student', { replace: true })
    }

    setIsLoading(false)
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">
          <UserPlus size={26} />
        </div>

        <p className="eyebrow">Create Account</p>
        <h1>Register on TestBridge</h1>

        <p>
          Create your account as a Test Taker or Test Creator. Admin access is
          assigned separately by the platform owner.
        </p>

        {errorMessage ? (
          <div className="alert-message alert-error">
            {errorMessage}
          </div>
        ) : null}

        <form className="form-card" onSubmit={handleRegister}>
          <label className="form-field">
            <span>Full Name</span>
            <div className="input-with-icon">
              <GraduationCap size={18} />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter full name"
                disabled={isLoading}
              />
            </div>
          </label>

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
                placeholder="Minimum 6 characters"
                disabled={isLoading}
              />
            </div>
          </label>

          <label className="form-field">
            <span>Register As</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              disabled={isLoading}
            >
              <option value="STUDENT">Test Taker</option>
              <option value="TUTOR">Test Creator</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-button full-width-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <UserPlus size={18} />
            )}
            Create Account
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage