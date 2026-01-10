# Enterprise IT Helpdesk AI

🤖 **Enterprise IT Helpdesk AI** は、社内ITサポート業務向けに設計されたインテリジェントなAIボットシステムです。複数のAIエージェントを統合し、IT問い合わせの自動対応を実現します。

## ✨ 特徴

### 🤖 マルチAIエージェント統合

- **Claude** (Anthropic): 最終応答と判断のための指揮官
- **GPT** (OpenAI): 構造化されたコンテンツ生成
- **Gemini** (Google): 調査・証拠収集
- **Perplexity**: 研究ベースの分析

### 🔧 高度な開発支援機能

- **SubAgentシステム**: 7つの専門サブエージェント
  - `code-implementer`: コード実装
  - `test-designer`: テスト設計
  - `sec-auditor`: セキュリティ監査
  - `arch-reviewer`: アーキテクチャレビュー
  - `ci-specialist`: CI/CD管理
  - `spec-planner`: 要件計画
  - `ops-runbook`: 運用ドキュメント

### ⚡ 並列実行 & Git統合

- **ParallelExecutor**: タスクの並列処理
- **GitWorkTreeManager**: 大規模リファクタリング支援
- **HookManager**: 自動品質チェック

### 🔗 MCPツール統合

- **brave-search**: ウェブ検索
- **claude-in-chrome**: ブラウザ自動化
- **context7**: コンテキスト管理
- **github**: リポジトリ操作
- **memory**: 永続ストレージ
- **playwright**: ウェブ自動化
- **plugin:claude-mem:mem-search**: メモリ検索
- **sequential-thinking**: 順次推論

## 🚀 インストール

### 前提条件

- Node.js >= 18.0.0
- npm >= 8.0.0
- SQLite (データベース)

### インストール手順

1. **リポジトリをクローン**

   ```bash
   git clone https://github.com/Kensan196948G/Enterprise-IT-Helpdesk-AI.git
   cd Enterprise-IT-Helpdesk-AI
   ```

2. **依存関係をインストール**

   ```bash
   npm install
   ```

3. **環境変数を設定**

   ```bash
   cp .env.example .env
   # .envファイルを編集してAPIキーを設定
   ```

4. **ビルド**
   ```bash
   npm run build
   ```

## ⚙️ 設定

### APIキー設定 (.env)

```env
# AI エージェント API キー
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIza...

# MCP ツール API キー
GITHUB_TOKEN=ghp_...
BRAVE_API_KEY=...
CLAUDE_MEM_API_KEY=...

# アプリケーション設定
NODE_ENV=development
PORT=3000
```

### 設定ファイル (opencode-config.json)

```json
{
  "agents": {
    "enabled": true,
    "subagents": {
      "code-implementer": { "enabled": true },
      "test-designer": { "enabled": true },
      "sec-auditor": { "enabled": true },
      "arch-reviewer": { "enabled": true },
      "ci-specialist": { "enabled": true },
      "spec-planner": { "enabled": true },
      "ops-runbook": { "enabled": true }
    }
  },
  "hooks": {
    "pre_commit": {
      "lint": true,
      "type_check": true,
      "security_scan": true
    }
  },
  "git_worktree": {
    "enabled": true,
    "ai_coding_integration": true
  },
  "mcp": {
    "enabled": true,
    "tools": ["brave-search", "github", "memory"]
  }
}
```

## 📖 使用方法

### CLIモード

```bash
# インタラクティブモード
npm start

# 直接コマンド実行
npm start -- inquiry --title "Network issue" --category network

# APIサーバーモード
npm start -- --api
```

### API使用例

```bash
# ヘルスチェック
curl http://localhost:3000/health

# 問い合わせ作成
curl -X POST http://localhost:3000/api/v1/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cannot access email",
    "category": "account",
    "priority": "high",
    "content": "Unable to login to Outlook"
  }'

# エージェント一覧
curl http://localhost:3000/api/v1/agents
```

## 🏗️ アーキテクチャ

```
Enterprise IT Helpdesk AI
├── 🤖 AI Agents Layer
│   ├── ClaudeAgent (指揮官)
│   ├── GPTAgent (構造化生成)
│   ├── GeminiAgent (調査)
│   └── PerplexityAgent (研究)
├── 🎯 SubAgent System
│   ├── Code Implementer
│   ├── Test Designer
│   ├── Security Auditor
│   ├── Architecture Reviewer
│   ├── CI Specialist
│   ├── Spec Planner
│   └── Ops Runbook
├── ⚡ Core Systems
│   ├── ResponseCoordinator
│   ├── ParallelExecutor
│   ├── GitWorkTreeManager
│   └── HookManager
├── 🔗 MCP Tools
│   ├── Brave Search
│   ├── GitHub Integration
│   ├── Memory Storage
│   └── Browser Automation
├── 🌐 API Layer
│   ├── REST Endpoints
│   └── WebSocket Support
└── 💾 Database Layer
    ├── User Management
    ├── Inquiry Tracking
    └── Response Storage
```

## 🧪 テスト

```bash
# 全テスト実行
npm test

# 単体テストのみ
npm run test:unit

# 統合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e

# カバレッジレポート
npm run test:coverage
```

## 📊 APIドキュメント

### 主要エンドポイント

#### `POST /api/v1/inquiries`

IT問い合わせを作成し、AIによる自動応答を生成します。

**リクエストボディ:**

```json
{
  "title": "string",
  "category": "network|hardware|software|account|security|other",
  "priority": "low|medium|high|urgent",
  "content": "string",
  "userId": "string (optional)"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "resp_123456",
    "inquiryId": "inq_123456",
    "aiAgent": "claude",
    "content": "解決策の詳細...",
    "confidence": 0.95,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### `GET /api/v1/inquiries`

問い合わせ一覧を取得します。

**クエリパラメータ:**

- `limit`: 取得件数 (デフォルト: 10)
- `offset`: 開始位置 (デフォルト: 0)
- `status`: ステータスフィルタ
- `category`: カテゴリフィルタ

#### `GET /api/v1/agents`

利用可能なAIエージェント一覧を取得します。

#### `GET /api/v1/agents/health`

AIエージェントのヘルスステータスを確認します。

## 🔒 セキュリティ

- **APIキー管理**: 環境変数による安全なAPIキー管理
- **入力検証**: すべての入力に対する検証とサニタイズ
- **レート制限**: APIリクエストに対するレート制限
- **監査ログ**: すべての操作の詳細なログ記録
- **アクセス制御**: ロールベースのアクセス制御

## 🤝 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/Kensan196948G/Enterprise-IT-Helpdesk-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Kensan196948G/Enterprise-IT-Helpdesk-AI/discussions)

## 🙏 謝辞

- [Anthropic Claude](https://www.anthropic.com/) - 優れたAIアシスタント
- [OpenAI GPT](https://openai.com/) - 強力な言語モデル
- [Google Gemini](https://ai.google/) - 革新的なAI技術
- [Perplexity AI](https://www.perplexity.ai/) - 研究支援AI

---

**Enterprise IT Helpdesk AI** - あなたのITサポートを次のレベルへ 🚀
