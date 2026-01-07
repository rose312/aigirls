AI 女孩工坊：一个简单的「提示词 → 生成人像图」网站（Next.js + Tailwind）。

## Getting Started

### 1) 配置环境变量（推荐 OpenRouter）

复制 `.env.example` 为 `.env.local`，并填入：

- `OPENROUTER_API_KEY`
- `OPENROUTER_IMAGE_MODEL`（选择一个支持输出图片的模型）
- （可选）`OPENROUTER_SITE_URL` / `OPENROUTER_SITE_TITLE`（用于 OpenRouter 归因）

可选（作为 fallback）：

- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL`（默认 `gpt-image-1`）

### 2) 启动开发服务器

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 常用命令

- 重启开发服务器：`npm run dev:restart`
- 停止开发服务器：`npm run dev:stop`

## Safety

- 服务端会拒绝：未成年人相关、露骨色情相关提示词。
- 默认只生成「成年（21+）、衣着完整、非露骨」的人像图。
- 这些限制是硬性要求，不能“完全无约束”。
- 前端提供“标准/严格”开关：严格模式会额外拦截明显性暗示描述（依然不会放开露骨/裸体）。

## 提示词小抄

- 结构：人物外观 + 服装 + 光线 + 场景 + 镜头/风格
- 例子（性感但不露骨）：`魅惑眼神、微笑、丝绸吊带裙（不透视）、高跟鞋、棚拍柔光、浅景深、杂志大片`
- 例子（泳装写真，不露点）：`泳装写真、比基尼（完整覆盖）、海边日落、金色逆光、85mm、人像摄影、优雅姿态`
- 例子（内衣广告风，不露骨）：`品牌内衣广告风、完整覆盖、干净背景、柔光棚拍、精致妆容、时尚大片`
- 快速开始：首页有「妹子图模板」可一键生成同款氛围（更好看、更省事）。

## API

前端会请求 `POST /api/generate`。

- 默认走 OpenRouter（通过 OpenAI SDK：`baseURL=https://openrouter.ai/api/v1`）
- 也支持 fallback 到 OpenAI Images API（当你配置了 `OPENAI_API_KEY`）

## 图片存储（七牛云）

如果你配置了七牛云（S3 兼容）环境变量，服务端会在生成后把图片上传到七牛，并在响应里返回公网 URL（画廊会直接展示这些 URL）。

需要在 `.env.local` 配置（参考 `.env.example`）：

- `QINIU_S3_ACCESS_KEY` / `QINIU_S3_SECRET_KEY`
- `QINIU_S3_ENDPOINT`（例如 `https://s3.ap-southeast-1.qiniucs.com`）
- `QINIU_S3_BUCKET`（例如 `aigirl666`）
- `QINIU_PUBLIC_BASE_URL`（例如 `https://aigirl666.s3.ap-southeast-1.qiniucs.com`）

### 私有 Bucket（签名 URL）

如果 bucket 是私有的（直接访问 `QINIU_PUBLIC_BASE_URL/...` 401/403），请设置：

- `QINIU_BUCKET_PRIVATE=true`
- `QINIU_SIGNED_URL_TTL_SECONDS=3600`

应用会：
- 生成后返回临时签名 URL（可直接展示）
- 本地画廊保存 `key`，当签名 URL 过期会自动调用 `POST /api/qiniu/sign` 刷新

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
