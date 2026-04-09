export const metadata = {
  title: "プライバシーポリシー | Dropblox",
  description: "Dropbloxのプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        
        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">1. 収集する情報</h2>
            <p>Dropbloxでは、以下の情報を収集します：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>GitHubアカウント情報</strong>: ユーザー名、アバターURL、GitHub ID（認証目的）</li>
              <li><strong>Robloxゲーム情報</strong>: 投稿されたゲームのURL、タイトル、説明、サムネイル</li>
              <li><strong>ユーザー生成コンテンツ</strong>: 投稿、コメント、いいねの履歴</li>
              <li><strong>技術情報</strong>: IPアドレス、ブラウザ情報（セキュリティ・分析目的）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. 情報の利用目的</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>ユーザー認証とアカウント管理</li>
              <li>サービスの提供・改善</li>
              <li>不正利用の防止</li>
              <li>お問い合わせ対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. 情報の第三者提供</h2>
            <p>以下の場合を除き、第三者に個人情報を提供しません：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>ユーザーの同意がある場合</li>
              <li>法的要請がある場合</li>
              <li>サービス提供に必要な範囲での業務委託先</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. データの保持期間</h2>
            <p>ユーザーアカウントがアクティブな間、および法的義務を履行するために必要な期間、データを保持します。アカウント削除を希望する場合は、お問い合わせください。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. セキュリティ</h2>
            <p>Supabaseを使用し、業界標準のセキュリティ対策を実施しています。ただし、インターネット上の送信は100%安全とは限りません。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. お問い合わせ</h2>
            <p>プライバシーに関するご質問・ご要望は、以下までご連絡ください：</p>
            <p className="mt-2">GitHub: <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. 改定</h2>
            <p>本ポリシーは随時改定される場合があります。改定後は本ページに掲載された時点で効力を生じます。</p>
            <p className="mt-2 text-zinc-400">最終更新日: 2025年4月9日</p>
          </section>
        </div>
      </div>
    </main>
  );
}
