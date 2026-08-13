'use strict';

/* ============================================================
 * 状態管理
 * ==========================================================*/
const state = {
  rows: 5,
  cols: 6,
  // placements: [{ tabletId, r, c, rot }]
  placements: [],
  // reserved: Set('r,c') 他のアーティファクトが既に占有しているマス
  reserved: new Set(),
  selectedTabletId: null,
  selectedRot: 0,
  pool: new Map(), // tabletId -> quantity owned (used by strategy search)
  targetCell: null, // {r,c} 集中プランの対象
};

TABLETS.forEach(t => state.pool.set(t.id, 1));

/* ============================================================
 * 幾何ユーティリティ
 * ==========================================================*/
function rotateOffset(dr, dc, rot) {
  let r = dr, c = dc;
  for (let i = 0; i < rot; i++) {
    const nr = c, nc = -r;
    r = nr; c = nc;
  }
  return [r, c];
}

function rotatedCells(tablet, rot) {
  const times = tablet.rotatable ? (rot % 4 + 4) % 4 : 0;
  return tablet.cells.map(cl => {
    const [dr, dc] = rotateOffset(cl.dr, cl.dc, times);
    return { dr, dc, kind: cl.kind, amount: cl.amount };
  });
}

function inBounds(r, c) {
  return r >= 0 && r < state.rows && c >= 0 && c < state.cols;
}

function conditionSatisfied(tablet, r, c) {
  switch (tablet.condition) {
    case 'bottom': return r === state.rows - 1;
    case 'top': return r === 0;
    case 'edge-lr': return c === 0 || c === state.cols - 1;
    default: return true;
  }
}

/* ============================================================
 * グリッド計算
 * ==========================================================*/
function computeGrid(placements, rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push({ value: 0, ignore: false });
    grid.push(row);
  }
  for (const p of placements) {
    const tablet = TABLETS[p.tabletId];
    const cells = rotatedCells(tablet, p.rot);
    for (const cl of cells) {
      const r = p.r + cl.dr, c = p.c + cl.dc;
      if (!inBounds(r, c)) continue;
      const delta = cl.kind === 'debuff' ? -cl.amount : cl.amount;
      grid[r][c].value += delta;
      if (cl.kind === 'ignore') grid[r][c].ignore = true;
    }
  }
  return grid;
}

function occupiedMap(placements) {
  const m = new Map();
  for (const p of placements) m.set(p.r + ',' + p.c, p);
  return m;
}

function isCellFree(placements, r, c) {
  if (state.reserved.has(r + ',' + c)) return false;
  for (const p of placements) if (p.r === r && p.c === c) return false;
  return true;
}

/* ============================================================
 * 統計
 * ==========================================================*/
function gridStats(grid) {
  let total = 0, positive = 0, negative = 0, negCount = 0, posCount = 0, min = Infinity, max = -Infinity;
  for (const row of grid) for (const cell of row) {
    total += cell.value;
    if (cell.value > 0) { positive += cell.value; posCount++; }
    if (cell.value < 0) { negative += cell.value; negCount++; }
    min = Math.min(min, cell.value);
    max = Math.max(max, cell.value);
  }
  return { total, positive, negative, negCount, posCount, min, max };
}

/* ============================================================
 * 描画: メイン盤面
 * ==========================================================*/
const bagEl = document.getElementById('bag');
const statsEl = document.getElementById('stats');

