# 🏷️ AGENTS.md - Enterprise IT Helpdesk AI プロジェクト

📋 このドキュメントは、Enterprise IT Helpdesk AI プロジェクトで作業するエージェント型コーディングアシスタントのための重要な情報を提供します。

## 🤖 プロジェクト概要

⚙️ これは、社内ITサポート業務向けに設計されたエンタープライズITヘルプデスクAIボットシステムです。このシステムは、専門的な役割を持つ複数のAIエージェントを使用します：

- **🧠 Claude**: 最終応答と判断のための指揮官／意思決定者
- **⚙️ GPT**: 構造化されたコンテンツとテンプレートを生成する実装担当者
- **🔍 Gemini/Perplexity**: 証拠とドキュメントを収集する調査エージェント
- **🔧 OpenCode Agents**: さまざまな開発タスクのための専門サブエージェント

## 🔨 ビルド/リント/テストコマンド

### ビルドコマンド

```bash
npm run build
# クリーン後にビルド
npm run clean && npm run build
# 開発モード
npm run dev
```

### リントコマンド

```bash
npm run lint
# 自動修正付き
npm run lint:fix
# 推奨: JavaScript/TypeScript用ESLint, Python用Ruff
```

### テストコマンド

```bash
npm test
# 監視モード
npm run test:watch
# カバレッジレポート
npm run test:coverage
# 推奨: JavaScript用Jest, Python用pytest
```

### 単一テスト実行

```bash
# Jest: npm test -- --testNamePattern="特定のテスト名"
# pytest: python -m pytest tests/test_file.py::TestClass::test_method -v
# TypeScript型チェック
npm run type-check
```

## 💻 コードスタイルガイドライン

### 一般原則

- ✅ **クロスプラットフォーム互換性**: コードはUbuntu LinuxとWindows 11の両方で動作する必要があります
- ✅ **CLI優先アプローチ**: GUI依存よりもコマンドラインインターフェースを優先
- ✅ **役割分担**: AIエージェントの責任境界を明確に維持
- ✅ **ドキュメント駆動**: すべての決定は文書化された要件に遡及可能であるべき

### 命名規則

#### ファイルとディレクトリ

- ファイル名には `kebab-case` を使用（例: `user-authentication.md`）
- コード内のコンポーネント/クラス名には `PascalCase` を使用
- 変数と関数には `camelCase` を使用
- 定数には `SCREAMING_SNAKE_CASE` を使用

#### AIエージェントの役割

- **Claude**: 意思決定と最終出力責任
- **GPT**: テンプレート生成と構造化コンテンツ作成
- **Gemini**: 一般的なIT知識とベストプラクティスの調査
- **Perplexity**: 引用付きの証拠ベース調査

### インポート整理

```typescript
// タイプごとにグループ化し、アルファベット順に並べる
// 1. 外部ライブラリ
import React from 'react';
import { useState } from 'react';

// 2. 内部モジュール
import { ApiService } from '../services/api';
import { User } from '../types/user';

// 3. 相対インポート
import { formatDate } from './utils';
```

### TypeScript/JavaScriptスタイル

#### 型定義

```typescript
// 明示的な型を使用し、'any'を避ける
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// 制約された値にはユニオン型を使用
type UserRole = 'admin' | 'user' | 'guest';

// オブジェクトにはインターフェースを型エイリアスより優先
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
```

#### エラーハンドリング

```typescript
// 常にエラーを明示的に処理する
try {
  const result = await apiCall();
  return result;
} catch (error) {
  // 適切にエラーをログ出力
  logger.error('API call failed', { error: error.message });

  // ユーザー向けのフレンドリーなエラーメッセージを提供
  throw new UserFriendlyError('Operation failed. Please try again.');
}

// 異なるエラータイプにはカスタムエラークラスを使用
class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}
```

#### Async/Awaitパターン

```typescript
// Promiseよりasync/awaitを優先
async function processUserRequest(userId: string): Promise<UserData> {
  const user = await getUser(userId);
  const permissions = await getUserPermissions(user.id);
  const data = await enrichUserData(user, permissions);

  return data;
}

// 並行処理を適切に処理
async function loadDashboardData(userId: string) {
  const [user, stats, notifications] = await Promise.all([
    getUser(userId),
    getUserStats(userId),
    getNotifications(userId),
  ]);

  return { user, stats, notifications };
}
```

### Pythonスタイル（該当する場合）

#### コード構造

