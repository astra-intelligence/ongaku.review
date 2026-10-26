---
name: writing-commit-messages
description: Gitコミットメッセージを変更内容に合うprefix付きの規約に整えます。コミットメッセージを作成・提案・確認するときに使用します。
---

# コミットメッセージの作成

## 適用範囲と例外

- エージェントが作成する通常コミットに適用する。
- ユーザーがコミットメッセージを明示した場合は、その指定を優先する。prefixの追加や書き換えを強制しない。
- GitHubが自動生成するmerge commitは対象外とする。

## メッセージの作成

1. コミット対象の差分を確認する。ステージ済みの変更をコミットする場合は `git diff --cached` を基準にする。
2. ユーザーによるメッセージ指定がなければ、Conventional Commitsの `<type>: <summary>` 形式にする。下表から変更の主目的に合うtypeを1つ選び、prefixを必須にする。
3. summaryには差分で実際に変わる内容を簡潔に書く。作成・確認時に、typeが下表の小文字表記であること、コロンの後に半角スペースがあること、summaryが空でないことを確認する。

| type | 選ぶ変更 |
| --- | --- |
| `feat` | 機能の追加 |
| `fix` | 不具合の修正 |
| `perf` | 性能の改善 |
| `refactor` | 振る舞いを変えないコード構造の整理 |
| `docs` | ドキュメントの追加・修正 |
| `test` | テストの追加・修正 |
| `build` | ビルド処理や依存関係の変更 |
| `ci` | CIの設定・処理の変更 |
| `chore` | 上記に当てはまらない保守作業 |

## 例

```text
feat: add search filters
fix: preserve form input after validation errors
docs: clarify local setup steps
```
