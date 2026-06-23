import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MessageCircle,
  RefreshCw,
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
  support_email: string | null
  support_whatsapp_number: string | null
  support_whatsapp_message: string | null
  show_support_contact: boolean
  updated_at: string
}

type SettingsFormState = {
  maintenanceMode: boolean
  maintenanceMessage: string
  showSupportContact: boolean
  supportEmail: string
  supportWhatsappNumber: string
  supportWhatsappMessage: string
}

const defaultMaintenanceMessage =
  'TestBridge is currently under maintenance. Please try again later.'

const defaultWhatsappMessage =
  'Hi, I need help with TestBridge practice tests.'

const emptyForm: SettingsFormState = {
  maintenanceMode: false,
  maintenanceMessage: defaultMaintenanceMessage,
  showSupportContact: false,
  supportEmail: '',
  supportWhatsappNumber: '',
  supportWhatsappMessage: defaultWhatsappMessage,
}

function cleanText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function normalizeWhatsappNumber(value: string): string {
  return value.replace(/[^\d+]/g, '').trim()
}

function isValidWhatsappNumber(value: string): boolean {
  const cleaned = normalizeWhatsappNumber(value)

  if (!cleaned) {
    return true
  }

  return /^\+?\d{10,15}$/.test(cleaned)
}

function createForm(settings: AppSettings | null): SettingsFormState {
  if (!settings) {
    return emptyForm
  }

  return {
    maintenanceMode: Boolean(settings.maintenance_mode),
    maintenanceMessage: settings.maintenance_message || defaultMaintenanceMessage,
    showSupportContact: Boolean(settings.show_support_contact),
    supportEmail: settings.support_email || '',
    supportWhatsappNumber: settings.support_whatsapp_number || '',
    supportWhatsappMessage:
      settings.support_whatsapp_message || defaultWhatsappMessage,
  }
}

