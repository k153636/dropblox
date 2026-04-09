export const metadata = {
  title: "利用規約 | Dropblox",
  description: "Dropbloxの利用規約",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">利用規約</h1>
        
        <div className="space-y-6 text-zinc-300">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">1. はじめに</h2>
            <p>Dropblox（以下「本サービス」）をご利用いただきありがとうございます。本規約は、本サービスの利用条件を定めるものです。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">2. アカウント</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>GitHubアカウントを使用してログインできます</li>
              <li>アカウント情報の管理責任はユーザーにあります</li>
              <li>不正アカウントは削除される場合があります</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">3. 投稿コンテンツ</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>ユーザーは自分の投稿に対して全責任を負います</li>
              <li>違法コンテンツ、有害コンテンツの投稿は禁止です</li>
              <li>著作権を侵害するコンテンツの投稿は禁止です</li>
              <li>運営は問題のあるコンテンツを削除できる権利を有します</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">4. Roblox関連</h2>
            <p>本サービスはRobloxのコンテンツを共有するプラットフォームです：</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Robloxの利用規約を遵守してください</li>
              <li>Robloxのブランド・商標を不正に使用しないでください</li>
              <li>他者の知的財産権を侵害しないでください</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">5. 免責事項（Robloxとの関係性）</h2>
            <p><strong>Dropbloxは、Roblox Corporationと提携、関連、認可、承認、または何らかの形で公式に接続されているものではありません。</strong></p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Robloxの名称、マーク、エンブレム、およびロゴは、それぞれの所有者の登録商標です</li>
              <li>本サービスはRobloxコミュニティによるファンメイドのプロジェクトです</li>
              <li>Roblox Corporationは本サービスの運営、内容、またはプライバシー慣行について責任を負いません</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">6. 禁止事項</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>本サービスの不正アクセス・改ざん</li>
              <li>スパム行為・嫌がらせ</li>
              <li>他者の個人情報の収集</li>
              <li>商業的な広告・宣伝（許可なく）</li>
              <li>本サービスのクローン作成・無断複製</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">7. 免責事項</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>本サービスは「現状有姿」で提供されます</li>
              <li>運営はサービスの中断・停止による損害を責任を負いません</li>
              <li>ユーザー間のトラブルに運営は関与しません</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">8. サービスの変更・終了</h2>
            <p>運営は、予告なく本サービスの内容を変更し、または提供を終了する権利を有します。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">9. 準拠法・管轄</h2>
            <p>本規約は日本法に準拠し、紛争が生じた場合は日本の裁判所を管轄裁判所とします。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">10. お問い合わせ</h2>
            <p>本規約に関するご質問は、以下までご連絡ください：</p>
            <p className="mt-2">Email: <a href="mailto:dropblox.info@proton.me" className="text-emerald-400 hover:underline">dropblox.info@proton.me</a></p>
            <p className="mt-1">GitHub: <a href="https://github.com/k153636" className="text-emerald-400 hover:underline">@k153636</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-zinc-100">11. 改定</h2>
            <p>本規約は随時改定される場合があります。改定後は本ページに掲載された時点で効力を生じます。</p>
            <p className="mt-2 text-zinc-400">最終更新日: 2026年4月9日</p>
          </section>
        </div>
      </div>
    </main>
  );
}
