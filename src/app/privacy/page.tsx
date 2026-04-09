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
              <li><strong>Roblox OAuthデータ</strong>: Robloxユーザー名、ユーザーID（認証およびゲーム情報取得目的のみ）</li>
              <li><strong>Robloxゲーム情報</strong>: 投稿されたゲームのURL、タイトル、説明、サムネイル</li>
              <li><strong>ユーザー生成コンテンツ</strong>: 投稿、コメント、いいねの履歴</li>
              <li><strong>技術情報</strong>: IPアドレス、ブラウザ情報（セキュリティ・分析目的）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. Robloxデータの取り扱い（特記事項）</h2>
            <p><strong>Roblox OAuth認証を通じて取得したデータについて：</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>収集目的</strong>: ユーザー認証、およびユーザーが所有するRobloxゲームの情報取得のみ</li>
              <li><strong>利用範囲</strong>: 認証されたユーザーのみ自身のゲームを投稿可能</li>
              <li><strong>第三者提供</strong>: Robloxデータを第三者に提供することはありません</li>
              <li><strong>分離保管</strong>: Roblox認証情報はゲーム情報と分離して保管されます</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. 情報の利用目的</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>ユーザー認証とアカウント管理</li>
              <li>サービスの提供・改善</li>
              <li>不正利用の防止</li>
              <li>お問い合わせ対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. 情報の第三者提供</h2>
            <p>以下の場合を除き、第三者に個人情報を提供しません：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>ユーザーの同意がある場合</li>
              <li>法的要請がある場合</li>
              <li>サービス提供に必要な範囲での業務委託先</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. データの保護とセキュリティ</h2>
            <p>当社は、ユーザーの個人情報を保護するために以下のセキュリティ対策を実施しています：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>暗号化</strong>: 全てのデータ転送はSSL/TLS暗号化を使用</li>
              <li><strong>認証</strong>: OAuth 2.0による安全な認証フロー</li>
              <li><strong>アクセス制御</strong>: ロールベースのアクセス制御（RBAC）を実装</li>
              <li><strong>データベース保護</strong>: SupabaseのRow Level Security（RLS）を使用</li>
              <li><strong>監査ログ</strong>: 重要な操作のログ記録</li>
            </ul>
            <p className="mt-2"><strong>Robloxデータの特別保護：</strong>Roblox OAuthトークンは暗号化され、有効期限が設定されています。トークンは認証にのみ使用され、他の目的には使用されません。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. データの保持期間と削除</h2>
            <p><strong>保持期間：</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>アカウントがアクティブな間：データを保持</li>
              <li>アカウント削除後：30日以内に全データを完全削除</li>
              <li>法的義務がある場合：必要な期間のみ保持</li>
            </ul>
            <p className="mt-2"><strong>データ削除の方法：</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>アカウント削除：GitHub Issueまたはメールでリクエスト</li>
              <li>特定データの削除：個別にお問い合わせください</li>
              <li>削除確認：削除完了後、確認メッセージを送信</li>
            </ul>
            <p className="mt-2"><strong>Robloxデータの削除：</strong>アカウント削除時、Roblox関連データ（ユーザー名、ID、OAuthトークン）も同時に完全削除されます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. ユーザーの権利</h2>
            <p>ユーザーには以下の権利があります：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>アクセス権</strong>: 自分のデータにアクセスする権利</li>
              <li><strong>訂正権</strong>: 不正確なデータの訂正を求める権利</li>
              <li><strong>削除権</strong>: データの削除を求める権利（「忘れられる権利」）</li>
              <li><strong>制限権</strong>: データ処理の制限を求める権利</li>
              <li><strong>ポータビリティ権</strong>: データの移植を求める権利</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">8. お問い合わせ</h2>
            <p>プライバシーに関するご質問・ご要望は、以下までご連絡ください：</p>
            <p className="mt-2">GitHub: <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></p>
            <p className="mt-1">データ削除のリクエストも上記からお願いします。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">9. 改定</h2>
            <p>本ポリシーは随時改定される場合があります。改定後は本ページに掲載された時点で効力を生じます。</p>
            <p className="mt-2 text-zinc-400">最終更新日: 2025年4月9日</p>
          </section>
        </div>
      </div>
    </main>
  );
}
