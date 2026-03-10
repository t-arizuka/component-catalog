/**
 * components-data.js
 * file:// での直接開きに対応するためのインラインデータ
 * components.json と内容を同期して使用する
 * （Live Server 経由では fetch が使われるため、このファイルは file:// 専用）
 */
window.CATALOG_DATA = {
  "categories": [
    "ボタン",
    "カード",
    "フォーム",
    "ナビゲーション",
    "モーダル",
    "テーブル",
    "バッジ",
    "その他",
    "ABOUT"
  ],
  "components": [
    {
      "id": "btn-primary-001",
      "name": "プライマリボタン",
      "category": "ボタン",
      "tags": ["button", "primary", "CTA"],
      "description": "メインアクション用のボタン。フォーム送信やCTAに使用します。",
      "html": "<button class=\"btn-primary\">ボタンテキスト</button>",
      "css": ".btn-primary {\n  background-color: #3B82F6;\n  color: #fff;\n  padding: 10px 24px;\n  border: none;\n  border-radius: 6px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s, transform 0.1s;\n}\n.btn-primary:hover {\n  background-color: #2563EB;\n}\n.btn-primary:active {\n  transform: scale(0.98);\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "btn-secondary-001",
      "name": "セカンダリボタン",
      "category": "ボタン",
      "tags": ["button", "secondary"],
      "description": "サブアクション用のボタン。プライマリと組み合わせて使用します。",
      "html": "<button class=\"btn-secondary\">キャンセル</button>",
      "css": ".btn-secondary {\n  background-color: #fff;\n  color: #3B82F6;\n  padding: 10px 24px;\n  border: 2px solid #3B82F6;\n  border-radius: 6px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.btn-secondary:hover {\n  background-color: #EFF6FF;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "btn-danger-001",
      "name": "デンジャーボタン",
      "category": "ボタン",
      "tags": ["button", "danger", "delete"],
      "description": "削除など破壊的アクション用のボタンです。",
      "html": "<button class=\"btn-danger\">削除する</button>",
      "css": ".btn-danger {\n  background-color: #EF4444;\n  color: #fff;\n  padding: 10px 24px;\n  border: none;\n  border-radius: 6px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n.btn-danger:hover {\n  background-color: #DC2626;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "card-simple-001",
      "name": "シンプルカード",
      "category": "カード",
      "tags": ["card", "container", "simple"],
      "description": "汎用コンテンツカード。タイトル・本文・アクションボタンの構成です。",
      "html": "<div class=\"card\">\n  <div class=\"card-body\">\n    <h3 class=\"card-title\">カードタイトル</h3>\n    <p class=\"card-text\">カードの説明文がここに入ります。補足情報などを記述できます。</p>\n    <button class=\"card-btn\">詳細を見る</button>\n  </div>\n</div>",
      "css": ".card {\n  background: #fff;\n  border: 1px solid #E2E8F0;\n  border-radius: 10px;\n  overflow: hidden;\n  box-shadow: 0 1px 3px rgba(0,0,0,0.08);\n  max-width: 320px;\n  transition: box-shadow 0.2s, transform 0.2s;\n}\n.card:hover {\n  box-shadow: 0 4px 12px rgba(0,0,0,0.12);\n  transform: translateY(-2px);\n}\n.card-body {\n  padding: 20px;\n}\n.card-title {\n  margin: 0 0 8px;\n  font-size: 16px;\n  font-weight: 700;\n  color: #1E293B;\n}\n.card-text {\n  margin: 0 0 16px;\n  font-size: 14px;\n  color: #64748B;\n  line-height: 1.6;\n}\n.card-btn {\n  background: #3B82F6;\n  color: #fff;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 6px;\n  font-size: 13px;\n  cursor: pointer;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "card-profile-001",
      "name": "プロフィールカード",
      "category": "カード",
      "tags": ["card", "profile", "avatar", "user"],
      "description": "ユーザープロフィール表示用カード。アバター・名前・役職を表示します。",
      "html": "<div class=\"profile-card\">\n  <div class=\"profile-avatar\">YN</div>\n  <div class=\"profile-info\">\n    <h3 class=\"profile-name\">山田 直子</h3>\n    <p class=\"profile-role\">UIデザイナー</p>\n    <div class=\"profile-tags\">\n      <span class=\"ptag\">Figma</span>\n      <span class=\"ptag\">CSS</span>\n    </div>\n  </div>\n</div>",
      "css": ".profile-card {\n  background: #fff;\n  border: 1px solid #E2E8F0;\n  border-radius: 12px;\n  padding: 24px;\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  max-width: 320px;\n  box-shadow: 0 1px 3px rgba(0,0,0,0.08);\n}\n.profile-avatar {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  background: #3B82F6;\n  color: #fff;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-weight: 700;\n  font-size: 18px;\n  flex-shrink: 0;\n}\n.profile-name {\n  margin: 0 0 4px;\n  font-size: 16px;\n  font-weight: 700;\n  color: #1E293B;\n}\n.profile-role {\n  margin: 0 0 10px;\n  font-size: 13px;\n  color: #64748B;\n}\n.profile-tags {\n  display: flex;\n  gap: 6px;\n}\n.ptag {\n  background: #EFF6FF;\n  color: #3B82F6;\n  font-size: 11px;\n  padding: 2px 8px;\n  border-radius: 99px;\n  font-weight: 600;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "form-input-001",
      "name": "テキスト入力フィールド",
      "category": "フォーム",
      "tags": ["form", "input", "text", "label"],
      "description": "ラベル付きテキスト入力。フォーカス時のボーダーカラー変化付き。",
      "html": "<div class=\"form-group\">\n  <label class=\"form-label\" for=\"email\">メールアドレス</label>\n  <input class=\"form-input\" type=\"email\" id=\"email\" placeholder=\"example@company.com\">\n  <span class=\"form-hint\">ログインに使用するメールを入力してください</span>\n</div>",
      "css": ".form-group {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  max-width: 320px;\n}\n.form-label {\n  font-size: 13px;\n  font-weight: 600;\n  color: #1E293B;\n}\n.form-input {\n  padding: 10px 12px;\n  border: 1.5px solid #CBD5E1;\n  border-radius: 6px;\n  font-size: 14px;\n  color: #1E293B;\n  outline: none;\n  transition: border-color 0.2s, box-shadow 0.2s;\n}\n.form-input:focus {\n  border-color: #3B82F6;\n  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);\n}\n.form-hint {\n  font-size: 12px;\n  color: #94A3B8;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "misc-001",
      "name": "collage-01",
      "category": "その他",
      "tags": [],
      "description": "",
      "html": "<section class=\"l-about\">\n    <div class=\"c-container\">\n        <div\n            class=\"c-content-about-collage-01 c-content-about-collage-01--bg-gray c-content-about-collage-01--full-width\">\n            <div class=\"c-content-about-collage-01__media\">\n                <img class=\"c-content-about-collage-01__image c-content-about-collage-01__image--primary\"\n                    src=\"https://picsum.photos/id/237/900/700\" alt=\"オフィスとチームのイメージ写真\" />\n                <img class=\"c-content-about-collage-01__image c-content-about-collage-01__image--secondary\"\n                    src=\"https://picsum.photos/id/1025/900/700\" alt=\"建築物のイメージ写真\" />\n            </div>\n            <div>\n                <p class=\"c-content-about-collage-01__eyebrow\">ABOUT US</p>\n                <h2 class=\"c-content-about-collage-01__title c-content-about-collage-01__title--underline\">株式会社〇〇〇について\n                </h2>\n                <p class=\"c-content-about-collage-01__lead\">\n                    エレベーター関連機器の製造・販売を通じ、<br />\n                    安全で信頼性の高い昇降設備を支えてきました。<br />\n                    培ってきた技術力で、多様なニーズに柔軟に対応します。\n                </p>\n                <a class=\"c-content-about-collage-01__button\" href=\"#\">会社概要を見る</a>\n            </div>\n            <div class=\"c-content-about-collage-01__decor\" aria-hidden=\"true\"></div>\n        </div>\n    </div>\n</section>",
      "css": "/* about section (for sections.css) */\n.l-about {\n    padding: 96px 0;\n    overflow: hidden;\n}\n\n.l-about .c-container {\n    width: min(100% - 40px, 1200px);\n    margin-right: auto;\n    margin-left: auto;\n}\n\n.c-content-about-collage-01 {\n    position: relative;\n    display: grid;\n    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);\n    gap: clamp(24px, 4vw, 72px);\n    align-items: center;\n    padding: clamp(48px, 6vw, 88px) clamp(24px, 5vw, 72px);\n}\n\n.c-content-about-collage-01--bg-gray {\n    background-color: #efefef;\n}\n\n.c-content-about-collage-01--full-width {\n    width: 100vw;\n    margin-left: calc(50% - 50vw);\n    margin-right: calc(50% - 50vw);\n}\n\n.c-content-about-collage-01__media {\n    position: relative;\n    width: min(100%, 720px);\n    margin-bottom: clamp(32px, 5vw, 70px);\n    z-index: 1;\n}\n\n.c-content-about-collage-01__image {\n    display: block;\n    width: 100%;\n    aspect-ratio: 4 / 3;\n    object-fit: cover;\n    object-position: center;\n    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.12);\n}\n\n.c-content-about-collage-01__image--primary {\n    position: relative;\n    z-index: 1;\n    object-position: 22% 52%;\n}\n\n.c-content-about-collage-01__image--secondary {\n    position: absolute;\n    right: -4%;\n    bottom: -18%;\n    width: clamp(180px, 44%, 300px);\n    aspect-ratio: 3 / 4;\n    z-index: 2;\n    object-position: 65% 78%;\n}\n\n.c-content-about-collage-01__eyebrow {\n    margin: 0;\n    color: #1f8ecf;\n    font-size: clamp(34px, 5.2vw, 62px);\n    font-weight: 700;\n    letter-spacing: 0.06em;\n    line-height: 1;\n}\n\n.c-content-about-collage-01__title {\n    margin: 12px 0 0;\n    color: #2b2b2b;\n    font-size: clamp(22px, 2.1vw, 34px);\n    font-weight: 700;\n    line-height: 1.4;\n}\n\n.c-content-about-collage-01__title--underline {\n    position: relative;\n    padding-bottom: 18px;\n}\n\n.c-content-about-collage-01__title--underline::after {\n    content: \"\";\n    display: block;\n    width: 74px;\n    height: 2px;\n    margin-top: 14px;\n    background-color: #1f8ecf;\n}\n\n.c-content-about-collage-01__lead {\n    margin: 30px 0 0;\n    color: #444;\n    font-size: clamp(15px, 1.45vw, 20px);\n    line-height: 2.1;\n}\n\n.c-content-about-collage-01__button {\n    display: inline-flex;\n    justify-content: center;\n    align-items: center;\n    min-width: 280px;\n    margin-top: 34px;\n    padding: 16px 28px;\n    color: #fff;\n    font-size: 16px;\n    font-weight: 700;\n    line-height: 1;\n    text-decoration: none;\n    background-color: #1f8ecf;\n    transition: opacity 0.2s ease;\n}\n\n.c-content-about-collage-01__button:hover {\n    opacity: 0.88;\n}\n\n.c-content-about-collage-01__decor {\n    position: absolute;\n    right: 0;\n    bottom: 0;\n    left: 0;\n    height: clamp(120px, 18vw, 210px);\n    background-image: radial-gradient(circle, rgba(0, 0, 0, 0.11) 1px, transparent 1px);\n    background-size: 8px 8px;\n    opacity: 0.28;\n    pointer-events: none;\n}\n\n@media (max-width: 900px) {\n    .c-content-about-collage-01 {\n        grid-template-columns: 1fr;\n    }\n\n    .c-content-about-collage-01__media {\n        width: min(100%, 640px);\n        margin-right: auto;\n        margin-left: auto;\n    }\n\n    .c-content-about-collage-01__image--secondary {\n        right: 4%;\n        bottom: -14%;\n        width: clamp(150px, 40vw, 230px);\n    }\n\n    .c-content-about-collage-01__lead {\n        line-height: 1.9;\n    }\n\n    .c-content-about-collage-01__button {\n        min-width: 220px;\n    }\n}",
      "author": "",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "badge-status-001",
      "name": "ステータスバッジ",
      "category": "バッジ",
      "tags": ["badge", "status", "label", "tag"],
      "description": "状態表示用のバッジセット。成功・警告・エラー・情報の4種類。",
      "html": "<div class=\"badge-group\">\n  <span class=\"badge badge-success\">完了</span>\n  <span class=\"badge badge-warning\">保留中</span>\n  <span class=\"badge badge-danger\">エラー</span>\n  <span class=\"badge badge-info\">情報</span>\n</div>",
      "css": ".badge-group {\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.badge {\n  display: inline-flex;\n  align-items: center;\n  padding: 3px 10px;\n  border-radius: 99px;\n  font-size: 12px;\n  font-weight: 600;\n}\n.badge-success {\n  background: #D1FAE5;\n  color: #065F46;\n}\n.badge-warning {\n  background: #FEF3C7;\n  color: #92400E;\n}\n.badge-danger {\n  background: #FEE2E2;\n  color: #991B1B;\n}\n.badge-info {\n  background: #DBEAFE;\n  color: #1E40AF;\n}",
      "author": "デザインチーム",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    },
    {
      "id": "comp-001",
      "name": "ecosystem-3col-01",
      "category": "ABOUT",
      "tags": [],
      "description": "",
      "html": "<section class=\"l-about\">\n    <div class=\"c-container\">\n        <div class=\"c-content-about-ecosystem-3col-01\">\n            <div class=\"c-content-about-ecosystem-3col-01__head\">\n                <h6 class=\"c-content-about-ecosystem-3col-01__eyebrow\" id=\"ecosystem\">ECOSYSTEM</h6>\n                <p class=\"c-content-about-ecosystem-3col-01__title\">Positive growth.</p>\n            </div>\n\n            <div class=\"c-content-about-ecosystem-3col-01__body\">\n                <div class=\"c-content-about-ecosystem-3col-01__grid-top\">\n                    <div class=\"c-content-about-ecosystem-3col-01__col-text\">\n                        <p class=\"c-content-about-ecosystem-3col-01__text\"><em>Nature</em>, in the common sense, refers to essences unchanged by man; space, the air, the river, the leaf. <em>Art</em> is applied to the mixture of his will with the same things, as in a house, a canal, a statue, a picture.</p>\n                        <p class=\"c-content-about-ecosystem-3col-01__text\">But his operations taken together are so insignificant, a little chipping, baking, patching, and washing, that in an impression so grand as that of the world on the human mind, they do not vary the result.</p>\n                    </div>\n\n                    <div class=\"c-content-about-ecosystem-3col-01__col-media-a\">\n                        <figure class=\"c-content-about-ecosystem-3col-01__media-a\">\n                            <img class=\"c-content-about-ecosystem-3col-01__image-a\" src=\"https://picsum.photos/id/237/1200/800\" alt=\"森林のイメージ写真\" />\n                        </figure>\n                    </div>\n\n                    <div class=\"c-content-about-ecosystem-3col-01__col-media-b\">\n                        <figure class=\"c-content-about-ecosystem-3col-01__media-b\">\n                            <img class=\"c-content-about-ecosystem-3col-01__image-b\" src=\"https://picsum.photos/id/1025/1200/800\" alt=\"風力発電のイメージ写真\" />\n                        </figure>\n                    </div>\n                </div>\n\n                <div class=\"c-content-about-ecosystem-3col-01__grid-bottom\">\n                    <div class=\"c-content-about-ecosystem-3col-01__col-media-c\">\n                        <figure class=\"c-content-about-ecosystem-3col-01__media-c\">\n                            <img class=\"c-content-about-ecosystem-3col-01__image-c\" src=\"https://picsum.photos/id/1069/1600/900\" alt=\"海岸線のイメージ写真\" />\n                        </figure>\n                    </div>\n\n                    <div class=\"c-content-about-ecosystem-3col-01__col-note\">\n                        <p class=\"c-content-about-ecosystem-3col-01__text-note\">Undoubtedly we have no questions to ask which are unanswerable. We must trust the perfection of the creation so far, as to believe that whatever curiosity the order of things has awakened in our minds, the order of things can satisfy. Every man's condition is a solution in hieroglyphic to those inquiries he would put.</p>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n</section>",
      "css": "/* about-ecosystem-3col-01 section (for sections.css) */\n.l-about {\n    padding: 6vw;\n    background-color: #f5eac1;\n}\n\n.l-about .c-container {\n    width: min(100%, 1400px);\n    margin-right: auto;\n    margin-left: auto;\n}\n\n.c-content-about-ecosystem-3col-01 {\n    display: grid;\n    gap: clamp(12px, 1.5vw, 22px);\n}\n\n.c-content-about-ecosystem-3col-01__head {\n    display: grid;\n    gap: 16px;\n}\n\n.c-content-about-ecosystem-3col-01__eyebrow {\n    margin: 0;\n    color: #000;\n    font-size: 16px;\n    font-weight: 700;\n    line-height: 1.3;\n}\n\n.c-content-about-ecosystem-3col-01__title {\n    margin: 0;\n    color: #000;\n    font-size: clamp(42px, 6vw, 96px);\n    font-weight: 700;\n    line-height: 0.9;\n}\n\n.c-content-about-ecosystem-3col-01__body {\n    display: grid;\n    gap: clamp(18px, 3vw, 40px);\n}\n\n.c-content-about-ecosystem-3col-01__grid-top {\n    display: grid;\n    grid-template-columns: 33.38% 33% 33.62%;\n    gap: 3vw;\n}\n\n.c-content-about-ecosystem-3col-01__col-text {\n    display: grid;\n    gap: 18px;\n}\n\n.c-content-about-ecosystem-3col-01__text,\n.c-content-about-ecosystem-3col-01__text-note {\n    margin: 0;\n    color: #000;\n    font-size: 17px;\n    line-height: 1.75;\n}\n\n.c-content-about-ecosystem-3col-01__col-media-a {\n    padding-top: 2vw;\n}\n\n.c-content-about-ecosystem-3col-01__media-a,\n.c-content-about-ecosystem-3col-01__media-b,\n.c-content-about-ecosystem-3col-01__media-c {\n    margin: 0;\n}\n\n.c-content-about-ecosystem-3col-01__image-a,\n.c-content-about-ecosystem-3col-01__image-b,\n.c-content-about-ecosystem-3col-01__image-c {\n    display: block;\n    width: 100%;\n    height: auto;\n}\n\n.c-content-about-ecosystem-3col-01__grid-bottom {\n    display: grid;\n    grid-template-columns: 69% 33%;\n    gap: 3vw;\n}\n\n.c-content-about-ecosystem-3col-01__col-note {\n    display: flex;\n    align-items: center;\n    padding-top: 2vw;\n}\n\n@media (max-width: 960px) {\n    .c-content-about-ecosystem-3col-01__grid-top,\n    .c-content-about-ecosystem-3col-01__grid-bottom {\n        grid-template-columns: 1fr;\n        gap: 24px;\n    }\n\n    .c-content-about-ecosystem-3col-01__col-media-a,\n    .c-content-about-ecosystem-3col-01__col-note {\n        padding-top: 0;\n    }\n}",
      "author": "",
      "createdAt": "2026-03-09",
      "updatedAt": "2026-03-09"
    }
  ]
};
