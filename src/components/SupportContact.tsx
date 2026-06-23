import { useEffect, useMemo, useState } from 'react'
import { Headphones, Mail, MessageCircle } from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

import './SupportContact.css'

type SupportContactVariant = 'banner' | 'card' | 'compact'

type SupportContactProps = {
  variant?: SupportContactVariant
  title?: string
  description?: string
}

type AppSettings = {
  id: string
  support_email: string | null
  support_whatsapp_number: string | null
  support_whatsapp_message: string | null
  show_support_contact: boolean | null
}

function cleanText(value: string | null | undefined): string {
  return (value || '').trim()
}

function createWhatsappLink(number: string, message: string): string {
  const digitsOnly = number.replace(/[^\d]/g, '')
  const encodedMessage = encodeURIComponent(
    message || 'Hi, I need help with TestBridge practice tests.',
  )

  return `https://wa.me/${digitsOnly}?text=${encodedMessage}`
}

function SupportContact({
  variant = 'banner',
  title = 'Need help with TestBridge?',
  description = 'Contact support if you need help with registration, demos, practice tests, or account access.',
}: SupportContactProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSupportSettings() {
      const { data, error } = await supabase
        .from('app_settings')
        .select(
          'id, support_email, support_whatsapp_number, support_whatsapp_message, show_support_contact',
        )
        .eq('id', 'global')
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (error) {
        console.error('Unable to load support contact settings:', error.message)
        setSettings(null)
        setIsLoaded(true)
        return
      }

      setSettings((data as unknown as AppSettings | null) || null)
      setIsLoaded(true)
    }

    void loadSupportSettings()

    return () => {
      isMounted = false
    }
  }, [])

  const supportEmail = cleanText(settings?.support_email)
  const whatsappNumber = cleanText(settings?.support_whatsapp_number)
  const whatsappMessage = cleanText(settings?.support_whatsapp_message)
  const shouldShow =
    Boolean(settings?.show_support_contact) &&
    (Boolean(supportEmail) || Boolean(whatsappNumber))

  const whatsappLink = useMemo(() => {
    if (!whatsappNumber) {
      return ''
    }

    return createWhatsappLink(whatsappNumber, whatsappMessage)
  }, [whatsappMessage, whatsappNumber])

  if (!isLoaded || !shouldShow) {
    return null
  }

  return (
    <section className={`support-contact support-contact-${variant}`}>
      <div className="support-contact-icon">
        <Headphones size={22} />
      </div>

      <div className="support-contact-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="support-contact-actions">
        {supportEmail ? (
          <a
            className="support-contact-link support-contact-email"
            href={`mailto:${supportEmail}`}
          >
            <Mail size={18} />
            <span>{variant === 'compact' ? 'Email' : supportEmail}</span>
          </a>
        ) : null}

        {whatsappNumber ? (
          <a
            className="support-contact-link support-contact-whatsapp"
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={18} />
            <span>{variant === 'compact' ? 'WhatsApp' : 'WhatsApp Support'}</span>
          </a>
        ) : null}
      </div>
    </section>
  )
}

export default SupportContact
