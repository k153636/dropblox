export const metadata = {
  title: "Privacy Policy | Dropblox",
  description: "Dropblox Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">1. Information We Collect</h2>
            <p>Dropblox collects the following information:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>GitHub account data</strong>: username, avatar URL, GitHub ID (for authentication)</li>
              <li><strong>Roblox OAuth data</strong>: Roblox username and user ID (for authentication and game info retrieval only)</li>
              <li><strong>Roblox game info</strong>: game URL, title, description, and thumbnail from posted games</li>
              <li><strong>User-generated content</strong>: posts, comments, and like history</li>
              <li><strong>Technical data</strong>: IP address and browser info (for security and analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. Roblox Data Handling</h2>
            <p><strong>Regarding data obtained through Roblox OAuth:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Purpose</strong>: user authentication and retrieval of games the user owns — nothing else</li>
              <li><strong>Scope</strong>: only authenticated users may post their own games</li>
              <li><strong>Third parties</strong>: Roblox data is never shared with third parties</li>
              <li><strong>Separation</strong>: Roblox auth credentials are stored separately from game content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>User authentication and account management</li>
              <li>Providing and improving the service</li>
              <li>Preventing abuse and unauthorized access</li>
              <li>Responding to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. Sharing Your Information</h2>
            <p>We do not share personal information with third parties except:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>With your explicit consent</li>
              <li>When required by law</li>
              <li>With service providers necessary to operate the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. Security</h2>
            <p>We protect your data with the following measures:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Encryption</strong>: all data in transit uses SSL/TLS</li>
              <li><strong>Authentication</strong>: secure OAuth 2.0 flows</li>
              <li><strong>Access control</strong>: role-based access control (RBAC)</li>
              <li><strong>Database protection</strong>: Supabase Row Level Security (RLS)</li>
              <li><strong>Audit logging</strong>: critical operations are logged</li>
            </ul>
            <p className="mt-2"><strong>Roblox data protection:</strong> Roblox OAuth tokens are encrypted and expire automatically. Tokens are used solely for authentication.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. Data Retention and Deletion</h2>
            <p><strong>Retention:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>While your account is active: data is retained</li>
              <li>After account deletion: all data is permanently deleted within 30 days</li>
              <li>Legal obligations: data is kept only as long as required by law</li>
            </ul>
            <p className="mt-2"><strong>How to request deletion:</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Account deletion: request via email or GitHub Issue</li>
              <li>Specific data: contact us directly</li>
              <li>Confirmation: we will confirm once deletion is complete</li>
            </ul>
            <p className="mt-2"><strong>Roblox data deletion:</strong> when your account is deleted, all Roblox-related data (username, ID, OAuth tokens) is deleted simultaneously and cannot be recovered.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Access</strong>: view the data we hold about you</li>
              <li><strong>Correction</strong>: request correction of inaccurate data</li>
              <li><strong>Deletion</strong>: request removal of your data ("right to be forgotten")</li>
              <li><strong>Restriction</strong>: request limits on how your data is processed</li>
              <li><strong>Portability</strong>: request a copy of your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">8. Data Deletion Requests</h2>
            <p>You may request deletion of your data at any time through:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Email</strong>: <a href="mailto:dropblox.info@proton.me" className="text-emerald-400 hover:underline">dropblox.info@proton.me</a></li>
              <li><strong>GitHub</strong>: DM or Issue to <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></li>
              <li><strong>Scope</strong>: personal info, Roblox auth data, post history, like history, and all related data</li>
              <li><strong>Timeline</strong>: permanent deletion within 30 days of receiving your request</li>
              <li><strong>Confirmation</strong>: we will notify you on GitHub once deletion is complete</li>
            </ul>
            <p className="mt-3"><strong>Roblox data:</strong> all Roblox OAuth data is deleted along with your account and cannot be recovered.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">9. Contact</h2>
            <p>For privacy questions or requests, contact us at:</p>
            <p className="mt-2">Email: <a href="mailto:dropblox.info@proton.me" className="text-emerald-400 hover:underline">dropblox.info@proton.me</a></p>
            <p className="mt-1">GitHub: <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">10. Updates</h2>
            <p>This policy may be updated at any time. Changes take effect when posted on this page.</p>
            <p className="mt-2 text-zinc-400">Last updated: April 9, 2026</p>
          </section>
        </div>
      </div>
    </main>
  );
}
