# 計画（Plan）

## 運用ルール

- この文書は「現在の計画」を表す。過去ログを増やさない。
- 変更履歴は直近10件までとし、重要判断は ADR に移す。
- 自動実行の対象は「Next」のみとする。Backlog は自動で着手しない。

## 現状（Status）

- フェーズ：**Phase 1 - Frontend MVP 実施中**
- ブロッカー：なし
- 直近の重要決定：
  - Phase 1: N-004（コンポーネント分割）完了 ✅、N-005（React Router 導入）完了 ✅
  - N-005: Must 3件検出（ログアウトガード、テストロジック、日付依存）→ 全修正完了
  - Next が空のため、次のタスク選定が必要

## ロードマップ（概略）

| Phase | 名称 | 目標 | 期間目安 |
|---|---|---|---|
| 0 | Foundation | React + FastAPI基盤構築、提供コード配置 | 1週間 |
| 1 | Frontend MVP | フロントエンド完成、コンポーネント分割 | 2週間 |
| 2 | Backend API | MEXT PDF連携、問題生成API実装 | 2週間 |
| 3 | Deploy | Vercelデプロイ、CI/CD整備 | 1週間 |
| 4 | Polish | パフォーマンス最適化、追加機能 | 継続 |

※ 期間目安は目標であり、検証結果に基づき随時見直す。

## 今月のゴール

- G1: React + FastAPI基盤を構築し、ローカルで動作確認できる状態にする
- G2: フロントエンドをVercelにデプロイし、ブラウザからアクセス可能にする
- G3: MEXT PDF連携・問題生成のMVPを完成させ、エンドツーエンドで動作させる

## Next（自動実行対象：最大3件）

（現在空）

## Done（完了）

### ✅ N-005 React Router の導入とルーティング設定

- PR: #10 (2026-03-05 マージ)
- 成果物: react-router-dom v6 導入、BrowserRouter/Routes/Route 実装、4ルート定義 (/login, /home, /unit-input, /quiz)
- 検証: Jest 67/67 PASS (+8 新規ルーティングテスト), ESLint 0 errors, npm build SUCCESS, pytest 13/13 PASS, policy_check OK
- 監査: 3監査（spec/security/reliability）で Must 3件（全対応済み）、Should 1件
- 成果: App.js 25%削減、SPA ルーティング完全対応

### ✅ N-004 App コンポーネントの分割

- PR: #9 (2026-03-05 マージ)
- 成果物: Login.jsx, Home.jsx, SubjectSelector.jsx, UnitInput.jsx, Quiz.jsx, services/api.js, utils/gradeCalculator.js
- 検証: Jest 59/59 PASS, ESLint 0 errors, npm build SUCCESS, pytest 13/13 PASS, policy_check OK
- 監査: 3監査（spec/security/reliability）で Must 0件、Should 6件全対応（コミナライト完了）
- 成果: App.js 73%削減（400+行 → 110行）、アーキテクチャ準拠

### ✅ N-001 Create React Appセットアップ + 提供コード配置

- PR: #5 (2026-03-04 マージ)
- 成果物: frontend/ ディレクトリ、Tailwind CSS、Lucide React、App.js
- 検証: ESLint 0 errors, npm start 動作確認済み

### ✅ N-002 Python FastAPI基盤のセットアップ

- PR: #6 (2026-03-04 マージ)
- 成果物: backend/main.py, GET /api/health, CORS 設定, requirements.txt
- 検証: pytest 3/3 PASS, policy_check OK

### ✅ N-003 フロントエンド・バックエンド疎通確認

- PR: #7 (2026-03-05 マージ)
- 成果物: API 統合、タイムアウト機能、エラーハンドリング、.env.example
- 検証: pytest 13/13 PASS, Jest 4/4 PASS, CI SUCCESS
- 監査: 3監査（spec/security/reliability）で Must 0件、Should 7件全対応

## Backlog（保留）

### Phase 1: Frontend MVP

- B-003 学年計算ロジックの単体テスト追加
- B-004 レスポンシブデザインの検証とモバイル対応
- B-005 フロントエンドの統合テスト（React Testing Library）

### Phase 2: Backend API

- B-006 MEXT PDF自動取得エンドポイント（GET /api/mext/fetch）
- B-007 PDF解析サービスの実装（PyPDF2 or pdfplumber）
- B-008 問題生成エンドポイント（POST /api/question/generate）
- B-009 フロントエンド・バックエンド統合（API呼び出しの実装）
- B-010 バックエンドの単体・統合テスト
- B-011 エラーハンドリングとロギングの強化

### Phase 3: Deploy

- B-012 Vercelデプロイ設定（vercel.json作成）
- B-013 バックエンドデプロイ（Render/Railway/Heroku検討）
- B-014 環境変数管理（Vercel Secrets, .env.example）
- B-015 CI/CD設定（GitHub Actions: フロントエンドビルド・テスト）
- B-016 本番環境での動作確認とモニタリング設定

### Phase 4: Polish

- B-017 Lighthouse スコア最適化（パフォーマンス80以上）
- B-018 アクセシビリティ改善（WCAG 2.1 AA準拠）
- B-019 学習履歴の保存機能（LocalStorage or バックエンドDB）
- B-020 保護者ダッシュボードの機能拡充

## GitHub Issue / Project 対応表

| 計画 | Issue | Phase | 種別 | 状態 |
|---|---|---|---|---|
| N-001 Create React App + 提供コード配置 | #1 | 0 | enhancement | ✅ CLOSED |
| N-002 Python FastAPI基盤セットアップ | #2 | 0 | enhancement | ✅ CLOSED |
| N-003 フロントエンド・バックエンド疎通確認 | #3 | 0 | enhancement | ✅ CLOSED |
| N-004 App コンポーネントの分割 | #8 | 1 | enhancement | ✅ CLOSED |
| N-005 React Router の導入とルーティング設定 | #11 | 1 | enhancement | ✅ CLOSED |

GitHub Project: [Project Link](https://github.com/users/weimaraner69-crypto/projects/1) （作成予定）

## 直近の変更履歴（最大10件）

- 2026-03-05: Phase 1 開始 — B-001 を N-004（コンポーネント分割）として Next に昇格
- 2026-03-05: **Phase 0 完了** — N-001/N-002/N-003 すべてマージ、Issue #1/#2/#3 自動 Close
- 2026-03-05: N-003 で独立監査を実施（Must 0件、Should 7件全対応）
- 2026-03-04: N-002（FastAPI 基盤）完了、CORS 設定・pytest 実装
- 2026-03-04: N-001（React 基盤）完了、セキュリティ・信頼性監査で2ループ修正
- 2026-03-03: MiraStudyプロジェクトの計画を作成（Phase 0-4、Next 3件、Backlog 20件）
- 2026-03-03: デプロイ先をVercelに決定、バックエンドAPI同時実装の方針確定
- 2026-03-03: ビルドツールをCreate React Appに決定
