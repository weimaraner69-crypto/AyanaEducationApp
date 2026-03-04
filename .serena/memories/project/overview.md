# MiraStudy プロジェクト概要

## プロジェクト名
MiraStudy - 小中学生向けAI学習支援アプリケーション

## 目的
文部科学省（MEXT）の学習指導要領に基づき、小中学生向けの個別最適化された学習体験を提供する。

## フェーズ
**Phase 0 - Foundation**: React + FastAPI基盤構築、提供コード配置段階

## テックスタック
- **フロントエンド**: React 19.2.4, Tailwind CSS 3.4.19, Lucide React 0.576.0, Create React App
- **バックエンド**: FastAPI 0.115.0, Uvicorn 0.30.0, Python 3.11
- **テスト**: pytest 8.0.0, hypothesis 6.0.0, httpx 0.27.0
- **品質**: GitHub Actions CI, ポリシーチェック（ci/policy_check.py）, ESLint
- **開発環境**: Linux, venv（Python）, npm（Node）

## 重要な設定
- CORS: localhost:{3000,5173} デフォルト + BACKEND_CORS_ORIGINS 環境変数で拡張可
- ユーザープロファイル: ユーザーA（2010-05-15）、ユーザーB（2011-08-20）をダミーデータで使用
- **個人情報対策（P-002）**: 実名・実生年月日は一切記載禁止
- 環境変数: REACT_APP_API_URL でバックエンド URL を指定（フロント）

## 正本（SSOT - Single Source of Truth）
- `docs/requirements.md`: 要件定義
- `docs/plan.md`: 計画・Next/Backlog タスク
- `docs/architecture.md`: システムアーキテクチャ
- `docs/constraints.md`: 制約仕様
- `docs/policies.md`: ポリシー
- `docs/runbook.md`: 運用・セットアップ手順
- `docs/adr/`: 重要判断（Architecture Decision Records）
