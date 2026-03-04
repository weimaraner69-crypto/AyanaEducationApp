# 計画（Plan）

## 運用ルール

- この文書は「現在の計画」を表す。過去ログを増やさない。
- 変更履歴は直近10件までとし、重要判断は ADR に移す。
- 自動実行の対象は「Next」のみとする。Backlog は自動で着手しない。

## 現状（Status）

- フェーズ：**Phase 0 - Foundation**（React + FastAPIセットアップ段階）
- ブロッカー：なし
- 直近の重要決定：
  - デプロイ先をVercelに決定（フロントエンド）
  - バックエンドAPIも同時実装する方針
  - ビルドツールはCreate React Appを採用

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

### N-001 Create React Appセットアップ + 提供コード配置

- 目的：Reactアプリの基盤を作成し、ユーザー提供のApp.jsxを配置する
- 受入条件：
  - `npx create-react-app frontend` でプロジェクト作成完了
  - Tailwind CSS + Lucide Reactがインストールされている
  - 提供されたApp.jsxコードが動作する
  - `npm start` でローカルサーバーが起動し、ログイン画面が表示される
  - ESLintエラーがない
- 依存：なし
- 触る領域：frontend/, package.json, tailwind.config.js

### N-002 Python FastAPI基盤のセットアップ

- 目的：バックエンドAPIの基盤を構築し、ヘルスチェックエンドポイントを実装する
- 受入条件：
  - FastAPI + Uvicorn がインストールされている
  - `/api/health` エンドポイントが200を返す
  - CORSが設定され、localhostからのアクセスが許可されている
  - `pytest` で基本的なテストが通る
  - pyproject.toml または requirements.txt で依存関係が管理されている
- 依存：なし
- 触る領域：backend/, pyproject.toml or requirements.txt, tests/

### N-003 フロントエンド・バックエンド疎通確認

- 目的：React→FastAPIへの通信が成功することを確認する
- 受入条件：
  - フロントエンドから `/api/health` を呼び出し、レスポンスを表示できる
  - エラーハンドリングが実装されている（ネットワークエラー時の表示）
  - 環境変数でAPIベースURLを切り替え可能（REACT_APP_API_URL）
  - 動作確認のスクリーンショットがPRに添付されている
- 依存：N-001, N-002
- 触る領域：frontend/src/, backend/main.py

## Backlog（保留）

### Phase 1: Frontend MVP

- B-001 Appコンポーネントの分割（Login, Home, SubjectSelector, UnitInput, Quiz）
- B-002 React Routerの導入とルーティング設定
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

| 計画 | Issue | Phase | 種別 |
|---|---|---|---|
| N-001 Create React App + 提供コード配置 | #1 | 0 | enhancement |
| N-002 Python FastAPI基盤セットアップ | #2 | 0 | enhancement |
| N-003 フロントエンド・バックエンド疎通確認 | #3 | 0 | enhancement |

GitHub Project: [Project Link](https://github.com/users/weimaraner69-crypto/projects/1) （作成予定）

## 直近の変更履歴（最大10件）

- 2026-03-03: MiraStudyプロジェクトの計画を作成（Phase 0-4、Next 3件、Backlog 20件）
- 2026-03-03: デプロイ先をVercelに決定、バックエンドAPI同時実装の方針確定
- 2026-03-03: ビルドツールをCreate React Appに決定
