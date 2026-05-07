# Vercel Connect Dashboard

Vercel REST APIと連携し、認証ユーザー、プロジェクト、最新デプロイを確認できる軽量ダッシュボードです。静的なフロントエンドからVercel Serverless Function（`api/vercel.js`）を呼び出し、APIトークンをブラウザに露出せずにVercel APIへ接続します。

## できること

- Vercel APIトークンで認証ユーザー情報を取得
- プロジェクト一覧（最新6件）を表示
- デプロイ一覧（最新8件）を表示
- 任意のTeam IDを指定してチーム配下の情報を取得
- APIトークン未設定時はセットアップ案内を表示

## セットアップ

1. 依存関係をインストールします。

   ```bash
   npm install
   ```

2. VercelのAPIトークンを作成します。

   https://vercel.com/account/tokens

3. Vercelの環境変数にAPIトークンを登録します。

   ```bash
   vercel env add VERCEL_API_TOKEN
   ```

4. チームの情報を常に取得したい場合はTeam IDも登録します（画面から都度入力することもできます）。

   ```bash
   vercel env add VERCEL_TEAM_ID
   ```

5. ローカルで起動します。

   ```bash
   npm start
   ```

6. 本番へデプロイします。

   ```bash
   vercel deploy --prod
   ```

## API

`GET /api/vercel` はVercel REST APIを集約して、フロントエンド向けのJSONを返します。

クエリパラメータ:

- `teamId`: 任意。指定したチームのプロジェクトとデプロイを取得します。
- `projectLimit`: 任意。取得するプロジェクト数です（デフォルト: 6）。
- `deploymentLimit`: 任意。取得するデプロイ数です（デフォルト: 8）。

必要な環境変数:

- `VERCEL_API_TOKEN`: 必須。Vercel APIへのBearerトークンです。
- `VERCEL_TEAM_ID`: 任意。デフォルトで参照するチームIDです。

## 開発用チェック

```bash
npm run check
```
