# タスク完了時のチェックリスト

## 実装完了後

- [ ] ローカルで動作確認（npm start / uvicorn で起動）
- [ ] ESLint 実行: 警告・エラーゼロ
- [ ] pytest 実行: 全テスト合格
- [ ] ポリシーチェック実行: OK
- [ ] git status: 作業ツリー clean（変更全コミット）

## PR 作成前

- [ ] ブランチが最新に更新（git pull origin master）
- [ ] コミットメッセージが「type(scope): message」形式（日本語本文）
- [ ] PR 本文が `.github/PULL_REQUEST_TEMPLATE.md` 構成に沿っている
- [ ] PR 本文に `Closes #XX` を記載（対応する Issue 番号）
- [ ] スクリーンショット・動作確認結果を添付
- [ ] ローカル CI がすべて通過（pytest, policy_check 等）

## PR マージ前（CI 通過確認）

- [ ] GitHub Actions: quality-gate ✓
- [ ] GitHub Actions: secret-scan ✓
- [ ] `gh pr checks <NUMBER>`: All successful
- [ ] Copilot レビューコメント対応完了（Must/Should レベル）
- [ ] auditor-spec / auditor-security / auditor-reliability 監査 OK

## マージ後

- [ ] Issue が自動 close される（`Closes #XX` 指定時）
- [ ] GitHub Project のステータスが「Done」に更新される
- [ ] master ブランチが最新に更新されたことを確認
- [ ] ローカルで `git log master` で新コミットが表示される

## 禁止項目（P-001〜P-002）

- [ ] API キー・トークン・認証情報をコミットしていない
- [ ] 実名・実生年月日をコミットしていない
- [ ] `.env` はローカル保管のみ（リポジトリに `.env.example` は OK）
- [ ] 秘密情報スキャン CI で OK が出ている

## ドキュメント更新（対象時）

- [ ] docs/plan.md の Next/Backlog を更新
- [ ] docs/requirements.md や docs/architecture.md が必要に応じて更新
- [ ] docs/runbook.md に新コマンド・手順を追加（対象時）
- [ ] ADR (docs/adr/) で重要決定を記録（判断が必要な場合）

## 品質チェック（監査対応）

- [ ] 再現性（NFR-001）: 同一入力で同一出力
- [ ] テスト品質（NFR-020）: 重要ロジックは単体テスト必須、境界値テスト含む
- [ ] エラーハンドリング（P-010）: 予期しないエラーは適切に処理
- [ ] 実行確認: 提供されたスクリーンショット・デモは正常に動作