function renderBag() {
  bagEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
  bagEl.innerHTML = '';
  const grid = computeGrid(state.placements, state.rows, state.cols);
  const occ = occupiedMap(state.placements);

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cellData = grid[r][c];
      const div = document.createElement('div');
      div.className = 'bag-cell';
      const key = r + ',' + c;
      const placed = occ.get(key);
      const reserved = state.reserved.has(key);

      if (cellData.value > 0) div.classList.add('pos');
      else if (cellData.value < 0) div.classList.add('neg');
      if (cellData.ignore) div.classList.add('ignore');
      if (reserved) div.classList.add('reserved');
      if (state.targetCell && state.targetCell.r === r && state.targetCell.c === c) div.classList.add('target');

      const valueSpan = document.createElement('span');
      valueSpan.className = 'cell-value';
      if (cellData.value !== 0) {
        valueSpan.textContent = (cellData.value > 0 ? '+' : '') + cellData.value;
      } else if (cellData.ignore) {
        valueSpan.textContent = '無視';
      }
      div.appendChild(valueSpan);

      if (placed) {
        const tag = document.createElement('div');
        tag.className = 'tile-tag';
        const tablet = TABLETS[placed.tabletId];
        tag.textContent = tablet.name;
        tag.style.background = RARITY[tablet.rarity].color;
        div.appendChild(tag);
        div.classList.add('has-tile');
        div.title = `${tablet.name} (${RARITY[tablet.rarity].label}) — クリックで削除 / Rキーで回転`;
        div.addEventListener('click', (e) => {
          e.stopPropagation();
          if (e.shiftKey && tablet.rotatable) {
            placed.rot = (placed.rot + 1) % 4;
            renderBag();
          } else {
            state.placements = state.placements.filter(p => p !== placed);
            renderBag();
          }
        });
      } else if (!reserved) {
        div.addEventListener('click', () => onCellClick(r, c));
      } else {
        div.addEventListener('click', () => onReservedClick(r, c));
      }

      // ピッカーモード: マイナスモードでマス指定
      div.dataset.r = r;
      div.dataset.c = c;

      bagEl.appendChild(div);
    }
  }
  renderStats(grid);
}

function onReservedClick(r, c) {
  const key = r + ',' + c;
  state.reserved.delete(key);
  renderBag();
}

function onCellClick(r, c) {
  if (state.pickTargetMode) {
    state.targetCell = { r, c };
    state.pickTargetMode = false;
    document.getElementById('pickTargetBtn').classList.remove('active');
    updateTargetLabel();
    renderBag();
    return;
  }
  if (state.markReserveMode) {
    state.reserved.add(r + ',' + c);
    renderBag();
    return;
  }
  if (state.selectedTabletId == null) return;
  const tablet = TABLETS[state.selectedTabletId];
  if (!isCellFree(state.placements, r, c)) return;
  if (!conditionSatisfied(tablet, r, c)) {
    flashWarning(`「${tablet.name}」は${CONDITION_LABEL[tablet.condition]}にのみ配置できます`);
    return;
  }
  state.placements.push({ tabletId: tablet.id, r, c, rot: state.selectedRot });
  renderBag();
  renderPalette();
}

function flashWarning(msg) {
  const w = document.getElementById('warning');
  w.textContent = msg;
  w.classList.add('show');
  clearTimeout(flashWarning._t);
  flashWarning._t = setTimeout(() => w.classList.remove('show'), 2200);
}

function renderStats(grid) {
  const s = gridStats(grid);
  statsEl.innerHTML = `
    <div class="stat"><span class="stat-label">合計</span><span class="stat-val ${s.total>=0?'pos':'neg'}">${s.total>=0?'+':''}${s.total}</span></div>
    <div class="stat"><span class="stat-label">プラス合計</span><span class="stat-val pos">+${s.positive}</span></div>
    <div class="stat"><span class="stat-label">マイナス合計</span><span class="stat-val neg">${s.negative}</span></div>
    <div class="stat"><span class="stat-label">最大マス</span><span class="stat-val">${s.max>=0?'+':''}${s.max}</span></div>
    <div class="stat"><span class="stat-label">マイナスマス数</span><span class="stat-val">${s.negCount}</span></div>
    <div class="stat"><span class="stat-label">配置数</span><span class="stat-val">${state.placements.length}</span></div>
  `;
}

/* ============================================================
 * 描画: パレット
 * ==========================================================*/
const paletteEl = document.getElementById('palette');

function miniGridBounds(tablet) {
  let minR = 0, maxR = 0, minC = 0, maxC = 0;
  for (const cl of tablet.cells) {
    minR = Math.min(minR, cl.dr); maxR = Math.max(maxR, cl.dr);
    minC = Math.min(minC, cl.dc); maxC = Math.max(maxC, cl.dc);
  }
  return { minR, maxR, minC, maxC };
}

