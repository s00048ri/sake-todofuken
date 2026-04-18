const REGION_GROUPS = [
  { name: '東北', prefs: ['青森', '岩手', '宮城', '秋田', '山形', '福島'] },
  { name: '関東', prefs: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'] },
  { name: '中部', prefs: ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知', '三重'] },
  { name: '近畿', prefs: ['滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'] },
  { name: 'その他', prefs: ['北海道', '鳥取', '島根', '岡山', '広島', '山口', '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島'] },
];

const PRESETS = [
  { label: '仮説1: 灘 vs 伏見', prefs: ['兵庫', '京都', '新潟', '埼玉', '秋田'] },
  { label: '仮説2: 新潟の台頭', prefs: ['新潟', '兵庫', '秋田', '福島', '広島'] },
  { label: '仮説3: 東北の台頭', prefs: ['秋田', '山形', '福島', '宮城', '岩手'] },
  { label: '大都市圏消費', prefs: ['東京', '大阪', '神奈川', '愛知', '埼玉'] },
];

export default function PrefectureSelector({ selected, onChange, maxSelection = 6, regionColors }) {
  const toggle = (pref) => {
    if (selected.includes(pref)) {
      onChange(selected.filter(p => p !== pref));
    } else if (selected.length < maxSelection) {
      onChange([...selected, pref]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.prefs)}
            className="text-xs px-2 py-1 rounded border border-stone-300 hover:bg-stone-100 transition-colors"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => onChange([])}
          className="text-xs px-2 py-1 rounded border border-stone-300 text-stone-400 hover:bg-stone-100"
        >
          クリア
        </button>
      </div>

      {/* Region groups */}
      <div className="flex flex-wrap gap-1">
        {REGION_GROUPS.map(group => (
          <div key={group.name} className="flex flex-wrap gap-0.5 items-center mr-2">
            <span className="text-xs text-stone-400 mr-1">{group.name}:</span>
            {group.prefs.map(pref => {
              const isSelected = selected.includes(pref);
              return (
                <button
                  key={pref}
                  onClick={() => toggle(pref)}
                  className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                    isSelected
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {pref}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-400">
        {selected.length}/{maxSelection} 選択中
      </p>
    </div>
  );
}
