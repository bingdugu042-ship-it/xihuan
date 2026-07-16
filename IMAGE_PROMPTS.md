# 艾泽利亚立绘 / 地图生图提示词

优先级：**大陆地图 → 八大区域场景 → 七固定男主**

## 风格规范（已写入代码）

- `src/ai/imagePromptStyle.ts` — 正面/负面规范词，所有生图 API 自动套用
- `src/ai/contentClient.ts` — `generateImage()` 默认 compose
- `src/ai/azeriaImageGen.ts` — 地图 / 区域 / 男主专用入口

## 七固定男主（已写入 `game/characters/`）

| ID | 姓名 | 种族 | 区域 |
|---|---|---|---|
| human_rowan | 罗恩 | 人类 | 中央·人类诸国 |
| elf_caer | 凯尔·银弦 | 精灵 | 东方·精灵之森 |
| demon_vex | 维克斯 | 魔族 | 西部·魔族荒原 |
| dragon_rhaeg | 雷格 | 龙族 | 北方·永冬雪境 |
| mermaid_nyx | 尼克斯 | 人鱼 | 南方·人鱼海域 |
| angel_seraph | 塞拉芬 | 天使 | 天空·天界浮岛 |
| succubus_milo | 米洛 | 魅魔 | 地底·深渊裂谷 |

素材目录约定：`public/assets/characters/{id}/normal.png` + `avatar.png`  
区域图：`public/assets/world/regions/{regionId}/scene.png`  
地图：`public/assets/worldmap/azeria/map.png`

完整英文 subject 见 `src/data/imagePrompts.ts`。
