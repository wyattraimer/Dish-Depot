import { useEffect } from 'react'
import dishDepotLogoBadge from '../assets/dishdepot-674x674.png'
import '../privacy-policy.css'

const PRIVACY_PATH = '/privacy'
const PAGE_TITLE = 'Dish Depot Privacy Policy'
const PAGE_DESCRIPTION = 'Dish Depot privacy policy for the iOS, Android, and web versions of the app.'
const PAGE_URL = `https://dishdepot.app${PRIVACY_PATH}`
const OG_IMAGE_URL = 'https://dishdepot.app/android-chrome-512x512.png'

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.append(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('link')
    document.head.append(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = PAGE_TITLE

    upsertMeta('meta[name="description"]', { name: 'description', content: PAGE_DESCRIPTION })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: PAGE_TITLE })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: PAGE_DESCRIPTION })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: PAGE_URL })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: OG_IMAGE_URL })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: PAGE_TITLE })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: PAGE_DESCRIPTION })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: OG_IMAGE_URL })
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: PAGE_URL })
  }, [])

  return (
    <main className="privacy-page-shell">
      <article className="privacy-page-card">
        <div className="privacy-page-eyebrow">
          <img src={dishDepotLogoBadge} alt="Dish Depot logo mark" className="privacy-page-eyebrow-logo" />
          <span>Dish Depot • Privacy Policy</span>
        </div>

        <h1>Dish Depot Privacy Policy</h1>
        <p className="privacy-page-effective-date">
          <strong>Effective date:</strong> May 5, 2026
        </p>

        <section>
          <p>
            This Privacy Policy applies to the Dish Depot mobile apps for iPhone, and Android devices.
          </p>
          <p>Dish Depot is a local-first recipe app. The app does not require an account and does not use a backend server.</p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          <p>Dish Depot does not collect, sell, rent, or share personal information.</p>
          <p>
            Recipes, notes, grocery lists, categories, and backup data are stored locally on your device. If you choose to import a recipe
            from a website, Dish Depot may request the public recipe page so it can try to read available recipe metadata.
          </p>
        </section>

        <section>
          <h2>Local Storage</h2>
          <p>
            Your recipe data is stored on your device. If you delete the app, clear app data, or replace your device, your recipes may be
            lost unless you export a backup.
          </p>
        </section>

        <section>
          <h2>Backups and Sharing</h2>
          <p>
            Dish Depot lets you export, copy, share, and import backup files. You control where those files are saved or shared. Dish
            Depot does not receive or store your backup files.
          </p>
        </section>

        <section>
          <h2>Third-Party Websites</h2>
          <p>
            When you import a recipe from a URL, your device connects to that recipe website. That website may receive standard request
            information, such as your IP address and browser/app request details. Dish Depot does not control third-party websites or their
            privacy practices.
          </p>
        </section>

        <section>
          <h2>Analytics and Advertising</h2>
          <p>Dish Depot does not use analytics, advertising SDKs, tracking SDKs, or crash-reporting services in V1.</p>
        </section>

        <section>
          <h2>Children&apos;s Privacy</h2>
          <p>Dish Depot is not directed to children under 13 and does not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            If Dish Depot adds accounts, cloud sync, analytics, advertising, or crash reporting in the future, this policy will be updated.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions, contact:{' '}
            <a href="mailto:dishdepot.daily523@simplelogin.com">dishdepot.daily523@simplelogin.com</a>
          </p>
        </section>

        <a className="privacy-page-home-link" href="/">
          ← Back to Dish Depot
        </a>
      </article>
    </main>
  )
}
