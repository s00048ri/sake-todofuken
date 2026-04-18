import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import typeData from '../data/productionByType.json';

const TYPE_COLORS = {
  '純米酒': '#22c55e',
  '純米吟醸酒': '#3b82f6',
  '吟醸酒': '#a855f7',
  '本醸造酒': '#f97316',
  '一般酒全体': '#d4d4d4',
};

const TYPE_ORDER = ['純米吟醸酒', '純米酒', '吟醸酒', '本醸造酒', '一般酒全体'];

export default function TypeBreakdown({ selectedPrefs }) {
  const chartData = useMemo(() => {
    if (!selectedPrefs || selectedPrefs.length === 0) return [];

    // 最新年度のデータを使用
    const latestYear = Object.keys(typeData).sort().pop();
    const yearData = typeData[latestYear];
    if (!yearData) return [];

    return selectedPrefs.map(pref => {
      const row = { pref };
      let total = 0;

      // 清酒全体からトータルを取得
      const totalItem = yearData['清酒全体']?.find(d => d.pref === pref);
      if (totalItem) total = totalItem.value || 0;

      TYPE_ORDER.forEach(type => {
        if (type === '一般酒全体') {
          // 一般酒 = 全体 - 特定名称酒合計
          const tokumeiTotal = ['純米酒', '純米吟醸酒', '吟醸酒', '本醸造酒']
            .reduce((sum, t) => {
              const item = yearData[t]?.find(d => d.pref === pref);
              return sum + (item?.value || 0);
            }, 0);
          row[type] = Math.max(0, total - tokumeiTotal);
        } else {
          const item = yearData[type]?.find(d => d.pref === pref);
          row[type] = item?.value || 0;
        }
      });

      row.total = total;
      return row;
    });
  }, [selectedPrefs]);

  if (selectedPrefs.length === 0) {
    return null;
  }

  const latestYear = Object.keys(typeData).sort().pop();

  return (
    <div>
      <h3 className="text-sm font-bold mb-2">
        特定名称酒構成（{latestYear}酒造年度、20度換算 kL）
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(200, selectedPrefs.length * 50 + 60)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
          <YAxis type="category" dataKey="pref" tick={{ fontSize: 12 }} width={50} />
          <Tooltip
            formatter={(value, name) => [`${Math.round(value).toLocaleString()} kL`, name]}
          />
          <Legend />
          {TYPE_ORDER.map(type => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              fill={TYPE_COLORS[type]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
