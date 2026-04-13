# アーキテクチャ（Architecture）

## 目的

MiraStudyアプリのフロントエンド（React）とバックエンド（FastAPI）の責務境界を明確にし、
実装・テスト・デプロイを容易にする。

## システム構成

```text
┌─────────────────────────────────────────────────────────┐
│                    User (Browser)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Vercel (Frontend Hosting)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  React SPA (Create React App)                      │ │
│  │  - Login, Home, Subject, Quiz UI                   │ │
│  │  - State Management (useState, useContext)         │ │
│  │  - Tailwind CSS + Lucide Icons                     │ │
│  └─────────────────┬──────────────────────────────────┘ │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ REST API (CORS enabled)
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Backend API (Render/Railway/Heroku)             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  FastAPI (Python 3.11+)                            │ │
│  │  - /api/health                                     │ │
│  │  - /api/mext/fetch (MEXT PDF取得・検証)            │ │
│  │  - /api/question/generate (問題生成)               │ │
│  │  - /api/pdf/process (PDF URL指定ダウンロード＆解析)│ │
│  │  - /api/pdf/upload (PDFファイルアップロード＆解析) │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────────┐ │
│  │  Services                                          │ │
│  │  - mext_fetcher.py (PDF取得)                       │ │
│  │  - question_generator.py (問題生成)                │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────┼────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│          文部科学省 公式サイト                           │
│          https://www.mext.go.jp/...                     │
└─────────────────────────────────────────────────────────┘
```

## モジュール責務

### Frontend (React)

```text
frontend/
├─ public/
│  ├─ index.html
│  └─ favicon.ico
├─ src/
│  ├─ App.jsx (初期段階: モノリシックコンポーネント)
│  ├─ index.js
│  ├─ index.css (Tailwind imports)
│  ├─ components/ (Phase 1で分割)
│  │  ├─ Login.jsx
│  │  ├─ Home.jsx
│  │  ├─ SubjectSelector.jsx
│  │  ├─ UnitInput.jsx
│  │  ├─ Quiz.jsx
│  │  └─ ParentDashboard.jsx
│  ├─ services/ (API呼び出し)
│  │  └─ api.js
│  ├─ utils/ (ユーティリティ関数)
│  │  └─ gradeCalculator.js
│  └─ __tests__/ (テスト)
├─ package.json
└─ tailwind.config.js
```

### Backend (FastAPI)

```text
backend/
├─ main.py (FastAPIアプリケーション)
├─ routers/
│  ├─ health.py
│  ├─ mext.py (MEXT PDF関連エンドポイント)
│  └─ question.py (問題生成エンドポイント)
├─ services/
│  ├─ mext_fetcher.py (文科省サイトからPDF取得)
│  └─ question_generator.py (問題生成ロジック)
├─ models/
│  ├─ request.py (リクエストモデル)
│  └─ response.py (レスポンスモデル)
├─ tests/
│  ├─ test_health.py
│  ├─ test_mext.py
│  └─ test_question.py
└─ requirements.txt or pyproject.toml
```

## データフロー

### 1. ログイン・プロファイル選択

```text
User → Login.jsx → プロファイル選択 → 学年計算 → Home.jsx表示
```

### 2. 単元入力・問題生成（B-009: 2段階呼び出し）

```text
1. User → SubjectSelector.jsx → 教科選択
2. User → UnitInput.jsx → 単元名入力
3. Frontend → GET /api/mext/fetch → Backend → 文科省サイト → 候補URL一覧取得
4. Frontend → POST /api/pdf/process (processPdf) → Backend
   - Backend: URL検証（SSRF保護 C-001）→ PDFダウンロード → parse_mext_pdf → テキスト・表データ返却
5. Frontend → POST /api/question/generate (generateQuestion) → Backend
   - Backend: PDF解析結果を受け取り → question_generator.py → 問題文・選択肢・正答生成
6. Backend → Response → Frontend
7. Frontend → Quiz.jsx → 問題表示
```

### 3. 保護者ダッシュボード（MEXT URL検証）

```text
1. User → ParentDashboard.jsx → 「最新URLを取得」ボタンクリック
2. Frontend → GET /api/mext/fetch → Backend
3. Backend → mext_fetcher.py → 文科省サイトスクレイピング
4. Backend → URL実在性確認 (HTTP HEAD →200 OK)
5. Backend → Response (検証済みURL一覧) → Frontend
6. Frontend → URLリスト表示
```

## 依存ルール

