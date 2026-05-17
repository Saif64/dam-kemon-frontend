import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const siteLineColors = {
  Daraz: '#FF4521',
  Startech: '#0F4D2A',
  'Ryans Computers': '#1877F2',
  Chaldal: '#7B61FF',
  Pickaboo: '#FFD23F',
  Rokomari: '#15131A',
};

const defaultColors = ['#FF4521', '#0F4D2A', '#1877F2', '#FFD23F', '#7B61FF', '#6B6B6B'];

const ranges = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: null },
];

function formatPrice(value) {
  return '৳' + Number(value).toLocaleString('en-IN');
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg border border-line-strong">
      <p className="text-gray text-[11px] font-mono mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray">{entry.name}</span>
          <span className="text-ink font-mono font-bold ml-auto">{formatPrice(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PriceHistoryChart({ history = [] }) {
  const [selectedRange, setSelectedRange] = useState('30d');

  const { chartData, sites } = useMemo(() => {
    if (!history.length) return { chartData: [], sites: [] };

    const range = ranges.find((r) => r.label === selectedRange);
    const now = new Date();
    let filtered = history;
    if (range.days) {
      const cutoff = new Date(now.getTime() - range.days * 86400000);
      filtered = history.filter((h) => new Date(h.date || h.recordedAt || h.scrapedAt) >= cutoff);
    }

    const siteSet = new Set();
    const dateMap = {};

    filtered.forEach((entry) => {
      const dateStr = new Date(entry.date || entry.recordedAt || entry.scrapedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      });
      const siteName = entry.siteName || entry.site || 'Unknown';
      siteSet.add(siteName);
      if (!dateMap[dateStr]) dateMap[dateStr] = { date: dateStr };
      dateMap[dateStr][siteName] = entry.price;
    });

    return { chartData: Object.values(dateMap), sites: [...siteSet] };
  }, [history, selectedRange]);

  if (!history.length) {
    return (
      <div className="card-soft p-8 text-center">
        <p className="text-gray text-sm">No price history available yet</p>
      </div>
    );
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold italic text-ink leading-tight">Price History</h3>
          <p className="text-gray text-[11px] mt-0.5">Daily snapshots across tracked sellers</p>
        </div>
        <div className="flex gap-1 bg-cream-soft rounded-full p-1">
          {ranges.map((r) => (
            <button
              key={r.label}
              onClick={() => setSelectedRange(r.label)}
              className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono font-semibold rounded-full transition-all ${
                selectedRange === r.label ? 'bg-ink text-cream shadow-sm' : 'text-gray hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-gradient-to-br from-cream-soft/40 to-white">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,19,26,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B6B6B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6B6B6B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => '৳' + (v / 1000).toFixed(0) + 'k'}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 16, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              iconType="circle"
              iconSize={7}
            />
            {sites.map((site, i) => (
              <Line
                key={site}
                type="monotone"
                dataKey={site}
                name={site}
                stroke={siteLineColors[site] || defaultColors[i % defaultColors.length]}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: '#FFF6EC' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