function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function loadSettings() {
    setIsLoading(true)
    setMessage('')
    setErrorMessage('')

    const { data, error } = await supabase
      .from('app_settings')
      .select(
        [
          'id',
          'maintenance_mode',
          'maintenance_message',
          'support_email',
          'support_whatsapp_number',
          'support_whatsapp_message',
          'show_support_contact',
          'updated_at',
        ].join(', '),
      )
      .eq('id', 'global')
      .maybeSingle()

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    if (!data) {
      const { data: insertedData, error: insertError } = await supabase
        .from('app_settings')
        .insert({
          id: 'global',
          maintenance_mode: false,
          maintenance_message: defaultMaintenanceMessage,
          show_support_contact: false,
          support_email: null,
          support_whatsapp_number: null,
          support_whatsapp_message: defaultWhatsappMessage,
          updated_at: new Date().toISOString(),
        })
        .select(
          [
            'id',
            'maintenance_mode',
            'maintenance_message',
            'support_email',
            'support_whatsapp_number',
            'support_whatsapp_message',
            'show_support_contact',
            'updated_at',
          ].join(', '),
        )
        .single()

      if (insertError) {
        setErrorMessage(insertError.message)
        setIsLoading(false)
        return
      }

      setForm(createForm(insertedData as unknown as AppSettings))
      setIsLoading(false)
      return
    }

    setForm(createForm(data as unknown as AppSettings))
    setIsLoading(false)
  }

  useEffect(() => {
    void loadSettings()
  }, [])

  function updateField<Key extends keyof SettingsFormState>(
    key: Key,
    value: SettingsFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function validateForm(): string | null {
    if (!form.maintenanceMessage.trim()) {
      return 'Maintenance message is required.'
    }

    if (!isValidEmail(form.supportEmail)) {
      return 'Please enter a valid support email address.'
    }

    if (!isValidWhatsappNumber(form.supportWhatsappNumber)) {
      return 'Please enter a valid WhatsApp number with country code, for example +919999999999.'
    }

    if (form.showSupportContact) {
      const hasEmail = Boolean(form.supportEmail.trim())
      const hasWhatsapp = Boolean(form.supportWhatsappNumber.trim())

      if (!hasEmail && !hasWhatsapp) {
        return 'To show support contact, configure at least support email or WhatsApp number.'
      }
    }

    return null
  }

  async function saveSettings() {
    setMessage('')
    setErrorMessage('')

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)

    const cleanedWhatsappNumber = normalizeWhatsappNumber(form.supportWhatsappNumber)

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'global',
        maintenance_mode: form.maintenanceMode,
        maintenance_message:
          form.maintenanceMessage.trim() || defaultMaintenanceMessage,
        show_support_contact: form.showSupportContact,
        support_email: cleanText(form.supportEmail),
        support_whatsapp_number: cleanText(cleanedWhatsappNumber),
        support_whatsapp_message:
          cleanText(form.supportWhatsappMessage) || defaultWhatsappMessage,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    setMessage('Platform settings saved successfully.')
    setIsSaving(false)
    await loadSettings()
  }

  const supportWillShow =
    form.showSupportContact &&
    (Boolean(form.supportEmail.trim()) ||
      Boolean(form.supportWhatsappNumber.trim()))

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Settings</p>
          <h1>Platform and support contact settings</h1>
          <p>
            Control maintenance mode and configure support email or WhatsApp
            contact. Support contact will appear publicly only when enabled and
            configured.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadSettings()}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => void saveSettings()}
            disabled={isSaving || isLoading}
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>

      {message ? (
        <div className="alert-message success-message">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="alert-message error-message">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {isLoading ? (
        <section className="placeholder-card">
          <RefreshCw size={42} className="spin-icon" />
          <h1>Loading settings...</h1>
          <p>Please wait while TestBridge loads platform settings.</p>
        </section>
      ) : (
        <section className="content-grid two-column-grid">
          <article className="content-card">
            <div className="section-title-row">
              <Settings size={22} />
              <h2>Maintenance Mode</h2>
            </div>

            <div className="create-exam-form">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.maintenanceMode}
                  onChange={(event) =>
                    updateField('maintenanceMode', event.target.checked)
                  }
                />
                <span>
                  {form.maintenanceMode
                    ? 'Maintenance mode is ON'
                    : 'Maintenance mode is OFF'}
                </span>
              </label>

              <label className="form-field">
                <span>Maintenance Message</span>
                <textarea
                  rows={4}
                  value={form.maintenanceMessage}
                  onChange={(event) =>
                    updateField('maintenanceMessage', event.target.value)
                  }
                  placeholder={defaultMaintenanceMessage}
                />
              </label>

              <div className="create-exam-note">
                {form.maintenanceMode ? (
                  <ToggleRight size={18} />
                ) : (
                  <ToggleLeft size={18} />
                )}
                <span>
                  When maintenance is ON, public users are blocked, but Admin
                  login remains available so you can turn it OFF.
                </span>
              </div>
            </div>
          </article>

          <article className="content-card">
            <div className="section-title-row">
              <MessageCircle size={22} />
              <h2>Support Contact</h2>
            </div>

            <div className="create-exam-form">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.showSupportContact}
                  onChange={(event) =>
                    updateField('showSupportContact', event.target.checked)
                  }
                />
                <span>Show support contact publicly</span>
              </label>

              <label className="form-field">
                <span>Support Email</span>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={form.supportEmail}
                    placeholder="support@testsbridge.co.in"
                    onChange={(event) =>
                      updateField('supportEmail', event.target.value)
                    }
                  />
                </div>
              </label>

              <label className="form-field">
                <span>WhatsApp Number</span>
                <div className="input-with-icon">
                  <MessageCircle size={18} />
                  <input
                    type="text"
                    value={form.supportWhatsappNumber}
                    placeholder="+919999999999"
                    onChange={(event) =>
                      updateField('supportWhatsappNumber', event.target.value)
                    }
                  />
                </div>
                <small>
                  Use country code. Example for India: +91 followed by mobile
                  number.
                </small>
              </label>

              <label className="form-field">
                <span>Default WhatsApp Message</span>
                <textarea
                  rows={3}
                  value={form.supportWhatsappMessage}
                  onChange={(event) =>
                    updateField('supportWhatsappMessage', event.target.value)
                  }
                  placeholder={defaultWhatsappMessage}
                />
              </label>

              <div className="create-exam-note">
                {supportWillShow ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>
                  {supportWillShow
                    ? 'Support contact is configured and will be shown after we connect it to Home, Contact, Footer, and Demo pages.'
                    : 'Support contact will stay hidden until enabled and at least one contact method is configured.'}
                </span>
              </div>
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default AdminSettingsPage
