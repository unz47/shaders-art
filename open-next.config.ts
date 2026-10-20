// OpenNext(infra/lib/nextjs-site.ts の buildCommand で npx から実行する)の設定。
// AI と作る(POST /api/ai/edit)の返答を少しずつ返すため、サーバー関数をストリーミング用の
// ラッパーにする。CDK 側の streaming: true(Function URL の応答をストリーミングにする)と対で要る。
// 型(@opennextjs/aws の OpenNextConfig)は、ルートに OpenNext を入れていないので付けない。
const config = {
  default: {
    override: {
      wrapper: "aws-lambda-streaming",
    },
  },
};

export default config;
