'use strict';

figma.showUI(__html__, {
  width: 520,
  height: 720,
  themeColors: true,
});

const loadedFonts = new Set();
let availableFontsPromise = null;
const DEFAULT_FONT_FAMILY = 'Noto Sans JP';
const DEFAULT_FRAME_BACKGROUND = 'rgba(255,255,255,1)';

figma.ui.onmessage = async (message) => {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'CREATE_NODES') {
    await handleCreateNodes(message.payload);
  }

  if (message.type === 'CLOSE') {
    figma.closePlugin();
  }
};

async function handleCreateNodes(payload) {
  try {
    if (!payload || !payload.root) {
      throw new Error('レイアウト情報を受け取れませんでした。');
    }

    const root = payload.root;
    const frame = createFrameNode(root, { isRoot: true });
    frame.name = payload.name || root.name || 'Imported Component';

    await appendChildren(root.children || [], frame, root.x || 0, root.y || 0, root.layout || null);

    figma.currentPage.appendChild(frame);
    placeAtViewportCenter(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.notify(`Figmaに「${frame.name}」を展開しました`);
    figma.ui.postMessage({ type: 'IMPORT_SUCCESS', name: frame.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'インポートに失敗しました。';
    figma.notify(message, { error: true });
    figma.ui.postMessage({ type: 'IMPORT_ERROR', message });
  }
}

async function appendChildren(children, parent, offsetX, offsetY, parentLayout) {
  const flowChildren = [];
  const absoluteChildren = [];

  for (const child of (children || [])) {
    const item = child && child.layoutItem;
    if (parentLayout && item && item.positioning === 'ABSOLUTE') {
      absoluteChildren.push(child);
    } else {
      flowChildren.push(child);
    }
  }

  if (parentLayout && parentLayout.reverse) {
    flowChildren.reverse();
  }

  for (const child of flowChildren) {
    await appendNode(child, parent, offsetX, offsetY, parentLayout);
  }

  for (const child of absoluteChildren) {
    await appendNode(child, parent, offsetX, offsetY, parentLayout);
  }
}

async function appendNode(data, parent, offsetX, offsetY, parentLayout) {
  const node = await createNode(data);
  if (!node) return;

  parent.appendChild(node);

  if (parentLayout) {
    applyAutoLayoutChild(node, data.layoutItem || {}, parentLayout);

    if (data.layoutItem && data.layoutItem.positioning === 'ABSOLUTE') {
      node.x = round(((data && data.x) || 0) - offsetX);
      node.y = round(((data && data.y) || 0) - offsetY);
    }
  } else {
    node.x = round(((data && data.x) || 0) - offsetX);
    node.y = round(((data && data.y) || 0) - offsetY);
  }

  if ('children' in node && Array.isArray(data.children)) {
    await appendChildren(data.children, node, data.x || 0, data.y || 0, data.layout || null);
  }
}

async function createNode(data) {
  switch (data && data.kind) {
    case 'frame':
      return createFrameNode(data);
    case 'rectangle':
      return createRectangleNode(data);
    case 'text':
      return createTextNode(data);
    case 'image':
      return createImageNode(data);
    default:
      return null;
  }
}

function createFrameNode(data, options = {}) {
  const frame = figma.createFrame();
  frame.name = data.name || data.tagName || 'frame';
  frame.layoutMode = 'NONE';
  frame.clipsContent = Boolean(data.styles && data.styles.overflowHidden);
  applyAutoLayoutToFrame(frame, data.layout || null, data.width, data.height);
  frame.resize(safeSize(data.width), safeSize(data.height));
  applyShapeStyles(frame, data.styles, {
    fallbackBackgroundColor: options.isRoot ? DEFAULT_FRAME_BACKGROUND : null,
  });
  return frame;
}

function createRectangleNode(data) {
  const rect = figma.createRectangle();
  rect.name = data.name || data.tagName || 'rectangle';
  rect.resize(safeSize(data.width), safeSize(data.height));
  applyShapeStyles(rect, data.styles);
  // CSS transform の回転をFigmaノードに適用する
  // CSS rotate(Xdeg) は時計回り正、Figma の rotation は反時計回り正なので符号を反転する
  const rotation = data.styles && data.styles.cssTransformRotation;
  if (rotation) {
    rect.rotation = -rotation;
  }
  return rect;
}

async function createTextNode(data) {
  const text = figma.createText();
  const fontName = await resolveFontName(data.styles);
  await ensureFontLoaded(fontName);

  text.name = data.name || 'text';
  text.fontName = fontName;
  text.characters = data.textContent || '';
  text.fills = buildSolidPaints(data.styles && data.styles.color, true);
  text.textAutoResize = 'NONE';

  if (data.styles && typeof data.styles.fontSize === 'number') {
    text.fontSize = data.styles.fontSize;
  }
  if (data.styles && typeof data.styles.lineHeight === 'number') {
    text.lineHeight = { unit: 'PIXELS', value: data.styles.lineHeight };
  }
  if (data.styles && typeof data.styles.letterSpacing === 'number') {
    text.letterSpacing = { unit: 'PIXELS', value: data.styles.letterSpacing };
  }
  if (data.styles && typeof data.styles.opacity === 'number') {
    text.opacity = clamp(data.styles.opacity, 0, 1);
  }

  text.textAlignHorizontal = mapTextAlign(data.styles && data.styles.textAlign);
  text.resize(safeSize(data.width), safeSize(data.height));
  return text;
}

async function createImageNode(data) {
  const rect = figma.createRectangle();
  rect.name = data.name || data.tagName || 'image';
  rect.resize(safeSize(data.width), safeSize(data.height));
  applyShapeStyles(rect, data.styles);

  if (!data.src) {
    rect.fills = buildSolidPaints('rgba(226,232,240,1)');
    return rect;
  }

  try {
    const image = await figma.createImageAsync(data.src);
    rect.fills = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: data.styles && data.styles.objectFit === 'contain' ? 'FIT' : 'FILL',
    }];
  } catch (error) {
    rect.fills = buildSolidPaints('rgba(226,232,240,1)');
  }

  return rect;
}

function applyShapeStyles(node, styles = {}, options = {}) {
  // fallback優先順位: isRoot指定色 > background-imageから抽出したグラデーション先頭色
  const fallback = options.fallbackBackgroundColor != null
    ? options.fallbackBackgroundColor
    : (styles.backgroundImageColor != null ? styles.backgroundImageColor : null);
  node.fills = buildSolidPaints(styles.backgroundColor, false, fallback);

  const borderWeights = getVisibleBorderWeights(styles.borderWidths, styles.borderStyles, styles.borderColors);
  const strokeWeight = getStrokeWeight(borderWeights);
  const strokeColor = getStrokeColor(styles.borderColors, styles.borderColor, borderWeights);
  if (strokeColor && strokeWeight > 0) {
    node.strokes = [{
      type: 'SOLID',
      color: toPaintColor(strokeColor),
      opacity: strokeColor.a,
    }];
    node.strokeWeight = strokeWeight;
    node.strokeAlign = 'INSIDE';
    applyIndividualStrokeWeights(node, borderWeights);
  } else {
    node.strokes = [];
  }

  applyCornerRadius(node, styles);

  if ('opacity' in node && typeof styles.opacity === 'number') {
    node.opacity = clamp(styles.opacity, 0, 1);
  }

  const effects = buildDropShadowEffects(styles.boxShadows);
  if (effects.length > 0 && 'effects' in node) {
    node.effects = effects;
  }
}

// box-shadow の配列を Figma の effects 配列に変換する
function buildDropShadowEffects(boxShadows) {
  if (!Array.isArray(boxShadows) || boxShadows.length === 0) return [];
  return boxShadows.map((s) => {
    if (!s) return null;
    const color = { r: s.color.r, g: s.color.g, b: s.color.b, a: s.color.a };
    const offset = { x: s.offsetX, y: s.offsetY };
    const radius = Math.max(0, s.blur);
    const spread = s.spread || 0;
    if (s.isInset) {
      return {
        type: 'INNER_SHADOW',
        color: color,
        offset: offset,
        radius: radius,
        spread: spread,
        visible: true,
        blendMode: 'NORMAL',
      };
    }
    return {
      type: 'DROP_SHADOW',
      color: color,
      offset: offset,
      radius: radius,
      spread: spread,
      visible: true,
      blendMode: 'NORMAL',
      showShadowBehindNode: false,
    };
  }).filter(Boolean);
}

function applyAutoLayoutToFrame(frame, layout, width, height) {
  if (!layout) {
    frame.layoutMode = 'NONE';
    return;
  }

  frame.layoutMode = layout.mode || 'VERTICAL';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.primaryAxisAlignItems = layout.primaryAxisAlignItems || 'MIN';
  frame.counterAxisAlignItems = layout.counterAxisAlignItems || 'MIN';
  frame.layoutWrap = layout.wrap ? 'WRAP' : 'NO_WRAP';
  frame.itemSpacing = numericOrZero(layout.itemSpacing);
  frame.paddingTop = numericOrZero(layout.paddingTop);
  frame.paddingRight = numericOrZero(layout.paddingRight);
  frame.paddingBottom = numericOrZero(layout.paddingBottom);
  frame.paddingLeft = numericOrZero(layout.paddingLeft);
  frame.strokesIncludedInLayout = true;

  if (layout.wrap) {
    frame.counterAxisSpacing = numericOrZero(layout.counterAxisSpacing);
  }

  frame.resize(safeSize(width), safeSize(height));
}

function applyAutoLayoutChild(node, layoutItem = {}, parentLayout = {}) {
  if ('layoutPositioning' in node) {
    node.layoutPositioning = layoutItem.positioning === 'ABSOLUTE' ? 'ABSOLUTE' : 'AUTO';
  }

  if (layoutItem.positioning === 'ABSOLUTE') {
    return;
  }

  if ('layoutGrow' in node && Number(layoutItem.flexGrow) > 0) {
    node.layoutGrow = 1;
  }

  const shouldStretch = layoutItem.alignSelf === 'stretch'
    || (layoutItem.alignSelf === 'auto' && parentLayout.alignItemsRaw === 'stretch');

  if ('layoutAlign' in node && shouldStretch) {
    node.layoutAlign = 'STRETCH';
  }
}

function applyCornerRadius(node, styles = {}) {
  const tl = numericOrZero(styles.borderTopLeftRadius);
  const tr = numericOrZero(styles.borderTopRightRadius);
  const br = numericOrZero(styles.borderBottomRightRadius);
  const bl = numericOrZero(styles.borderBottomLeftRadius);

  if (tl === tr && tr === br && br === bl) {
    node.cornerRadius = tl;
    return;
  }

  node.topLeftRadius = tl;
  node.topRightRadius = tr;
  node.bottomRightRadius = br;
  node.bottomLeftRadius = bl;
}

async function resolveFontName(styles = {}) {
  const families = parseFontFamilies(styles.fontFamily);
  if (families.length === 0) {
    families.push(DEFAULT_FONT_FAMILY);
  } else if (!families.includes(DEFAULT_FONT_FAMILY)) {
    families.push(DEFAULT_FONT_FAMILY);
  }
  if (!families.includes('Inter')) {
    families.push('Inter');
  }

  const fonts = await getAvailableFonts();
  const stylesToTry = buildFontStyles(styles.fontWeight, styles.fontStyle);

  for (const family of families) {
    const familyFonts = fonts.filter((item) => item.fontName.family === family);
    if (familyFonts.length === 0) continue;

    for (const styleName of stylesToTry) {
      const match = familyFonts.find((item) => item.fontName.style === styleName);
      if (match) return match.fontName;
    }

    const regular = familyFonts.find((item) => /regular|book/i.test(item.fontName.style));
    if (regular) return regular.fontName;
    return familyFonts[0].fontName;
  }

  return { family: DEFAULT_FONT_FAMILY, style: 'Regular' };
}

function parseFontFamilies(fontFamily) {
  if (typeof fontFamily !== 'string') return [];
  return fontFamily
    .split(',')
    .map((item) => item.replace(/["']/g, '').trim())
    .filter((item) => Boolean(item) && !isGenericFontFamily(item));
}

function isGenericFontFamily(value) {
  const normalized = String(value).trim().toLowerCase();
  return [
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'emoji',
    'math',
    'fangsong',
  ].includes(normalized);
}

function buildFontStyles(fontWeight, fontStyle) {
  const weight = typeof fontWeight === 'number' ? fontWeight : 400;
  const italic = typeof fontStyle === 'string' && fontStyle.includes('italic');
  const styles = [];

  if (weight >= 800) styles.push('Black', 'Extra Bold', 'Bold');
  else if (weight >= 700) styles.push('Bold', 'Semi Bold', 'Medium');
  else if (weight >= 600) styles.push('Semi Bold', 'Bold', 'Medium');
  else if (weight >= 500) styles.push('Medium', 'Regular');
  else if (weight <= 300) styles.push('Light', 'Regular');
  else styles.push('Regular', 'Medium');

  if (!italic) return [...new Set(styles)];

  return [...new Set(styles.flatMap((styleName) => {
    return [`${styleName} Italic`, 'Italic', styleName];
  }))];
}

async function getAvailableFonts() {
  if (!availableFontsPromise) {
    availableFontsPromise = figma.listAvailableFontsAsync();
  }
  return availableFontsPromise;
}

async function ensureFontLoaded(fontName) {
  const key = `${fontName.family}__${fontName.style}`;
  if (loadedFonts.has(key)) return;
  await figma.loadFontAsync(fontName);
  loadedFonts.add(key);
}

function buildSolidPaints(colorText, fallbackBlack = false, fallbackColorText = null) {
  const color = parseColor(colorText);
  if (color && color.a <= 0) {
    const fallbackColor = parseColor(fallbackColorText);
    if (fallbackColor) {
      return [{
        type: 'SOLID',
        color: toPaintColor(fallbackColor),
        opacity: fallbackColor.a,
      }];
    }
    if (!fallbackBlack) return [];
    return [{
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
    }];
  }

  if (!color) {
    const fallbackColor = parseColor(fallbackColorText);
    if (fallbackColor) {
      return [{
        type: 'SOLID',
        color: toPaintColor(fallbackColor),
        opacity: fallbackColor.a,
      }];
    }
    if (!fallbackBlack) return [];
    return [{
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
    }];
  }

  return [{
    type: 'SOLID',
    color: toPaintColor(color),
    opacity: color.a,
  }];
}

function parseColor(colorText) {
  if (typeof colorText !== 'string') return null;
  const value = colorText.trim().toLowerCase();
  if (!value || value === 'transparent') return null;

  const rgba = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((item) => item.trim());
    if (parts.length < 3) return null;
    return {
      r: clamp(Number(parts[0]) / 255, 0, 1),
      g: clamp(Number(parts[1]) / 255, 0, 1),
      b: clamp(Number(parts[2]) / 255, 0, 1),
      a: parts[3] !== undefined ? clamp(Number(parts[3]), 0, 1) : 1,
    };
  }

  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (!hex) return null;

  const raw = hex[1];
  if (raw.length === 3 || raw.length === 4) {
    return {
      r: parseInt(raw[0] + raw[0], 16) / 255,
      g: parseInt(raw[1] + raw[1], 16) / 255,
      b: parseInt(raw[2] + raw[2], 16) / 255,
      a: raw.length === 4 ? parseInt(raw[3] + raw[3], 16) / 255 : 1,
    };
  }

  if (raw.length === 6 || raw.length === 8) {
    return {
      r: parseInt(raw.slice(0, 2), 16) / 255,
      g: parseInt(raw.slice(2, 4), 16) / 255,
      b: parseInt(raw.slice(4, 6), 16) / 255,
      a: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1,
    };
  }

  return null;
}

function toPaintColor(color) {
  return { r: color.r, g: color.g, b: color.b };
}

function getStrokeWeight(borderWidths = {}) {
  const values = [
    borderWidths.top,
    borderWidths.right,
    borderWidths.bottom,
    borderWidths.left,
  ].filter((value) => typeof value === 'number' && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
}

function getVisibleBorderWeights(borderWidths = {}, borderStyles = {}, borderColors = {}) {
  return {
    top: isVisibleBorderSide(borderWidths.top, borderStyles.top, borderColors.top) ? numericOrZero(borderWidths.top) : 0,
    right: isVisibleBorderSide(borderWidths.right, borderStyles.right, borderColors.right) ? numericOrZero(borderWidths.right) : 0,
    bottom: isVisibleBorderSide(borderWidths.bottom, borderStyles.bottom, borderColors.bottom) ? numericOrZero(borderWidths.bottom) : 0,
    left: isVisibleBorderSide(borderWidths.left, borderStyles.left, borderColors.left) ? numericOrZero(borderWidths.left) : 0,
  };
}

function isVisibleBorderSide(width, borderStyle, borderColor) {
  if (!(Number(width) > 0)) return false;
  if (borderStyle === 'none' || borderStyle === 'hidden') return false;
  return Boolean(parseColor(borderColor));
}

function getStrokeColor(borderColors = {}, fallbackColor, borderWeights = {}) {
  const visibleColors = ['top', 'right', 'bottom', 'left']
    .filter((side) => Number(borderWeights[side]) > 0)
    .map((side) => borderColors[side])
    .filter((color) => typeof color === 'string' && color.trim() !== '');

  for (const colorText of visibleColors) {
    const parsed = parseColor(colorText);
    if (parsed) return parsed;
  }

  return parseColor(fallbackColor);
}

function applyIndividualStrokeWeights(node, borderWeights = {}) {
  if (!('strokeTopWeight' in node)) return;
  node.strokeTopWeight = numericOrZero(borderWeights.top);
  node.strokeRightWeight = numericOrZero(borderWeights.right);
  node.strokeBottomWeight = numericOrZero(borderWeights.bottom);
  node.strokeLeftWeight = numericOrZero(borderWeights.left);
}

function mapTextAlign(value) {
  if (value === 'center') return 'CENTER';
  if (value === 'right') return 'RIGHT';
  if (value === 'justify') return 'JUSTIFIED';
  return 'LEFT';
}

function placeAtViewportCenter(node) {
  node.x = figma.viewport.center.x - node.width / 2;
  node.y = figma.viewport.center.y - node.height / 2;
}

function safeSize(value) {
  return Math.max(round(Number(value) || 0), 1);
}

function numericOrZero(value) {
  return Number.isFinite(value) ? round(value) : 0;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function round(value) {
  return Math.round(value * 100) / 100;
}
