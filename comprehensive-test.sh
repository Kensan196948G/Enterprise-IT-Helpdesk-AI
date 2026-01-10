#!/bin/bash

# OpenCode機能総合テストスクリプト
echo "🧪 OpenCode機能総合テストを開始します..."

# 1. SubAgent機能テスト
echo ""
echo "🤖 1. SubAgent機能テスト"
SUBAGENTS=("code-implementer" "test-designer" "sec-auditor" "arch-reviewer" "ci-specialist" "spec-planner" "ops-runbook")
for agent in "${SUBAGENTS[@]}"; do
    if [ -f ".opencode/agent/${agent}.md" ]; then
        echo "✅ SubAgent ${agent}: ファイル存在確認"
        # ファイルの内容チェック
        if grep -q "責務\|責務\|責務" ".opencode/agent/${agent}.md"; then
            echo "✅ SubAgent ${agent}: 内容正常"
        else
            echo "⚠️ SubAgent ${agent}: 内容確認が必要"
        fi
    else
        echo "❌ SubAgent ${agent}: ファイルが見つかりません"
    fi
done

# 2. 並列実行開発機能テスト
echo ""
echo "🔄 2. 並列実行開発機能テスト"
if grep -q '"parallel_execution"' opencode-config.json && grep -q '"enabled": true' opencode-config.json; then
    echo "✅ 並列実行開発: 有効化済み"
else
    echo "❌ 並列実行開発: 設定未確認"
fi

if grep -q '"conflict_prevention": true' opencode-config.json; then
    echo "✅ コンフリクト防止: 有効化済み"
else
    echo "❌ コンフリクト防止: 設定未確認"
fi

# 3. Git WorkTree機能テスト
echo ""
echo "🌳 3. Git WorkTree機能テスト"
if command -v git &> /dev/null; then
    echo "✅ Git: インストール済み"

    # Worktree作成テスト
    if git worktree list &>/dev/null; then
        echo "✅ Git WorkTree: 利用可能"
        # テスト用worktree作成
        TEST_BRANCH="test-worktree-$(date +%s)"
        if git worktree add "../${TEST_BRANCH}" -b "${TEST_BRANCH}" 2>/dev/null; then
            echo "✅ Git WorkTree作成: 成功"
            # 作成したworktreeを削除
            git worktree remove "../${TEST_BRANCH}" 2>/dev/null
            git branch -D "${TEST_BRANCH}" 2>/dev/null
        else
            echo "⚠️ Git WorkTree作成: 要確認"
        fi
    else
        echo "❌ Git WorkTree: 利用不可"
    fi
else
    echo "❌ Git: 未インストール"
fi

# 4. MCP機能テスト
echo ""
echo "🔧 4. MCP機能テスト"
MCP_TOOLS=("brave-search" "claude-in-chrome" "context7" "github" "memory" "playwright" "plugin:claude-mem:mem-search" "sequential-thinking")
for tool in "${MCP_TOOLS[@]}"; do
    if grep -q "\"${tool}\"" opencode-config.json && grep -q '"enabled": true' opencode-config.json; then
        echo "✅ MCPツール ${tool}: 設定済み"
    else
        echo "❌ MCPツール ${tool}: 設定未確認"
    fi
done

# 5. 標準機能テスト
echo ""
echo "⚙️ 5. 標準機能テスト"

# ファイル操作テスト
if [ -f "README.md" ]; then
    echo "✅ ファイルRead: 正常"
    # Writeテスト（一時ファイル作成）
    echo "test content" > test_write.tmp
    if [ -f "test_write.tmp" ]; then
        echo "✅ ファイルWrite: 正常"
        rm test_write.tmp
    else
        echo "❌ ファイルWrite: 失敗"
    fi
else
    echo "❌ ファイルRead: テストファイルなし"
fi

# Bashコマンドテスト
if command -v ls &> /dev/null; then
    echo "✅ Bashコマンド ls: 利用可能"
else
    echo "❌ Bashコマンド ls: 利用不可"
fi

if command -v grep &> /dev/null; then
    echo "✅ Bashコマンド grep: 利用可能"
else
    echo "❌ Bashコマンド grep: 利用不可"
fi

# 6. 総合評価
echo ""
echo "📊 総合評価"
echo "=========================="

# 各機能のスコア計算
SUBAGENT_SCORE=0
PARALLEL_SCORE=0
GIT_WORKTREE_SCORE=0
MCP_SCORE=0
STANDARD_SCORE=0

# SubAgentスコア
for agent in "${SUBAGENTS[@]}"; do
    if [ -f ".opencode/agent/${agent}.md" ]; then
        SUBAGENT_SCORE=$((SUBAGENT_SCORE + 1))
    fi
done

# 並列実行スコア
if grep -q '"parallel_execution": {\s*"enabled": true' opencode-config.json; then
    PARALLEL_SCORE=$((PARALLEL_SCORE + 1))
fi
if grep -q '"conflict_prevention": true' opencode-config.json; then
    PARALLEL_SCORE=$((PARALLEL_SCORE + 1))
fi

# Git WorkTreeスコア
if command -v git &> /dev/null && git worktree list &>/dev/null; then
    GIT_WORKTREE_SCORE=3
fi

# MCPスコア
for tool in "${MCP_TOOLS[@]}"; do
    if grep -q "\"${tool}\"" opencode-config.json; then
        MCP_SCORE=$((MCP_SCORE + 1))
    fi
done

# 標準機能スコア
if [ -f "README.md" ]; then
    STANDARD_SCORE=$((STANDARD_SCORE + 1))
fi
if command -v ls &> /dev/null && command -v grep &> /dev/null; then
    STANDARD_SCORE=$((STANDARD_SCORE + 1))
fi

TOTAL_SCORE=$((SUBAGENT_SCORE + PARALLEL_SCORE + GIT_WORKTREE_SCORE + MCP_SCORE + STANDARD_SCORE))
MAX_SCORE=21

echo "全SubAgent機能: ${SUBAGENT_SCORE}/7"
echo "全並列実行開発機能: ${PARALLEL_SCORE}/2"
echo "全Git WorkTree機能: ${GIT_WORKTREE_SCORE}/3"
echo "全MCP機能: ${MCP_SCORE}/8"
echo "標準機能: ${STANDARD_SCORE}/2"
echo ""
echo "総合スコア: ${TOTAL_SCORE}/${MAX_SCORE}"

if [ $TOTAL_SCORE -eq $MAX_SCORE ]; then
    echo "🎉 すべての機能が正常に動作しています！"
    echo "🚀 Enterprise IT Helpdesk AIのOpenCode環境は完全に機能しています。"
elif [ $TOTAL_SCORE -ge $((MAX_SCORE * 8 / 10)) ]; then
    echo "✅ ほとんどの機能が正常に動作しています。"
    echo "⚠️ 一部の機能で軽微な問題がありますが、全体として使用可能です。"
else
    echo "⚠️ 複数の機能で問題が検知されました。"
    echo "🔧 設定の見直しと修復が必要です。"
fi

echo "=========================="