function buildMiniGrid(tablet, rot) {
  const cells = rotatedCells(tablet, rot);
  let minR = 0, maxR = 0, minC = 0, maxC = 0;
  for (const cl of cells) {
    minR = Math.min(minR, cl.dr); maxR = Math.max(maxR, cl.dr);
    minC = Math.min(minC, cl.dc); maxC = Math.max(maxC, cl.dc);
  }
  const h = maxR - minR + 1, w = maxC - minC + 1;
  const wrap = document.createElement('div');
  wrap.className = 'mini-grid';
  wrap.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
  wrap.style.gridTemplateRows = `repeat(${h}, 1fr)`;
  const map = new Map();
  for (const cl of cells) map.set((cl.dr - minR) + ',' + (cl.dc - minC), cl);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const d = document.createElement('div');
      d.className = 'mini-cell';
      if (r - minR === -minR && c - minC === -minC) d.classList.add('anchor');
      const cl = map.get(r + ',' + c);
      if (cl) {
        if (cl.kind === 'buff') { d.classList.add('pos'); d.textContent = '+' + cl.amount; }
        else if (cl.kind === 'debuff') { d.classList.add('neg'); d.textContent = '-' + cl.amount; }
        else { d.classList.add('ignore'); d.textContent = cl.amount ? (cl.amount>0?'+':'') + cl.amount : '無'; }
      }
      wrap.appendChild(d);
    }
  }
  return wrap;
}

let paletteFilter = { rarity: 'all', owned: false, text: '' };

function renderPalette() {
  paletteEl.innerHTML = '';
  const list = TABLETS.filter(t => {
    if (paletteFilter.rarity !== 'all' && t.rarity !== paletteFilter.rarity) return false;
    if (paletteFilter.owned && (state.pool.get(t.id) || 0) <= 0) return false;
    if (paletteFilter.text && !t.name.includes(paletteFilter.text)) return false;
    return true;
  });

  for (const t of list) {
    const row = document.createElement('div');
    row.className = 'tablet-row';
    if (state.selectedTabletId === t.id) row.classList.add('selected');

    const info = document.createElement('div');
    info.className = 'tablet-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'tablet-name';
    nameEl.innerHTML = `<span class="rarity-dot" style="background:${RARITY[t.rarity].color}"></span>${t.name}`;
    const metaEl = document.createElement('div');
    metaEl.className = 'tablet-meta';
    metaEl.textContent = `${RARITY[t.rarity].label} / ${CONDITION_LABEL[t.condition]} / 回転${t.rotatable ? '○' : '×'}`;
    info.appendChild(nameEl);
    info.appendChild(metaEl);

    const qty = document.createElement('input');
    qty.type = 'number';
    qty.className = 'qty-input';
    qty.min = 0; qty.max = 9;
    qty.value = state.pool.get(t.id) ?? 1;
    qty.title = '所持数(戦略提案で使用する上限)';
    qty.addEventListener('click', e => e.stopPropagation());
    qty.addEventListener('change', () => {
      state.pool.set(t.id, Math.max(0, parseInt(qty.value || '0', 10)));
    });

    const mini = buildMiniGrid(t, state.selectedTabletId === t.id ? state.selectedRot : 0);
    mini.classList.add('tablet-mini');

    row.appendChild(mini);
    row.appendChild(info);
    row.appendChild(qty);

    row.addEventListener('click', () => {
      if (state.selectedTabletId === t.id) {
        state.selectedTabletId = null;
      } else {
        state.selectedTabletId = t.id;
        state.selectedRot = 0;
      }
      renderPalette();
      updateSelectedBanner();
    });

    paletteEl.appendChild(row);
  }
}

