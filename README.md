# 西幻万人迷 · 艾尔茜利恩

艾尔茜利恩西幻乙游模拟器（Vite + React）。

## 定位

- 世界观：艾尔茜利恩 / 艾泽利亚大陆
- 玩法：轻跑团 d20 · 攻略男主图鉴 · 队伍 / 家园轻养成
- 结构：八大区域地图 · 底栏冒险 / 沉浸 / 规则书 / 酒馆 / 图鉴 / 设置
- 尺度：成年 NSFW 西幻乙游

## 开发

```bash
npm install
npm run dev
```

手机预览：同一 Wi‑Fi 访问终端里的局域网地址（如 `http://192.168.x.x:5173`）。

数值草案见 [DESIGN_TABLES.md](./DESIGN_TABLES.md)。

## 构建与部署

```bash
npm run build
npm run preview
```

推送到 `main` 后，GitHub Actions 会发布到 `gh-pages`。

当前已配置自定义域名（`public/CNAME`）：

- 主站：`https://xihuan.nuanmuxing.tech/`
- 备用：`https://bingdugu042-ship-it.github.io/xihuan/`（有自定义域时也可能跳转）

请确认 DNS（CNAME → `bingdugu042-ship-it.github.io`）已生效，并在仓库 **Settings → Pages** 填好 Custom domain、勾选 HTTPS。
