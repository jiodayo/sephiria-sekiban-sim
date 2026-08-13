/*
 * セフィリア(Sephiria) 石板データ
 * 出典: Sephiria攻略Wiki「石板」ページ (石板一覧: 一般/高級/希少/伝説)
 *
 * 各石板は「本体マス(灰)」を原点(0,0)として、周囲マスへの効果を
 * 相対座標 (dr, dc) で持つ。dr=行方向(下+), dc=列方向(右+)。
 *
 * cells[].kind:
 *   'buff'   緑 … 対象マスのアーティファクトのレベル + amount
 *   'debuff' 赤 … 対象マスのアーティファクトのレベル - amount (amountは正の数)
 *   'ignore' 青 … 対象マスのアーティファクトの発動条件を無視する
 *              (amountが0以外の場合はレベル変動も同時に発生)
 *
 * condition: 配置条件コード
 *   null        … なし(どこでも可)
 *   'bottom'    … 最下段に配置
 *   'top'       … 最上段に配置
 *   'edge-lr'   … 右端か左端に配置
 *
 * rotatable: true=回転(90度単位)可能 / false=回転不可
 */

const RARITY = {
  common:   { key: 'common',   label: '一般', color: '#9aa5b1' },
  uncommon: { key: 'uncommon', label: '高級', color: '#4c9f70' },
  rare:     { key: 'rare',     label: '希少', color: '#3d7fd9' },
  legend:   { key: 'legend',   label: '伝説', color: '#c9932f' },
};

const CONDITION_LABEL = {
  null: 'なし',
  'bottom': '最下段に配置',
  'top': '最上段に配置',
  'edge-lr': '右端か左端に配置',
};

// 効果セル定義の簡略記法: [dr, dc, kind, amount]
function cell(dr, dc, kind, amount) {
  return { dr, dc, kind, amount };
}