function updateSelectedBanner() {
  const el = document.getElementById('selectedBanner');
  if (state.selectedTabletId == null) {
    el.textContent = '石板を選択してから盤面のマスをクリックすると配置されます。';
    el.classList.remove('active');
    return;
  }
  const t = TABLETS[state.selectedTabletId];
  el.classList.add('active');
  el.innerHTML = `選択中: <b>${t.name}</b>${t.rotatable ? ` (回転: ${state.selectedRot * 90}°  <button id="rotBtn">回転(R)</button>)` : ''}  <button id="clearSelBtn">選択解除</button>`;
  const rotBtn = document.getElementById('rotBtn');
  if (rotBtn) rotBtn.addEventListener('click', () => { state.selectedRot = (state.selectedRot + 1) % 4; updateSelectedBanner(); renderPalette(); });
  document.getElementById('clearSelBtn').addEventListener('click', () => { state.selectedTabletId = null; renderPalette(); updateSelectedBanner(); });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (state.selectedTabletId != null && TABLETS[state.selectedTabletId].rotatable) {
      state.selectedRot = (state.selectedRot + 1) % 4;
      updateSelectedBanner();
      renderPalette();
    }
  }
});

/* ============================================================
 * 戦略提案エンジン
 * ==========================================================*/
function poolList() {
  // {tabletId, remaining} の配列を、所持数分だけ展開したものを返す(検索の簡便化のため種類単位で管理)
  const list = [];
  for (const t of TABLETS) {
    const q = state.pool.get(t.id) || 0;
    if (q > 0) list.push({ tabletId: t.id, qty: q });
  }
  return list;
}

function randomInt(n) { return Math.floor(Math.random() * n); }

function tryPlaceRandom(placements, availableQty, rows, cols) {
  const candidates = TABLETS.filter(t => (availableQty.get(t.id) || 0) > 0);
  if (!candidates.length) return null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const t = candidates[randomInt(candidates.length)];
    const r = randomInt(rows), c = randomInt(cols);
    if (!isCellFree(placements, r, c)) continue;
    if (!conditionSatisfied(t, r, c)) continue;
    const rot = t.rotatable ? randomInt(4) : 0;
    return { tabletId: t.id, r, c, rot };
  }
  return null;
}

function objectiveScore(mode, grid, targetCell) {
  const s = gridStats(grid);
  switch (mode) {
    case 'focus': {
      const tv = targetCell ? grid[targetCell.r][targetCell.c].value : 0;
      return tv * 1000 + s.total - s.negCount * 5;
    }
    case 'spread': {
      // なるべく多くのマスを+1以上にしつつ、偏りを抑える
      let posCells = 0, sumSq = 0;
      for (const row of grid) for (const cell of row) {
        if (cell.value > 0) posCells++;
        sumSq += cell.value * cell.value;
      }
      return posCells * 50 - sumSq * 0.5 - s.negCount * 20;
    }
    case 'maxout': {
      return s.total * 10 - s.negCount * 2;
    }
    case 'safe': {
      return -s.negCount * 200 - Math.abs(s.negative) * 10 + s.positive;
    }
    default: return s.total;
  }
}

