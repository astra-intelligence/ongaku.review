# コントリビューション

## 変更の提案

外部からの変更は、このリポジトリを fork して pull request を送る。このリポジトリに直接ブランチを作成することはできない。

## 貢献のライセンス

pull request を送信した時点で、あなたは mush1to に対し、その貢献内容をこのリポジトリおよび ongaku.review で利用、複製、改変、再配布するための、全世界・非独占・無償・取消不能のライセンスを許諾したものとみなす。著作権はあなたに留保される。

この条件に同意できない場合は、pull request を送らず、Issue で提案する。

## 送る前の確認

- 同じ内容の Issue や pull request がないか確認する
- コミットメッセージは `<type>: <summary>` の形式にする。type は `feat`、`fix`、`docs`、`test`、`build`、`ci`、`chore` から選ぶ
- pull request の本文は[テンプレート](PULL_REQUEST_TEMPLATE.md)に従う

初回は Chromium を導入してから、次のコマンドを実行する。

```sh
npm ci
npm exec -- playwright install chromium
npm run lint
npm run check
npm run test:e2e
```
