# 実行コマンド集

## 環境セットアップ
```bash
# Python 環境
source /workspaces/AyanaEducationApp/.venv/bin/activate
cd /workspaces/AyanaEducationApp

# Node 環境（npm確認）
npm --version
node --version
```

## テスト実行
```bash
# Python テスト（全体）
python -m pytest -q tests

# Python テスト（特定ファイル）
python -m pytest -q tests/test_backend_health.py

# Python テスト（詳細出力）
python -m pytest tests -v

# ポリシーチェック実行
python ci/policy_check.py
```

## ビルド
```bash
# フロントエンド（npm）
npm run build

# ローカルサーバー起動（フロント）
npm start

# バックエンド起動（FastAPI）
uvicorn backend.main:app --reload
```

## Git 操作
```bash
# 現在のブランチ確認
git branch -v

# ローカル変更確認
git status

# コミット・プッシュ
git add <files>
git commit -m "type(scope): message"
git push origin <branch>

# PR 作成
gh pr create --title "feat: ..." --body-file pr_body.md --base master

# PR チェック監視
gh pr checks <NUMBER> --watch
```

## その他
```bash
# ファイル検索
find . -name "*.py" -path "*/src/*"

# パターン検索
grep -r "pattern" --include="*.py"

# ディレクトリ構造表示
tree -L 3 -I 'node_modules|__pycache__|.venv'
```

## 重要な制約
- **P-001**: 禁止操作を実装しない（本プロジェクトではデータベース操作、外部API未認可呼び出し等）
- **P-002**: API キー・認証情報・実名・実生年月日をコミットしない → `.env` はローカル保管のみ
- **P-003**: ポリシー方針に違反するコードを書かない
- **AC-020**: テスト失敗の PR はマージ不可（CI 必須通過）
- **NFR-001**: 再現性確保（同一入力 → 同一出力）