function runSearch(mode, opts) {
  const rows = state.rows, cols = state.cols;
  const maxTablets = opts.maxTablets;
  const targetCell = opts.targetCell;
  const baseQty = new Map();
  for (const t of TABLETS) baseQty.set(t.id, state.pool.get(t.id) || 0);

  function remainingQty(placements) {
    const m = new Map(baseQty);
    for (const p of placements) m.set(p.tabletId, (m.get(p.tabletId) || 0) - 1);
    return m;
  }

  let best = { placements: [], score: -Infinity };
  const ITER_RESTARTS = 6;
  const ITER_STEPS = 900;

  for (let restart = 0; restart < ITER_RESTARTS; restart++) {
    let placements = [];
    // 貪欲初期化
    for (let i = 0; i < maxTablets; i++) {
      const remQty = remainingQty(placements);
      const cand = tryPlaceRandom(placements, remQty, rows, cols);
      if (!cand) break;
      placements.push(cand);
    }

    let curGrid = computeGrid(placements, rows, cols);
    let curScore = objectiveScore(mode, curGrid, targetCell);

    let temperature = 1.0;
    for (let step = 0; step < ITER_STEPS; step++) {
      temperature = Math.max(0.02, 1 - step / ITER_STEPS);
      const action = randomInt(4);
      let next = placements.slice();

      if (action === 0 && next.length < maxTablets) {
        // 追加
        const remQty = remainingQty(next);
        const cand = tryPlaceRandom(next, remQty, rows, cols);
        if (cand) next.push(cand);
      } else if (action === 1 && next.length > 0) {
        // 削除
        next.splice(randomInt(next.length), 1);
      } else if (action === 2 && next.length > 0) {
        // 移動 or 回転
        const idx = randomInt(next.length);
        const p = { ...next[idx] };
        const tablet = TABLETS[p.tabletId];
        if (Math.random() < 0.5 && tablet.rotatable) {
          p.rot = (p.rot + 1) % 4;
        } else {
          const rest = next.filter((_, i2) => i2 !== idx);
          const r = randomInt(rows), c = randomInt(cols);
          if (isCellFree(rest, r, c) && conditionSatisfied(tablet, r, c)) {
            p.r = r; p.c = c;
          }
        }
        next[idx] = p;
      } else if (next.length < maxTablets) {
        const remQty = remainingQty(next);
        const cand = tryPlaceRandom(next, remQty, rows, cols);
        if (cand) next.push(cand);
      }

      const nextGrid = computeGrid(next, rows, cols);
      const nextScore = objectiveScore(mode, nextGrid, targetCell);
      const delta = nextScore - curScore;
      if (delta > 0 || Math.random() < Math.exp(delta / (30 * temperature))) {
        placements = next; curScore = nextScore; curGrid = nextGrid;
      }
      if (curScore > best.score) {
        best = { placements: placements.slice(), score: curScore };
      }
    }
  }
  return best;
}

const STRATEGIES = [
  { mode: 'focus', title: '① 集中型', desc: '指定した1マスに+効果を集中させます。狙ったマスに置くアーティファクトを最大強化したいときに。', needsTarget: true },
  { mode: 'spread', title: '② 均等型', desc: 'なるべく多くのマスに万遍なく+が乗るように配置し、マイナスの巻き込みも避けます。', needsTarget: false },
  { mode: 'maxout', title: '③ 総火力型', desc: 'バッグ全体のレベル合計(プラス−マイナス)を最大化します。多少のマイナスは許容。', needsTarget: false },
  { mode: 'safe', title: '④ 安全型', desc: 'マイナスマスの発生を最優先で避けつつ、可能な範囲でプラスを稼ぎます。', needsTarget: false },
];

function updateTargetLabel() {
  const el = document.getElementById('targetLabel');
  if (state.targetCell) {
    el.textContent = `対象マス: (${state.targetCell.r + 1}行, ${state.targetCell.c + 1}列)`;
  } else {
    el.textContent = '対象マス: 未選択(盤面をクリックして指定)';
  }
}

function renderSuggestions() {
  const container = document.getElementById('suggestions');
  container.innerHTML = '<div class="loading">プランを計算中…</div>';
  const maxTablets = parseInt(document.getElementById('maxTabletsInput').value || '6', 10);

  setTimeout(() => {
    container.innerHTML = '';
    for (const strat of STRATEGIES) {
      if (strat.needsTarget && !state.targetCell) {
        const card = document.createElement('div');
        card.className = 'plan-card disabled';
        card.innerHTML = `<h4>${strat.title}</h4><p>${strat.desc}</p><p class="hint">※ 先に「対象マス指定」で盤面のマスをクリックしてください。</p>`;
        container.appendChild(card);
        continue;
      }
      const result = runSearch(strat.mode, { maxTablets, targetCell: state.targetCell });
      const grid = computeGrid(result.placements, state.rows, state.cols);
      const s = gridStats(grid);

      const card = document.createElement('div');
      card.className = 'plan-card';
      const header = document.createElement('h4');
      header.textContent = strat.title;
      const desc = document.createElement('p');
      desc.textContent = strat.desc;

      const previewWrap = document.createElement('div');
      previewWrap.className = 'plan-preview';
      previewWrap.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          const d = document.createElement('div');
          d.className = 'plan-cell';
          const v = grid[r][c].value;
          if (v > 0) d.classList.add('pos');
          else if (v < 0) d.classList.add('neg');
          if (grid[r][c].ignore) d.classList.add('ignore');
          if (v !== 0) d.textContent = (v > 0 ? '+' : '') + v;
          if (state.targetCell && state.targetCell.r === r && state.targetCell.c === c) d.classList.add('target');
          previewWrap.appendChild(d);
        }
      }

      const statLine = document.createElement('div');
      statLine.className = 'plan-stats';
      statLine.innerHTML = `合計 <b class="${s.total>=0?'pos':'neg'}">${s.total>=0?'+':''}${s.total}</b> ／ 使用石板 <b>${result.placements.length}</b>枚 ／ マイナスマス <b>${s.negCount}</b>`;

      const usedList = document.createElement('div');
      usedList.className = 'plan-used';
      const counts = {};
      for (const p of result.placements) {
        const nm = TABLETS[p.tabletId].name;
        counts[nm] = (counts[nm] || 0) + 1;
      }
      usedList.textContent = Object.entries(counts).map(([n, q]) => q > 1 ? `${n}×${q}` : n).join('、') || '(配置なし)';

      const applyBtn = document.createElement('button');
      applyBtn.className = 'apply-btn';
      applyBtn.textContent = 'このプランを盤面に適用';
      applyBtn.addEventListener('click', () => {
        state.placements = result.placements.map(p => ({ ...p }));
        renderBag();
        renderPalette();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      card.appendChild(header);
      card.appendChild(desc);
      card.appendChild(previewWrap);
      card.appendChild(statLine);
      card.appendChild(usedList);
      card.appendChild(applyBtn);
      container.appendChild(card);
    }
  }, 30);
}

