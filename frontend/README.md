# Vite + React + TailwindCSS（无需 npx tailwindcss）

一个最小可运行模板：已配置好 Tailwind、PostCSS、Vite React 插件。

## 使用

```bash
# 进入项目目录
cd vite-react-tailwind-starter

# 安装依赖（任选其一）
npm install
# 或 pnpm install
# 或 yarn

# 启动开发
npm run dev
# 构建
npm run build
# 预览构建产物
npm run preview
```

> 若你之前遇到 "@vitejs/plugin-react resolved to an ESM file" 的报错，
> 确保不要用 `require` 去加载 Vite 配置，保持本模板中的 ESM/模块化写法即可。
