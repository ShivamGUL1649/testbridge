import { useEffect, useState } from 'react'
import {
  Loader2,
  RefreshCcw,
  Save,
  Settings,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type AppSettings = {
  id: string
  maintenance_mode: boolean
  maintenance_message: string
  updated_at: string
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadSettings() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('id, maintenance_mode, maintenance_message, updated_at')
        .eq('id', 'global')
        .single()

      if (error) {
        setErrorMessage(error.message)
        setSettings(null)
        return
      }

      const loadedSettings = data as AppSettings

      setSettings(loadedSettings)
      setMaintenanceMode(loadedSettings.maintenance_mode)
      setMaintenanceMessage(loadedSettings.maintenance_message)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load platform settings.'

      setErrorMessage(message)
      setSettings(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!maintenanceMessage.trim()) {
      setErrorMessage('Maintenance message is required.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'global')

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Platform settings updated successfully.')

      await loadSettings()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save platform settings.'

      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Platform Settings</h1>
          <p>Please wait while we load maintenance settings.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Control Center</p>
          <h1>Platform Settings</h1>
          <p>
            Control TestBridge availability using Maintenance Mode. Admin users
            can still access the platform when maintenance mode is enabled.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadSettings()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">{successMessage}</div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Maintenance Mode</h2>
              <p>
                Turn this ON when you want to temporarily stop Test Taker and
                Test Creator access.
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={saveSettings}>
            <label className="form-field">
              <span>Current Status</span>

              <button
                type="button"
                className={maintenanceMode ? 'danger-button' : 'primary-button'}
                onClick={() => setMaintenanceMode((current) => !current)}
              >
                {maintenanceMode ? (
                  <ToggleRight size={20} />
                ) : (
                  <ToggleLeft size={20} />
                )}
                {maintenanceMode
                  ? 'Maintenance Mode ON'
                  : 'Maintenance Mode OFF'}
              </button>
            </label>

            <label className="form-field">
              <span>Maintenance Message</span>
              <textarea
                value={maintenanceMessage}
                onChange={(event) =>
                  setMaintenanceMessage(event.target.value)
                }
                rows={5}
                placeholder="Enter message users will see during maintenance"
                disabled={isSaving}
              />
            </label>

            <button
              type="submit"
              className="primary-button full-width-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>How It Works</h2>
              <p>Maintenance mode gives admin control over platform access.</p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>Maintenance OFF</strong>
              <span>
                Test Creators, Test Takers, and Admin users can access the
                platform normally.
              </span>
            </div>

            <div className="flow-item">
              <strong>Maintenance ON</strong>
              <span>
                Test Creators and Test Takers see the maintenance message.
              </span>
            </div>

            <div className="flow-item">
              <strong>Admin Access</strong>
              <span>
                Admin users can still login, open settings, and turn maintenance
                mode OFF.
              </span>
            </div>

            <div className="flow-item">
              <strong>Last Updated</strong>
              <span>
                {settings?.updated_at
                  ? new Date(settings.updated_at).toLocaleString()
                  : 'Not available'}
              </span>
            </div>
          </div>

          <div
            className={
              maintenanceMode
                ? 'alert-message alert-error create-exam-note'
                : 'alert-message alert-success create-exam-note'
            }
          >
            <Settings size={18} />
            {maintenanceMode
              ? 'Platform is currently in maintenance mode.'
              : 'Platform is currently available.'}
          </div>
        </article>
      </section>
    </main>
  )
}

export default AdminSettingsPage