const TABLETS = [
  // ---------------- 一般 ----------------
  { name: '希望', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(0, 1, 'buff', 1),
  ]},
  { name: '搾取', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(0, -1, 'debuff', 1),
    cell(0, 1, 'buff', 1),
  ]},
  { name: '善意', rarity: 'common', condition: 'bottom', rotatable: false, cells: [
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
  ]},
  { name: '和合', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'debuff', 1),
    cell(0, -1, 'debuff', 1),
    cell(0, 1, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},
  { name: '運命', rarity: 'common', condition: null, rotatable: false, cells: [
    cell(1, 0, 'buff', 1),
  ]},
  { name: '騎士道', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-2, 0, 'buff', 1),
  ]},
  { name: '機知', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 1),
  ]},
  { name: '視線', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 1),
    cell(1, 1, 'debuff', 1),
  ]},
  { name: '到来', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-2, 0, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(1, 0, 'debuff', 1),
    cell(2, 0, 'debuff', 1),
  ]},
  { name: '歓呼', rarity: 'common', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 1),
  ]},
  { name: '握手', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},
  { name: '近似', rarity: 'common', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 1),
    cell(0, 1, 'buff', 1),
  ]},
  { name: '乾燥', rarity: 'common', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},

  // ---------------- 高級 ----------------
  { name: '高揚', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(0, 1, 'ignore', 0),
  ]},
  { name: '転移', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-3, 0, 'debuff', 1),
    cell(-2, 0, 'debuff', 1),
    cell(-1, 0, 'debuff', 1),
    cell(0, -2, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
    cell(0, 2, 'buff', 1),
    cell(0, 3, 'buff', 1),
    cell(1, 0, 'debuff', 1),
  ]},
  { name: '凝集', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 3),
    cell(0, -2, 'debuff', 1),
    cell(0, -1, 'debuff', 1),
    cell(0, 1, 'debuff', 1),
    cell(0, 2, 'debuff', 1),
    cell(0, 3, 'debuff', 1),
  ]},
  { name: '正義', rarity: 'uncommon', condition: 'edge-lr', rotatable: false, cells: [
    cell(-3, 0, 'buff', 1),
    cell(-2, 0, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},
  { name: '鼓動', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-2, 0, 'buff', 2),
  ]},
  { name: '養育', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(1, 0, 'debuff', 1),
    cell(2, 0, 'debuff', 1),
  ]},
  { name: '双星', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-2, 0, 'buff', 2),
    cell(2, 0, 'buff', 2),
  ]},
  { name: '競争', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'debuff', 1),
    cell(-1, 0, 'debuff', 1),
    cell(1, 0, 'buff', 2),
  ]},
  { name: '熱望', rarity: 'uncommon', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 2),
  ]},
  { name: '波', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'debuff', 1),
    cell(-1, 1, 'buff', 2),
    cell(0, 1, 'debuff', 1),
  ]},
  { name: 'いたずら', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(0, -1, 'debuff', 1),
    cell(0, 1, 'debuff', 1),
  ]},
  { name: '献呈', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(1, -1, 'buff', 1),
    cell(1, 1, 'buff', 1),
  ]},
  { name: '収穫', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 2),
    cell(1, 0, 'buff', 2),
  ]},
  { name: '前進', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-3, 0, 'buff', 1),
    cell(-2, 0, 'buff', 1),
    cell(-1, 0, 'buff', 1),
  ]},
  { name: '分配', rarity: 'uncommon', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},
  { name: '三つ首', rarity: 'uncommon', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
  ]},
  { name: '過去', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(0, 1, 'buff', 1),
  ]},
  { name: '未来', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(0, -1, 'buff', 1),
  ]},
  { name: '積載', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-2, -1, 'buff', 1),
    cell(-2, 0, 'buff', 1),
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 1),
  ]},
  { name: '準備', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 1),
    cell(1, 2, 'buff', 1),
  ]},
  { name: '入口', rarity: 'uncommon', condition: null, rotatable: false, cells: [
    cell(-1, -1, 'buff', 1),
    cell(-1, 0, 'buff', 2),
    cell(-1, 1, 'buff', 1),
  ]},
  { name: '名誉', rarity: 'uncommon', condition: null, rotatable: true, cells: [
    cell(-2, -1, 'buff', 1),
    cell(-1, 0, 'buff', 2),
  ]},
  { name: '出口', rarity: 'uncommon', condition: null, rotatable: false, cells: [
    cell(1, -1, 'buff', 1),
    cell(1, 0, 'buff', 2),
    cell(1, 1, 'buff', 1),
  ]},

  // ---------------- 希少 ----------------
  { name: '日除け', rarity: 'rare', condition: 'top', rotatable: false, cells: [
    cell(4, -2, 'buff', 1),
    cell(4, -1, 'buff', 1),
    cell(4, 0, 'buff', 1),
    cell(4, 1, 'buff', 1),
    cell(4, 2, 'buff', 1),
    cell(4, 3, 'buff', 1),
  ]},
  { name: '繋ぎ', rarity: 'rare', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 2),
    cell(1, 0, 'ignore', 0),
  ]},
  { name: '基盤', rarity: 'rare', condition: null, rotatable: false, cells: [
    cell(0, -2, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
    cell(0, 2, 'buff', 1),
    cell(0, 3, 'buff', 1),
  ]},
  { name: '権能', rarity: 'rare', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 3),
  ]},
  { name: '同時性', rarity: 'rare', condition: null, rotatable: false, cells: [
    cell(-2, 0, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(1, 0, 'buff', 1),
    cell(2, 0, 'buff', 1),
  ]},
  { name: '断絶', rarity: 'rare', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'buff', 3),
    cell(0, -1, 'debuff', 1),
    cell(0, 1, 'debuff', 1),
    cell(1, 0, 'buff', 3),
  ]},
  { name: '反抗', rarity: 'rare', condition: null, rotatable: true, cells: [
    cell(-2, 2, 'buff', 1),
    cell(-1, 1, 'buff', 1),
    cell(1, -1, 'buff', 1),
    cell(2, -2, 'buff', 1),
  ]},
  { name: '誓い', rarity: 'rare', condition: null, rotatable: true, cells: [
    cell(-2, 0, 'buff', 2),
    cell(-1, 0, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},

  // ---------------- 伝説 ----------------
  { name: '奇跡', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-3, 0, 'buff', 1),
    cell(-2, 0, 'buff', 1),
    cell(-1, 0, 'buff', 1),
    cell(0, -2, 'buff', 1),
    cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1),
    cell(0, 2, 'buff', 1),
    cell(0, 3, 'buff', 1),
    cell(1, 0, 'buff', 1),
  ]},
  { name: '境界', rarity: 'legend', condition: null, rotatable: false, cells: [
    cell(-3, -2, 'buff', 1), cell(-3, -1, 'buff', 1), cell(-3, 0, 'buff', 1),
    cell(-3, 1, 'buff', 1), cell(-3, 2, 'buff', 1), cell(-3, 3, 'buff', 1),
    cell(1, -2, 'buff', 1), cell(1, -1, 'buff', 1), cell(1, 0, 'buff', 1),
    cell(1, 1, 'buff', 1), cell(1, 2, 'buff', 1), cell(1, 3, 'buff', 1),
  ]},
  { name: '光輝', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 2),
    cell(0, -2, 'buff', 1), cell(0, -1, 'buff', 1),
    cell(0, 1, 'buff', 1), cell(0, 2, 'buff', 1), cell(0, 3, 'buff', 1),
    cell(1, 0, 'buff', 2),
  ]},
  { name: '圧縮', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-3, 0, 'buff', 1),
    cell(-2, 0, 'buff', 2),
    cell(-1, 0, 'buff', 3),
  ]},
  { name: '白日夢', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-2, -1, 'buff', 1), cell(-2, 1, 'buff', 1),
    cell(-1, -1, 'buff', 1), cell(-1, 1, 'buff', 1),
    cell(1, -1, 'buff', 1), cell(1, 1, 'buff', 1),
    cell(2, -1, 'buff', 1), cell(2, 1, 'buff', 1),
  ]},
  { name: '棘', rarity: 'legend', condition: null, rotatable: false, cells: [
    cell(-1, -1, 'buff', 1), cell(-1, 0, 'buff', 2), cell(-1, 1, 'buff', 1),
    cell(0, -1, 'buff', 1), cell(0, 1, 'buff', 1),
    cell(1, -1, 'buff', 1), cell(1, 0, 'buff', 2), cell(1, 1, 'buff', 1),
  ]},
  { name: '確信', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-1, 0, 'buff', 5),
  ]},
  { name: '平和', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(0, -1, 'buff', 3),
    cell(0, 1, 'buff', 3),
  ]},
  { name: '勇気', rarity: 'legend', condition: null, rotatable: true, cells: [
    cell(-3, -3, 'buff', 1),
    cell(-2, -2, 'buff', 1),
    cell(-1, -1, 'buff', 1),
    cell(-1, 1, 'buff', 2),
    cell(1, -1, 'buff', 2),
    cell(1, 1, 'buff', 1),
  ]},
  { name: '歓待', rarity: 'legend', condition: null, rotatable: false, cells: [
    cell(-1, 0, 'ignore', 2),
    cell(0, -1, 'ignore', 1),
  ]},
];

// 一意ID付与
TABLETS.forEach((t, i) => { t.id = i; });

if (typeof module !== 'undefined') module.exports = { TABLETS, RARITY, CONDITION_LABEL };