/* ============================================================
 * 初期化・イベント配線
 * ==========================================================*/
function applyBagSize() {
  const r = Math.max(1, Math.min(10, parseInt(document.getElementById('rowsInput').value || '5', 10)));
  const c = Math.max(1, Math.min(10, parseInt(document.getElementById('colsInput').value || '6', 10)));
  state.rows = r; state.cols = c;
  state.placements = state.placements.filter(p => inBounds(p.r, p.c));
  state.reserved = new Set([...state.reserved].filter(k => {
    const [rr, cc] = k.split(',').map(Number);
    return inBounds(rr, cc);
  }));
  renderBag();
}

document.getElementById('rowsInput').addEventListener('change', applyBagSize);
document.getElementById('colsInput').addEventListener('change', applyBagSize);

document.getElementById('resetBtn').addEventListener('click', () => {
  state.placements = [];
  renderBag();
  renderPalette();
});

document.getElementById('clearReservedBtn').addEventListener('click', () => {
  state.reserved.clear();
  renderBag();
});

document.getElementById('markReserveBtn').addEventListener('click', (e) => {
  state.markReserveMode = !state.markReserveMode;
  state.pickTargetMode = false;
  document.getElementById('pickTargetBtn').classList.remove('active');
  e.target.classList.toggle('active', state.markReserveMode);
});

document.getElementById('pickTargetBtn').addEventListener('click', (e) => {
  state.pickTargetMode = !state.pickTargetMode;
  state.markReserveMode = false;
  document.getElementById('markReserveBtn').classList.remove('active');
  e.target.classList.toggle('active', state.pickTargetMode);
});

document.getElementById('clearTargetBtn').addEventListener('click', () => {
  state.targetCell = null;
  updateTargetLabel();
  renderBag();
});

document.getElementById('generateBtn').addEventListener('click', renderSuggestions);

document.querySelectorAll('.rarity-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.rarity-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    paletteFilter.rarity = btn.dataset.rarity;
    renderPalette();
  });
});

document.getElementById('ownedFilter').addEventListener('change', (e) => {
  paletteFilter.owned = e.target.checked;
  renderPalette();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  paletteFilter.text = e.target.value.trim();
  renderPalette();
});

document.getElementById('selectAllBtn').addEventListener('click', () => {
  TABLETS.forEach(t => state.pool.set(t.id, 1));
  renderPalette();
});
document.getElementById('selectNoneBtn').addEventListener('click', () => {
  TABLETS.forEach(t => state.pool.set(t.id, 0));
  renderPalette();
});

updateSelectedBanner();
updateTargetLabel();
renderPalette();
renderBag();