| モジュール                  | 依存してよい                       | 依存禁止                |
| --------------------------- | ---------------------------------- | ----------------------- |
| Frontend (components)       | services, utils                    | Backend直接呼び出し     |
| Frontend (services/api.js)  | 外部: Backend API                  | components              |
| Frontend (utils)            | （なし：最下層）                   | services, components    |
| Backend (routers)           | services, models                   | （なし）                |
| Backend (services)          | models, 外部: requests, pdfplumber | routers                 |
| Backend (models)            | （なし：最下層）                   | routers, services       |

### 重要な制約

- フロントエンドはバックエンドAPIを `services/api.js` 経由でのみ呼び出す
- コンポーネントは直接 `fetch` を使用せず、`api.js` の関数を使用する
- バックエンドのルーターはビジネスロジックを持たず、サービスに委譲する
- サービス層はルーターから独立してテスト可能にする

**Phase 0 での例外（実装簡略化）:**

- N-003（フロントエンド・バックエンド疎通確認）段階では、`App.jsx` が直接 `fetch` でヘルスチェックを呼び出すことを例外的に許容する
- Phase 1 の B-001（コンポーネント分割）でアプリケーション構造が整備される際に、`services/api.js` を整備し、すべての API 呼び出しをそこ経由に統一する

## 技術スタック

### Frontend

| 項目            | 技術                           |
| --------------- | ------------------------------ |
| Framework       | React 18+                      |
| Build Tool      | Create React App               |
| Styling         | Tailwind CSS 3+                |
| Icons           | Lucide React                   |
| State Management| useState, useContext (初期)    |
| Routing         | React Router v6 (Phase 1)      |
| Test            | React Testing Library, Jest    |
| Deploy          | Vercel                         |

### Backend

| 項目            | 技術                           |
| --------------- | ------------------------------ |
| Framework       | FastAPI 0.100+                 |
| Language        | Python 3.11+                   |
| Server          | Uvicorn                        |
| PDF Parsing     | pdfplumber or PyPDF2           |
| HTTP Client     | httpx or requests              |
| Test            | pytest, pytest-asyncio         |
| Deploy          | Render / Railway / Heroku      |

### CI/CD

| 項目            | 技術                           |
| --------------- | ------------------------------ |
| VCS             | GitHub                         |
| CI              | GitHub Actions                 |
| Lint (Frontend) | ESLint                         |
| Lint (Backend)  | Ruff or Flake8                 |
| Type (Backend)  | mypy                           |

## 不変条件

- 禁止操作を実装しない（P-001）
- APIキー・トークンをコミットしない（P-002）
- 判断不能時は安全側に倒す（P-010: フェイルクローズ）
- フロントエンドは常にバックエンドAPIを信頼せず、エラーハンドリングを実装する
- バックエンドは常に入力をバリデーションし、不正な入力を拒否する
- 文科省サイトへのリクエストはレート制限を尊重する（1秒に1リクエスト以下）

## セキュリティ考慮事項

### フロントエンド

- XSS対策：Reactのデフォルトエスケープを利用、`dangerouslySetInnerHTML` 禁止
- CSRF対策：APIトークン使用時はHTTPOnlyクッキーまたはヘッダートークン
- 入力バリデーション：単元名は100文字以内、特殊文字のサニタイズ

### バックエンド

- CORS設定：許可するオリジンを環境変数で管理（本番・開発で切替）
- レート制限：同一IPからのリクエストを制限（FastAPI Limiter使用検討）
- PDF解析：ファイルサイズ上限（10MB）、タイムアウト設定（30秒）
- ログ出力：個人情報（生年月日、名前）をログに出力しない

## デプロイ戦略

### CI/CD パイプライン

```text
1. Push to feature branch
   ↓
2. GitHub Actions
   - Frontend: npm test, npm run build
   - Backend: pytest, ruff, mypy
   ↓
3. PR作成・レビュー
   ↓
4. Merge to main
   ↓
5. Vercel自動デプロイ（Frontend）
   Backend手動デプロイ（初期）→ 自動化（Phase 3）
```

### 環境変数管理

| 変数名               | 用途                           | 設定場所               |
| -------------------- | ------------------------------ | ---------------------- |
| REACT_APP_API_URL    | バックエンドAPIのURL           | Vercel環境変数         |
| BACKEND_CORS_ORIGINS | 許可するCORSオリジン           | Render/Railway環境変数 |
| MEXT_RATE_LIMIT      | 文科省サイトへのレート制限     | Render/Railway環境変数 |

## 設計論点（必要に応じて ADR）

- 状態管理ライブラリ（Redux/Zustand）の導入判断 → Phase 2で再評価
- バックエンドのデータベース導入タイミング → Phase 4で検討（学習履歴保存時）
- AI問題生成の実装方法（OpenAI API or ローカルモデル） → Phase 2で決定

```text
（設計論点は随時追記）
```
