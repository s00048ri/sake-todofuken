import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#a855f7', '#ec4899'];

export default function TimeSeriesChart({ data, selectedPrefs, metric = 'absolute', dataKey = 'sales' }) {
  const chartData = useMemo(() => {
    const { years, salesByYear, productionByYear } = data;
    const sourceByYear = dataKey === 'production' ? productionByYear : salesByYear;

    return years
      .filter(y => sourceByYear[String(y)])
      .map(year => {
        const yearData = sourceByYear[String(year)] || [];
        const row = { year };

        if (metric === 'share') {
          const total = yearData.reduce((sum, d) => sum + (d.value || 0), 0);
          selectedPrefs.forEach(pref => {
            const item = yearData.find(d => d.pref === pref);
            row[pref] = item && total > 0 ? ((item.value / total) * 100) : null;
          });
        } else {
          selectedPrefs.forEach(pref => {
            const item = yearData.find(d => d.pref === pref);
            row[pref] = item ? item.value : null;
          });
        }

        return row;
      });
  }, [data, selectedPrefs, metric, dataKey]);

  if (selectedPrefs.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        上のセレクターから都道府県を選択してください
      </div>
    );
  }

  const unit = metric === 'share' ? '%' : 'kL';

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12 }}
          tickFormatter={y => `${y}`}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={v => metric === 'share' ? `${v.toFixed(0)}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
        />
        <Tooltip
          formatter={(value, name) => [
            value != null ? (metric === 'share' ? `${value.toFixed(1)}%` : `${Math.round(value).toLocaleString()} kL`) : '-',
            name
          ]}
          labelFormatter={year => `${year}年`}
        />
        <Legend />
        {selectedPrefs.map((pref, i) => (
          <Line
            key={pref}
            type="monotone"
            dataKey={pref}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