```python
# 型ヒントを使用
from typing import Optional, List, Dict

def process_request(user_id: str, request_data: Dict[str, any]) -> Optional[Response]:
    """
    ユーザーリクエストを適切な検証で処理します。

    Args:
        user_id: ユーザーの一意の識別子
        request_data: 辞書としてのリクエストペイロード

    Returns:
        Responseオブジェクト、または処理に失敗した場合はNone
    """
    try:
        validated_data = validate_request(request_data)
        result = execute_business_logic(validated_data)
        return format_response(result)
    except ValidationError as e:
        logger.error(f"Validation failed: {e}")
        return None
```

### 🔒 セキュリティベストプラクティス

#### 入力検証

- ✅ 常にユーザー入力を検証・サニタイズ
- ✅ データベース操作にはパラメータ化クエリを使用
- ✅ 適切な認証と認可を実装

#### シークレット管理

- 🔒 シークレット、APIキー、認証情報をバージョン管理にコミットしない
- 🔒 環境変数または安全なシークレット管理システムを使用
- 🔒 適切なアクセス制御を実装

#### エラーメッセージ

- 🚨 エラーメッセージで内部システム詳細を公開しない
- 🚨 詳細なエラーは内部でログ出力し、外部にはユーザー向けメッセージを表示

### 📚 ドキュメント標準

#### コードコメント

```typescript
// 関数にはJSDocを使用
/**
 * 指定された認証情報でユーザーを認証します。
 *
 * @param username - ユーザーのユーザー名
 * @param password - ユーザーのパスワード（ハッシュ化されます）
 * @returns 認証結果を解決するPromise
 * @throws {AuthenticationError} 認証情報が無効な場合
 */
async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  // 実装詳細...
}
```

#### AIエージェント通信

- Claudeエージェントは推論を説明し、証拠ベースの決定を提供すべき
- GPTエージェントは正確で構造化された出力生成に集中すべき
- 調査エージェント（Gemini/Perplexity）は引用とソースを提供すべき

### 🖥️ クロスプラットフォーム互換性

#### パス処理

```typescript
// 文字列連結ではなくpath.join()を使用
import path from 'path';

const configPath = path.join(process.cwd(), 'config', 'settings.json');

// Windows互換性のためにハードコードされた区切り文字を避ける
const crossPlatformPath = path.join('data', 'users', userId, 'profile.json');
```

#### 環境変数

- 環境固有の設定には`.env`ファイルを使用
- オプション設定には適切なデフォルトを提供
- 必須の環境変数を文書化

### 🧪 テストガイドライン

#### 単体テスト

```typescript
describe('UserAuthentication', () => {
  it('should authenticate valid users', async () => {
    const result = await authenticateUser('validuser', 'validpass');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await expect(authenticateUser('invalid', 'wrong')).rejects.toThrow(AuthenticationError);
  });
});
```

#### 統合テスト

- AIエージェントの相互作用をテスト
- クロスプラットフォーム互換性を検証
- エラーシナリオと回復をテスト

### 📝 コミットメッセージ規則

```
type(scope): description

Types:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント変更
- style: コードスタイル変更
- refactor: コードリファクタリング
- test: テスト追加
- chore: メンテナンスタスク

Examples:
feat(auth): JWTトークンを使用したユーザー認証を追加
fix(api): リクエストハンドラーのメモリリークを解決
docs(readme): インストール手順を更新
```

### 🔄 開発ワークフロー

1. **計画**: 要件分析と意思決定にClaudeを使用
2. **調査**: 技術情報の収集にGemini/Perplexityを使用
3. **実装**: コード生成にGPTを使用し、特定のタスクにOpenCodeエージェントを使用
4. **レビュー**: Claudeが最終品質保証と統合を監督

### 🔧 OpenCodeエージェントガイドライン

#### 利用可能な専門エージェント

- 💻 **code-implementer**: 実際のコード実装とファイル編集を処理
- 🧪 **test-designer**: テストスイートの作成と管理
- 🔒 **sec-auditor**: セキュリティレビューと脆弱性評価
- 🏗️ **arch-reviewer**: アーキテクチャと設計レビュー
- 🔄 **ci-specialist**: CI/CDパイプライン設定
- 📋 **spec-planner**: 要件分析とタスク分解
- 📖 **ops-runbook**: 運用手順とランブック

#### エージェント協働プロトコル

- 各エージェントは特定の権限と責任を持つ
- セキュリティ関連の変更にはsec-auditorのレビューが必要
- アーキテクチャ変更にはarch-reviewerの承認が必要
- CI変更はci-specialistを通す

このドキュメントは、プロジェクトの進化と新しいコーディング標準の確立に伴って更新されるべきです。
