export const metadata = {
  title: "Terms of Service | Dropblox",
  description: "Dropblox Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">1. Introduction</h2>
            <p>Thank you for using Dropblox. These terms govern your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. Accounts</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>You may sign in with your GitHub account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>Accounts found to be abusive may be removed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. Posted Content</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>You are solely responsible for the content you post</li>
              <li>Illegal or harmful content is prohibited</li>
              <li>Content that infringes copyright is prohibited</li>
              <li>We reserve the right to remove content that violates these terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. Roblox Content</h2>
            <p>Dropblox is a platform for sharing Roblox games:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>You must comply with Roblox&apos;s Terms of Service</li>
              <li>Do not misuse Roblox branding or trademarks</li>
              <li>Do not infringe on the intellectual property of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. Disclaimer — Relationship with Roblox</h2>
            <p><strong>Dropblox is not affiliated with, endorsed by, or officially connected to Roblox Corporation in any way.</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>The Roblox name, marks, emblems, and logos are registered trademarks of their respective owners</li>
              <li>Dropblox is a fan-made project by the Roblox community</li>
              <li>Roblox Corporation bears no responsibility for the operation, content, or privacy practices of this service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. Prohibited Conduct</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>Unauthorized access or tampering with the service</li>
              <li>Spamming or harassing other users</li>
              <li>Collecting other users&apos; personal information</li>
              <li>Unsolicited commercial advertising</li>
              <li>Cloning or reproducing the service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. Limitation of Liability</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>The service is provided &quot;as is&quot; without warranties of any kind</li>
              <li>We are not liable for damages caused by service interruptions or downtime</li>
              <li>We do not mediate disputes between users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">8. Changes and Termination</h2>
            <p>We reserve the right to modify or discontinue the service at any time without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">9. Governing Law</h2>
            <p>These terms are governed by applicable law. Any disputes will be resolved in the appropriate jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">10. Contact</h2>
            <p>Questions about these terms? Contact us at:</p>
            <p className="mt-2">Email: <a href="mailto:dropblox.info@proton.me" className="text-emerald-400 hover:underline">dropblox.info@proton.me</a></p>
            <p className="mt-1">GitHub: <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">11. Updates</h2>
            <p>These terms may be updated at any time. Changes take effect when posted on this page.</p>
            <p className="mt-2 text-zinc-400">Last updated: April 9, 2026</p>
          </section>
        </div>
      </div>
    </main>
  );
}
