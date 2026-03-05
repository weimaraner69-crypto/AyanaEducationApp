# コードスタイル・規約

## Python

### 書き方
- **型ヒント必須**: 関数署名・変数には型アノテーション記载（PEP 484）
- **Docstring**: 各関数・クラスに日本語 docstring（"""..."""）
- **命名**: 関数/変数は snake_case、クラスは PascalCase
- **インポート**: 標準ライブラリ → サードパーティ → ローカルの順序
- **テスト**: pytest を使用、テストクラス名は `Test*`、テスト関数名は `test_*`

### ポイント
- エラーハンドリング（P-010）: 予期しないエラーは適切に catch・log する
- ダミーデータ: テストには必ずダミーデータのみ使用（実データ使用禁止）
- 境界値テスト: 制約のしきい値ちょうど・直上・直下をテスト

## React/JavaScript

### 書き方
- **命名**: コンポーネントは PascalCase、関数・変数は camelCase
- **Props**: PropTypes または TypeScript で型定義推奨
- **JSX**: self-closing tags 使用（<img /> 等）
- **コメント**: 複雑なロジックには日本語コメント記載

### ESLint
- ESLint は必須実行（CI で自動チェック）
- 警告・エラーはすべて解決（AC-005）
- `.eslintrc` に従う

## ドキュメント

### Markdown
- **言語**: すべて日本語
- **見出し**: # から ### までを使用（#### 以深はコード中）
- **表**: GitHub Flavored Markdown テーブル使用
- **リンク**: 内部ファイルは相対パス使用

### 命名
- `.md` ファイル: ケバブケース（all-lowercase-with-hyphens）
- プロファイル ID: snake_case（user_a, user_b 等）

## テスト

### パターン
- **単体テスト**: 個別関数・クラスのテスト（pytest）
- **統合テスト**: エンドツーエンドのテスト（httpx でモック API テスト等）
- **再現性テスト**: 同一シード・入力で同一出力確認（hypothesis 利用可）

### ルール
- テストには実データを使用しない
- テスト用フィクスチャは conftest.py に集約
- しきい値近辺の境界値テスト必須（CNS に対応）

## CI

### ポリシーチェック（ci/policy_check.py）
- URL 直書き検出（URL_ALLOWLIST_PATTERNS にマッチしない URL を検出）
- 秘密情報検出（API キー、トークン等）
- テスト実行（自動）

### GitHub Actions
- `quality-gate`: ESLint, 型チェック, ポリシーチェック
- `secret-scan`: 秘密情報スキャン
- すべてのチェック通過が PR マージ前提
