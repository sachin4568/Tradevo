// ============================================================
// Tradevo AI — Mock Data (Indian Stock Market)
// ============================================================

// ---- Companies ----

export const mockCompanies = [
  {
    id: 'reliance',
    name: 'Reliance Industries',
    ticker: 'RELIANCE',
    price: 2685.4,
    change: 32.23,
    changePercent: 1.21,
    marketCap: '₹18.5L Cr',
    volume: '8.2M',
    pe: 28.6,
    sector: 'Energy',
    aiScore: 82,
    fundamentalScore: 85,
    technicalScore: 78,
    newsCount: 12,
    isWatchlisted: true,
    miniChartData: [2520, 2545, 2530, 2580, 2560, 2600, 2615, 2590, 2635, 2620, 2640, 2655, 2630, 2660, 2670, 2645, 2675, 2680, 2665, 2685],
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    ticker: 'TCS',
    price: 3890.15,
    change: 31.12,
    changePercent: 0.81,
    marketCap: '₹14.2L Cr',
    volume: '3.1M',
    pe: 32.4,
    sector: 'Technology',
    aiScore: 79,
    fundamentalScore: 88,
    technicalScore: 72,
    newsCount: 8,
    isWatchlisted: true,
    miniChartData: [3750, 3770, 3760, 3790, 3800, 3785, 3810, 3830, 3820, 3845, 3835, 3860, 3850, 3870, 3865, 3880, 3875, 3890, 3880, 3890],
  },
  {
    id: 'infosys',
    name: 'Infosys Limited',
    ticker: 'INFY',
    price: 1625.8,
    change: -6.52,
    changePercent: -0.4,
    marketCap: '₹6.8L Cr',
    volume: '12.5M',
    pe: 27.8,
    sector: 'Technology',
    aiScore: 71,
    fundamentalScore: 80,
    technicalScore: 64,
    newsCount: 6,
    isWatchlisted: false,
    miniChartData: [1660, 1655, 1665, 1650, 1645, 1655, 1640, 1648, 1638, 1645, 1635, 1640, 1630, 1638, 1625, 1632, 1628, 1635, 1620, 1626],
  },
  {
    id: 'hdfcbank',
    name: 'HDFC Bank',
    ticker: 'HDFCBANK',
    price: 1695.3,
    change: 10.17,
    changePercent: 0.6,
    marketCap: '₹12.9L Cr',
    volume: '5.8M',
    pe: 21.2,
    sector: 'Financial Services',
    aiScore: 85,
    fundamentalScore: 90,
    technicalScore: 80,
    newsCount: 10,
    isWatchlisted: true,
    miniChartData: [1640, 1650, 1645, 1660, 1655, 1670, 1665, 1675, 1680, 1670, 1685, 1688, 1675, 1690, 1685, 1695, 1688, 1690, 1698, 1695],
  },
  {
    id: 'icicibank',
    name: 'ICICI Bank',
    ticker: 'ICICIBANK',
    price: 1145.6,
    change: 17.18,
    changePercent: 1.52,
    marketCap: '₹8.1L Cr',
    volume: '15.2M',
    pe: 19.8,
    sector: 'Financial Services',
    aiScore: 83,
    fundamentalScore: 86,
    technicalScore: 79,
    newsCount: 9,
    isWatchlisted: false,
    miniChartData: [1100, 1108, 1115, 1110, 1120, 1125, 1118, 1130, 1128, 1135, 1140, 1132, 1138, 1145, 1140, 1148, 1142, 1150, 1145, 1146],
  },
  {
    id: 'bhartiartl',
    name: 'Bharti Airtel',
    ticker: 'BHARTIARTL',
    price: 1580.25,
    change: 32.68,
    changePercent: 2.11,
    marketCap: '₹9.4L Cr',
    volume: '6.7M',
    pe: 75.3,
    sector: 'Technology',
    aiScore: 76,
    fundamentalScore: 72,
    technicalScore: 82,
    newsCount: 14,
    isWatchlisted: false,
    miniChartData: [1480, 1495, 1510, 1505, 1520, 1535, 1525, 1540, 1548, 1555, 1545, 1560, 1555, 1570, 1565, 1580, 1572, 1578, 1582, 1580],
  },
  {
    id: 'sbin',
    name: 'State Bank of India',
    ticker: 'SBIN',
    price: 812.4,
    change: -2.44,
    changePercent: -0.3,
    marketCap: '₹7.3L Cr',
    volume: '22.1M',
    pe: 10.5,
    sector: 'Financial Services',
    aiScore: 68,
    fundamentalScore: 70,
    technicalScore: 65,
    newsCount: 7,
    isWatchlisted: false,
    miniChartData: [825, 822, 828, 820, 818, 824, 815, 820, 816, 822, 818, 810, 815, 808, 812, 806, 810, 815, 808, 812],
  },
  {
    id: 'itc',
    name: 'ITC Limited',
    ticker: 'ITC',
    price: 465.75,
    change: -0.93,
    changePercent: -0.2,
    marketCap: '₹5.8L Cr',
    volume: '18.4M',
    pe: 26.4,
    sector: 'FMCG',
    aiScore: 65,
    fundamentalScore: 75,
    technicalScore: 55,
    newsCount: 5,
    isWatchlisted: false,
    miniChartData: [470, 468, 472, 469, 471, 467, 469, 466, 468, 470, 467, 464, 468, 465, 467, 463, 466, 468, 464, 466],
  },
  {
    id: 'hindunilvr',
    name: 'Hindustan Unilever',
    ticker: 'HINDUNILVR',
    price: 2340.5,
    change: 7.02,
    changePercent: 0.3,
    marketCap: '₹5.5L Cr',
    volume: '2.1M',
    pe: 55.8,
    sector: 'FMCG',
    aiScore: 60,
    fundamentalScore: 78,
    technicalScore: 48,
    newsCount: 4,
    isWatchlisted: false,
    miniChartData: [2310, 2318, 2315, 2322, 2328, 2325, 2330, 2326, 2332, 2338, 2335, 2340, 2336, 2338, 2342, 2338, 2340, 2345, 2340, 2341],
  },
  {
    id: 'bajajfinance',
    name: 'Bajaj Finance',
    ticker: 'BAJFINANCE',
    price: 7250.8,
    change: 130.51,
    changePercent: 1.83,
    marketCap: '₹4.5L Cr',
    volume: '1.8M',
    pe: 38.2,
    sector: 'Financial Services',
    aiScore: 80,
    fundamentalScore: 84,
    technicalScore: 76,
    newsCount: 11,
    isWatchlisted: true,
    miniChartData: [6900, 6950, 6930, 6980, 7020, 7000, 7050, 7080, 7060, 7100, 7120, 7090, 7140, 7160, 7130, 7180, 7200, 7190, 7220, 7251],
  },
  {
    id: 'wipro',
    name: 'Wipro Limited',
    ticker: 'WIPRO',
    price: 485.3,
    change: -2.93,
    changePercent: -0.6,
    marketCap: '₹2.6L Cr',
    volume: '9.3M',
    pe: 24.1,
    sector: 'Technology',
    aiScore: 58,
    fundamentalScore: 65,
    technicalScore: 52,
    newsCount: 3,
    isWatchlisted: false,
    miniChartData: [498, 495, 500, 496, 492, 496, 490, 494, 488, 492, 486, 490, 485, 488, 482, 486, 484, 488, 482, 485],
  },
  {
    id: 'maruti',
    name: 'Maruti Suzuki',
    ticker: 'MARUTI',
    price: 12450.0,
    change: 112.05,
    changePercent: 0.91,
    marketCap: '₹3.9L Cr',
    volume: '0.8M',
    pe: 30.5,
    sector: 'Automotive',
    aiScore: 74,
    fundamentalScore: 82,
    technicalScore: 68,
    newsCount: 7,
    isWatchlisted: false,
    miniChartData: [12100, 12150, 12130, 12200, 12250, 12220, 12280, 12300, 12280, 12350, 12330, 12380, 12400, 12370, 12420, 12400, 12430, 12450, 12420, 12450],
  },
  {
    id: 'lt',
    name: 'Larsen & Toubro',
    ticker: 'LT',
    price: 3540.6,
    change: 49.57,
    changePercent: 1.42,
    marketCap: '₹4.9L Cr',
    volume: '2.4M',
    pe: 34.7,
    sector: 'Automotive',
    aiScore: 77,
    fundamentalScore: 83,
    technicalScore: 72,
    newsCount: 8,
    isWatchlisted: false,
    miniChartData: [3380, 3400, 3390, 3420, 3440, 3430, 3460, 3475, 3460, 3490, 3480, 3500, 3490, 3510, 3505, 3520, 3515, 3530, 3520, 3541],
  },
  {
    id: 'axisbank',
    name: 'Axis Bank',
    ticker: 'AXISBANK',
    price: 1120.35,
    change: 7.84,
    changePercent: 0.7,
    marketCap: '₹3.5L Cr',
    volume: '11.6M',
    pe: 14.2,
    sector: 'Financial Services',
    aiScore: 72,
    fundamentalScore: 78,
    technicalScore: 66,
    newsCount: 6,
    isWatchlisted: false,
    miniChartData: [1090, 1095, 1092, 1100, 1105, 1102, 1108, 1112, 1108, 1115, 1112, 1118, 1115, 1120, 1116, 1122, 1118, 1124, 1120, 1120],
  },
  {
    id: 'asianpaint',
    name: 'Asian Paints',
    ticker: 'ASIANPAINT',
    price: 2890.4,
    change: -14.47,
    changePercent: -0.5,
    marketCap: '₹2.8L Cr',
    volume: '1.5M',
    pe: 58.3,
    sector: 'FMCG',
    aiScore: 55,
    fundamentalScore: 68,
    technicalScore: 45,
    newsCount: 4,
    isWatchlisted: false,
    miniChartData: [2940, 2935, 2945, 2930, 2925, 2932, 2920, 2928, 2915, 2922, 2910, 2918, 2905, 2912, 2900, 2908, 2895, 2900, 2888, 2890],
  },
] as const

// ---- User ----

export const mockUser = {
  id: 'user-001',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@gmail.com',
  phone: '+91 98765 43210',
  avatar: 'AM',
  joinedDate: '2023-06-15',
  riskTolerance: 'Moderate' as const,
  investmentGoal: 'Long-term Wealth',
  occupation: 'Software Engineer',
  panVerified: true,
  phoneVerified: true,
  emailVerified: true,
  kycStatus: 'verified' as const,
  dematLinked: true,
  panNumber: 'ABCPM1234K',
  investmentHorizon: '5-10 years',
  preferredSectors: ['Technology', 'Financial Services', 'Energy', 'FMCG'],
}

// ---- Portfolio ----

export const mockPortfolio = {
  totalValue: 1245670,
  cash: 123450,
  dayPnl: 4230,
  dayPnlPercent: 0.34,
  overallPnl: 145230,
  overallPnlPercent: 13.2,
  holdings: [
    {
      companyId: 'reliance',
      name: 'Reliance Industries',
      ticker: 'RELIANCE',
      qty: 66,
      avgPrice: 2480.0,
      currentPrice: 2685.4,
      dayChange: 32.23,
      dayChangePercent: 1.21,
      totalInvested: 163680,
      currentValue: 177236,
      pnl: 13556,
      pnlPercent: 8.28,
      sector: 'Energy',
    },
    {
      companyId: 'tcs',
      name: 'Tata Consultancy Services',
      ticker: 'TCS',
      qty: 35,
      avgPrice: 3620.0,
      currentPrice: 3890.15,
      dayChange: 31.12,
      dayChangePercent: 0.81,
      totalInvested: 126700,
      currentValue: 136155,
      pnl: 9455,
      pnlPercent: 7.46,
      sector: 'Technology',
    },
    {
      companyId: 'infosys',
      name: 'Infosys Limited',
      ticker: 'INFY',
      qty: 80,
      avgPrice: 1510.0,
      currentPrice: 1625.8,
      dayChange: -6.52,
      dayChangePercent: -0.4,
      totalInvested: 120800,
      currentValue: 130064,
      pnl: 9264,
      pnlPercent: 7.67,
      sector: 'Technology',
    },
    {
      companyId: 'hdfcbank',
      name: 'HDFC Bank',
      ticker: 'HDFCBANK',
      qty: 60,
      avgPrice: 1560.0,
      currentPrice: 1695.3,
      dayChange: 10.17,
      dayChangePercent: 0.6,
      totalInvested: 93600,
      currentValue: 101718,
      pnl: 8118,
      pnlPercent: 8.67,
      sector: 'Financial Services',
    },
    {
      companyId: 'icicibank',
      name: 'ICICI Bank',
      ticker: 'ICICIBANK',
      qty: 108,
      avgPrice: 990.0,
      currentPrice: 1145.6,
      dayChange: 17.18,
      dayChangePercent: 1.52,
      totalInvested: 106920,
      currentValue: 123725,
      pnl: 16805,
      pnlPercent: 15.72,
      sector: 'Financial Services',
    },
    {
      companyId: 'itc',
      name: 'ITC Limited',
      ticker: 'ITC',
      qty: 200,
      avgPrice: 448.0,
      currentPrice: 465.75,
      dayChange: -0.93,
      dayChangePercent: -0.2,
      totalInvested: 89600,
      currentValue: 93150,
      pnl: 3550,
      pnlPercent: 3.96,
      sector: 'FMCG',
    },
    {
      companyId: 'bajajfinance',
      name: 'Bajaj Finance',
      ticker: 'BAJFINANCE',
      qty: 20,
      avgPrice: 6950.0,
      currentPrice: 7250.8,
      dayChange: 130.51,
      dayChangePercent: 1.83,
      totalInvested: 139000,
      currentValue: 145016,
      pnl: 6016,
      pnlPercent: 4.33,
      sector: 'Financial Services',
    },
    {
      companyId: 'lt',
      name: 'Larsen & Toubro',
      ticker: 'LT',
      qty: 40,
      avgPrice: 3250.0,
      currentPrice: 3540.6,
      dayChange: 49.57,
      dayChangePercent: 1.42,
      totalInvested: 130000,
      currentValue: 141624,
      pnl: 11624,
      pnlPercent: 8.94,
      sector: 'Automotive',
    },
    {
      companyId: 'bhartiartl',
      name: 'Bharti Airtel',
      ticker: 'BHARTIARTL',
      qty: 45,
      avgPrice: 1380.0,
      currentPrice: 1580.25,
      dayChange: 32.68,
      dayChangePercent: 2.11,
      totalInvested: 62100,
      currentValue: 71111,
      pnl: 9011,
      pnlPercent: 14.51,
      sector: 'Technology',
    },
  ],
}

// ---- Portfolio Chart (deterministic, 120 trading days) ----

const PORTFOLIO_VALUES = [
  1180000,1183200,1179500,1187400,1192100,1188600,1195800,1201200,1197800,1204500,
  1210200,1206800,1212500,1218900,1215200,1221300,1217800,1224100,1229500,1225800,
  1232100,1228800,1235600,1241200,1237800,1244500,1250100,1246800,1253200,1258900,
  1255200,1261800,1258500,1265100,1270800,1267200,1273800,1279500,1275800,1282100,
  1288500,1284800,1291200,1296800,1293500,1299800,1305200,1301800,1308200,1313500,
  1309800,1316200,1321500,1318200,1324800,1330200,1326500,1332800,1338500,1335200,
  1341800,1347200,1343500,1349800,1355200,1351800,1358200,1363500,1359800,1366200,
  1371500,1368200,1374800,1380200,1376500,1382800,1388500,1385200,1391500,1396800,
  1393500,1399800,1405200,1401800,1408200,1413500,1409800,1416200,1421500,1418200,
  1424800,1430200,1426500,1432800,1438500,1435200,1441800,1447200,1443500,1449800,
  1455200,1451800,1458200,1463500,1459800,1466200,1471500,1468200,1474800,1480200,
  1476500,1482800,1488500,1485200,1491500,1496800,1493500,1499800,1505200,1501800,
  1508200,1513500,1509800,1516200,1521500,1518200,1524800,1530200,1526500,1532800,
]

const PORTFOLIO_DATES: string[] = []
const startDate = new Date('2025-01-02')
for (let i = 0; i < 120; i++) {
  const d = new Date(startDate)
  d.setDate(d.getDate() + i)
  const dow = d.getDay()
  if (dow === 0 || dow === 6) continue
  PORTFOLIO_DATES.push(d.toISOString().split('T')[0])
}

const BENCHMARK_VALUES = [
  10000,10012,9995,10028,10052,10032,10068,10095,10078,10110,
  10142,10125,10158,10192,10172,10205,10188,10222,10252,10235,
  10268,10252,10285,10315,10298,10332,10362,10345,10378,10408,
  10392,10425,10408,10442,10472,10455,10488,10518,10502,10535,
  10568,10552,10585,10612,10598,10628,10658,10642,10675,10702,
  10688,10718,10748,10732,10765,10792,10778,10808,10838,10822,
  10855,10882,10868,10902,10932,10915,10948,10975,10962,10992,
  11022,11008,11038,11065,11052,11082,11112,11098,11128,11155,
  11142,11172,11202,11188,11218,11245,11232,11262,11288,11275,
  11305,11332,11318,11348,11378,11365,11395,11422,11408,11438,
  11468,11455,11485,11512,11498,11528,11555,11542,11572,11598,
  11585,11615,11645,11632,11662,11688,11675,11705,11732,11718,
  11748,11775,11762,11792,11818,11805,11835,11862,11848,11878,
]

export const mockPortfolioChart = PORTFOLIO_DATES.map((date, i) => ({
  date,
  value: PORTFOLIO_VALUES[i],
  benchmark: BENCHMARK_VALUES[i],
}))

// ---- Portfolio OHLC Candlestick Data (deterministic, ~180 trading days) ----

export interface CandlestickData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const PORTFOLIO_OHLC_SEED = [
  1180000,1183200,1179500,1187400,1192100,1188600,1195800,1201200,1197800,1204500,
  1210200,1206800,1212500,1218900,1215200,1221300,1217800,1224100,1229500,1225800,
  1232100,1228800,1235600,1241200,1237800,1244500,1250100,1246800,1253200,1258900,
  1255200,1261800,1258500,1265100,1270800,1267200,1273800,1279500,1275800,1282100,
]

export const mockPortfolioOHLC: CandlestickData[] = (function generatePortfolioOHLC() {
  const result: CandlestickData[] = []
  const seed = PORTFOLIO_OHLC_SEED.reduce((a, b) => a + b, 0)
  let price = PORTFOLIO_OHLC_SEED[0] ?? 1180000

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 260)

  let rng = seed
  const nextRand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return (rng % 1000) / 1000
  }

  for (let i = 0; i < 260; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue

    const trendBias = (PORTFOLIO_OHLC_SEED[i % PORTFOLIO_OHLC_SEED.length] - 1250000) / 1250000
    const volatility = 0.008 + nextRand() * 0.006
    const direction = (nextRand() - 0.47 + trendBias * 0.2)

    const open = price
    const change = price * direction * volatility
    const close = price + change
    const wickUp = price * (0.001 + nextRand() * 0.003) * (direction > 0 ? 1 : 0.5)
    const wickDown = price * (0.001 + nextRand() * 0.003) * (direction > 0 ? 0.5 : 1)
    const high = Math.max(open, close) + wickUp
    const low = Math.min(open, close) - wickDown
    const volume = Math.round((100000 + nextRand() * 500000) * (1 + Math.abs(direction) * 2))

    result.push({
      date: d.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    })

    price = close
  }

  return result
})()

// ---- Candlestick Data Generator (deterministic) ----

/** Generate realistic OHLCV candlestick data from mini chart array */
export function generateCandlestickData(
  miniChartData: readonly number[],
  basePrice: number,
  days: number = 60
): CandlestickData[] {
  const result: CandlestickData[] = []
  const seed = miniChartData.reduce((a, b) => a + Math.round(b), 0)
  let price = miniChartData[0] ?? basePrice

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Simple seeded pseudo-random
  let rng = seed
  const nextRand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return (rng % 1000) / 1000
  }

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) continue

    // Use miniChartData values cyclically for trend bias
    const trendBias = (miniChartData[i % miniChartData.length] - basePrice) / basePrice

    const volatility = 0.015 + nextRand() * 0.01
    const direction = (nextRand() - 0.48 + trendBias * 0.3)

    const open = price
    const change = price * direction * volatility
    const close = price + change
    const wickUp = price * (0.002 + nextRand() * 0.005) * (direction > 0 ? 1 : 0.5)
    const wickDown = price * (0.002 + nextRand() * 0.005) * (direction > 0 ? 0.5 : 1)
    const high = Math.max(open, close) + wickUp
    const low = Math.min(open, close) - wickDown
    const volume = Math.round((500000 + nextRand() * 2000000) * (1 + Math.abs(direction) * 3))

    result.push({
      date: d.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })

    price = close
  }

  return result
}

// ---- Sector Allocation ----

export const mockSectorAllocation = [
  { sector: 'Technology', value: 337330, percentage: 30.0, color: 'hsl(185, 80%, 50%)' },
  { sector: 'Financial Services', value: 471614, percentage: 42.0, color: 'hsl(160, 70%, 45%)' },
  { sector: 'FMCG', value: 93150, percentage: 8.3, color: 'hsl(38, 90%, 55%)' },
  { sector: 'Energy', value: 177236, percentage: 15.8, color: 'hsl(15, 80%, 55%)' },
  { sector: 'Automotive', value: 141624, percentage: 3.9, color: 'hsl(220, 70%, 60%)' },
]

// ---- AI Brief ----

export const mockAIBrief = {
  marketMood: 'Cautiously Optimistic' as const,
  sentiment: 'positive' as const,
  topInsight:
    'NIFTY 50 is testing the 24,500 resistance level with strong institutional buying in banking and energy sectors. FII net buyers for the 5th consecutive session. Global cues remain supportive with US Fed signalling a pause on rate hikes, boosting emerging market sentiment.',
  watchlistAlerts: [
    {
      company: 'Bajaj Finance',
      message: 'Breaking above 200-DMA with volume spike. Short-term target ₹7,600 if it sustains above ₹7,200.',
      type: 'opportunity' as const,
    },
    {
      company: 'Infosys',
      message: 'RSI entering overbought zone (72). Consider trailing stop-loss if holding long positions.',
      type: 'warning' as const,
    },
    {
      company: 'ICICI Bank',
      message: 'Q3 results beat estimates by 8%. ROE improvement trend continues — strong accumulation signal.',
      type: 'opportunity' as const,
    },
  ],
  portfolioObservation:
    'Your portfolio is heavily weighted towards Financial Services (42%) and Technology (30%). While these sectors are performing well, consider diversifying into Healthcare or Consumer Durables to reduce concentration risk. Your ICICI Bank position has gained 15.7% — consider booking partial profits at the next resistance level of ₹1,180.',
}

// ---- Notifications ----

export const mockNotifications = [
  {
    id: 'n1',
    type: 'ai' as const,
    title: 'AI Portfolio Insight',
    message: 'Your ICICI Bank holding has gained 15.7%. Consider booking partial profits.',
    time: '2m ago',
    read: false,
    icon: 'Sparkles',
  },
  {
    id: 'n2',
    type: 'market' as const,
    title: 'Market Alert',
    message: 'NIFTY 50 crossed 24,500 — highest level in 3 months.',
    time: '15m ago',
    read: false,
    icon: 'TrendingUp',
  },
  {
    id: 'n3',
    type: 'watchlist' as const,
    title: 'Watchlist Alert',
    message: 'Bajaj Finance surged 1.83% today, crossing ₹7,250.',
    time: '32m ago',
    read: false,
    icon: 'Eye',
  },
  {
    id: 'n4',
    type: 'portfolio' as const,
    title: 'Dividend Credited',
    message: '₹1,320 dividend from ITC Limited credited to your account.',
    time: '1h ago',
    read: false,
    icon: 'IndianRupee',
  },
  {
    id: 'n5',
    type: 'research' as const,
    title: 'New Research Report',
    message: 'Deep analysis on Reliance Industries Jio Financial IPO impact.',
    time: '2h ago',
    read: false,
    icon: 'FileText',
  },
  {
    id: 'n6',
    type: 'alert' as const,
    title: 'Price Alert Triggered',
    message: 'HDFC Bank hit your target price of ₹1,690.',
    time: '3h ago',
    read: false,
    icon: 'Bell',
  },
  {
    id: 'n7',
    type: 'ai' as const,
    title: 'AI Risk Warning',
    message: 'Infosys RSI at 72 — approaching overbought territory.',
    time: '4h ago',
    read: true,
    icon: 'ShieldAlert',
  },
  {
    id: 'n8',
    type: 'learning' as const,
    title: 'Learning Milestone',
    message: 'You completed "Understanding Technical Indicators" module!',
    time: '5h ago',
    read: true,
    icon: 'GraduationCap',
  },
  {
    id: 'n9',
    type: 'market' as const,
    title: 'Sector Update',
    message: 'Banking sector up 1.2% on RBI dovish policy stance.',
    time: '6h ago',
    read: true,
    icon: 'Landmark',
  },
  {
    id: 'n10',
    type: 'portfolio' as const,
    title: 'SIP Executed',
    message: 'Monthly SIP of ₹10,000 executed in Reliance Industries.',
    time: '1d ago',
    read: true,
    icon: 'Repeat',
  },
  {
    id: 'n11',
    type: 'watchlist' as const,
    title: 'Earnings Reminder',
    message: 'TCS Q3 results tomorrow at 9:30 AM IST.',
    time: '1d ago',
    read: true,
    icon: 'Calendar',
  },
  {
    id: 'n12',
    type: 'research' as const,
    title: 'Weekly Market Wrap',
    message: 'Weekly market summary and key levels for next week are ready.',
    time: '2d ago',
    read: true,
    icon: 'BarChart3',
  },
]

// ---- Research Reports ----

export const mockResearchReports = [
  {
    id: 'r1',
    companyId: 'reliance',
    companyName: 'Reliance Industries',
    ticker: 'RELIANCE',
    summary:
      'Reliance Industries continues its transformation from an oil & gas conglomerate to a diversified new-energy and digital services powerhouse. Jio Financial Services IPO anticipation and green energy capex drive near-term catalysts.',
    overallScore: 84,
    confidence: 'high' as const,
    bullBear: 'bullish' as const,
    verdict:
      'Strong BUY with a 12-month target of ₹3,100. The convergence of retail (Reliance Retail), telecom (Jio), and new energy businesses creates a unique moat. Near-term catalysts include Jio Financial listing and Q3 earnings.',
    riskLevel: 'medium' as const,
    sections: [
      {
        title: 'Business Overview',
        content:
          'Reliance operates India\'s largest private sector conglomerate spanning petrochemicals, refining, retail, and telecommunications. The recent pivot towards green energy (solar, hydrogen, battery storage) and financial services positions the company for the next decade of growth.',
        score: 85,
      },
      {
        title: 'Financial Performance',
        content:
          'Revenue grew 18.5% YoY to ₹9.3L Cr in FY24. EBITDA margins improved 200bps driven by retail and Jio contributions. Net debt reduced by ₹35,000 Cr. Free cash flow generation remains robust at ₹78,000 Cr annually.',
        score: 88,
      },
      {
        title: 'Valuation Analysis',
        content:
          'Trading at 28.6x PE vs 5-year average of 25x. SOTP valuation suggests 15% upside. Retail business alone valued at ₹13L Cr by most analysts. Green energy investments (₹75,000 Cr capex plan) not fully priced in.',
        score: 72,
      },
      {
        title: 'Technical Analysis',
        content:
          'Stock has broken above the 200-DMA and is trending higher. Immediate support at ₹2,550, resistance at ₹2,750. RSI at 62 — healthy uptrend without overbought conditions. MACD bullish crossover confirmed.',
        score: 80,
      },
      {
        title: 'Risk Factors',
        content:
          'Key risks include crude oil price volatility impacting refining margins, regulatory changes in telecom sector, execution risk in green energy projects, and potential delay in Jio Financial Services IPO.',
        score: null,
      },
    ],
  },
  {
    id: 'r2',
    companyId: 'hdfcbank',
    companyName: 'HDFC Bank',
    ticker: 'HDFCBANK',
    summary:
      'Post-merger with HDFC Ltd, India\'s largest private sector bank is navigating integration challenges while maintaining strong growth. Deposit franchise remains the crown jewel with industry-leading CASA ratio.',
    overallScore: 86,
    confidence: 'high' as const,
    bullBear: 'bullish' as const,
    verdict:
      'BUY with 12-month target of ₹1,950. Post-merger synergies expected to yield ₹2,500 Cr in cost savings by FY26. Mortgage book cross-sell opportunity is massive. Near-term NIM compression is already priced in.',
    riskLevel: 'low' as const,
    sections: [
      {
        title: 'Business Overview',
        content:
          'HDFC Bank is India\'s largest private sector bank by assets post the merger with parent HDFC Ltd. The merged entity commands a deposit base of ₹37L Cr and a loan book of ₹35L Cr, creating a financial services behemoth.',
        score: 90,
      },
      {
        title: 'Financial Performance',
        content:
          'Net interest income grew 22% YoY. NIM compressed 30bps post-merger to 3.4% but expected to stabilize. GNPA improved to 1.24%. Credit cost at 0.6% remains among the best in the industry. Capital adequacy at 18.5%.',
        score: 92,
      },
      {
        title: 'Valuation Analysis',
        content:
          'Trading at 2.8x P/B vs historical average of 3.2x. At current levels, the stock offers a favorable risk-reward. Merger integration progress and NIM trajectory will be key re-rating triggers. Dividend yield of 1.2%.',
        score: 78,
      },
      {
        title: 'Technical Analysis',
        content:
          'Consolidating in a broad range of ₹1,600-1,720. Breakout above ₹1,720 with volume could push towards ₹1,850. 50-DMA at ₹1,660 acting as strong support. Accumulation pattern visible on weekly charts.',
        score: 82,
      },
      {
        title: 'Risk Factors',
        content:
          'Merger integration risks, potential asset quality deterioration in unsecured loan portfolio, RBI regulatory tightening on unsecured lending, and competitive pressure from fintech lenders.',
        score: null,
      },
    ],
  },
  {
    id: 'r3',
    companyId: 'infosys',
    companyName: 'Infosys Limited',
    ticker: 'INFY',
    summary:
      'Infosys faces near-term headwinds from slowing discretionary IT spending in North America and Europe. However, strong deal pipeline in AI/GenAI services and cost optimization measures provide a buffer.',
    overallScore: 68,
    confidence: 'medium' as const,
    bullBear: 'neutral' as const,
    verdict:
      'HOLD with a revised target of ₹1,700. Near-term revenue growth likely to remain subdued at 4-5%. AI services (Topaz platform) gaining traction with $2.3B in deal TCV. Wait for clearer signs of demand recovery before adding.',
    riskLevel: 'medium' as const,
    sections: [
      {
        title: 'Business Overview',
        content:
          'Infosys is India\'s second-largest IT services company with operations in 56 countries. The company has been aggressively pivoting towards AI-powered services through its Topaz platform and cloud transformation offerings.',
        score: 75,
      },
      {
        title: 'Financial Performance',
        content:
          'Revenue growth moderated to 4.2% YoY in constant currency. Operating margin expanded 80bps to 21.4% through aggressive cost optimization. Free cash flow conversion improved to 95%. Attrition reduced to 12.9%.',
        score: 65,
      },
      {
        title: 'Valuation Analysis',
        content:
          'Trading at 27.8x PE, in line with sector peers. At current growth rates, the valuation appears stretched. A re-rating catalyst would require revenue acceleration above 8%. Dividend yield of 2.3% provides some support.',
        score: 58,
      },
      {
        title: 'Technical Analysis',
        content:
          'RSI at 72 approaching overbought zone. Stock facing resistance at ₹1,650-1,660 band. Support at ₹1,580. Bearish divergence on daily RSI suggests possible near-term correction to ₹1,550.',
        score: 55,
      },
      {
        title: 'Risk Factors',
        content:
          'Key person risk, slowing global IT spending, intensifying competition from TCS and global SIs, currency volatility (INR/USD), and potential disruption from AI reducing traditional outsourcing demand.',
        score: null,
      },
    ],
  },
  {
    id: 'r4',
    companyId: 'bajajfinance',
    companyName: 'Bajaj Finance',
    ticker: 'BAJFINANCE',
    summary:
      'India\'s most valuable NBFC is experiencing a multi-year growth trajectory driven by financial inclusion, digital lending, and expansion into new credit segments. Recent regulatory concerns on unsecured lending have been addressed.',
    overallScore: 81,
    confidence: 'high' as const,
    bullBear: 'bullish' as const,
    verdict:
      'BUY with 12-month target of ₹8,200. The company\'s cross-sell strategy across EMI, personal loans, and insurance is creating a powerful ecosystem. AUM growth of 32% YoY and improving asset quality support the bull case.',
    riskLevel: 'medium' as const,
    sections: [
      {
        title: 'Business Overview',
        content:
          'Bajaj Finance is India\'s largest NBFC by market capitalization, offering consumer loans, SME finance, and rural lending. The company has 78 million customers and is rapidly expanding its digital-first lending platform.',
        score: 82,
      },
      {
        title: 'Financial Performance',
        content:
          'AUM grew 32% YoY to ₹3.5L Cr. Net interest margin expanded 40bps to 11.2%. GNPA improved sequentially to 1.56%. New loans booked grew 28% to 10.2M. Customer addition of 4.2M in Q2 — strongest ever quarterly addition.',
        score: 86,
      },
      {
        title: 'Valuation Analysis',
        content:
          'Trading at 5.2x P/B, above historical average of 4.8x. Premium valuation justified by superior ROE of 22% and consistent AUM growth. If growth trajectory sustains, re-rating to 5.5x P/B is possible.',
        score: 74,
      },
      {
        title: 'Technical Analysis',
        content:
          'Strong breakout above 200-DMA with expanding volume. Cup and handle pattern on weekly charts targets ₹8,000. Immediate support at ₹6,900. RSI at 68 — strong momentum without overbought conditions.',
        score: 78,
      },
      {
        title: 'Risk Factors',
        content:
          'RBI regulatory tightening on unsecured lending, rising credit costs in personal loan segment, competition from banks entering consumer lending space, and macro headwinds from potential economic slowdown.',
        score: null,
      },
    ],
  },
]

// ---- Learning Modules ----

export const mockLearningModules = [
  {
    id: 'l1',
    title: 'Introduction to Indian Stock Markets',
    description:
      'Learn the fundamentals of NSE, BSE, market indices, and how stock trading works in India.',
    lessons: 8,
    completedLessons: 8,
    duration: '2h 30m',
    difficulty: 'beginner' as const,
    category: 'Fundamentals',
    progress: 100,
  },
  {
    id: 'l2',
    title: 'Understanding Technical Indicators',
    description:
      'Master RSI, MACD, Moving Averages, Bollinger Bands, and other key technical analysis tools.',
    lessons: 12,
    completedLessons: 12,
    duration: '4h 15m',
    difficulty: 'intermediate' as const,
    category: 'Technical Analysis',
    progress: 100,
  },
  {
    id: 'l3',
    title: 'Fundamental Analysis Deep Dive',
    description:
      'Analyze balance sheets, income statements, and cash flow statements to evaluate company health.',
    lessons: 10,
    completedLessons: 6,
    duration: '5h 00m',
    difficulty: 'intermediate' as const,
    category: 'Fundamental Analysis',
    progress: 60,
  },
  {
    id: 'l4',
    title: 'Options Trading Strategies',
    description:
      'Learn call, put, straddles, strangles, iron condors, and risk management for F&O trading.',
    lessons: 15,
    completedLessons: 3,
    duration: '6h 45m',
    difficulty: 'advanced' as const,
    category: 'Derivatives',
    progress: 20,
  },
  {
    id: 'l5',
    title: 'Building a Diversified Portfolio',
    description:
      'Asset allocation, sector rotation, risk-adjusted returns, and portfolio rebalancing strategies.',
    lessons: 8,
    completedLessons: 0,
    duration: '3h 20m',
    difficulty: 'intermediate' as const,
    category: 'Portfolio Management',
    progress: 0,
  },
  {
    id: 'l6',
    title: 'Reading Financial Statements Like a Pro',
    description:
      'Advanced techniques to decode annual reports, management commentary, and hidden red flags.',
    lessons: 10,
    completedLessons: 0,
    duration: '4h 50m',
    difficulty: 'advanced' as const,
    category: 'Fundamental Analysis',
    progress: 0,
  },
]

// ---- AI Insights (Dashboard Cards) ----

export const mockAIInsights = [
  {
    id: 'ai1',
    type: 'portfolio' as const,
    title: 'Concentration Risk Detected',
    message:
      'Financial Services makes up 42% of your portfolio. Consider rebalancing 5-10% into Healthcare or Consumer sectors to improve risk-adjusted returns.',
    action: 'View Rebalance Plan',
  },
  {
    id: 'ai2',
    type: 'opportunity' as const,
    title: 'ICICI Bank Breakout Signal',
    message:
      'ICICI Bank has broken above its 50-DMA with strong volume. With Q3 results beating estimates by 8%, the trend suggests further upside to ₹1,200.',
    action: 'View Analysis',
  },
  {
    id: 'ai3',
    type: 'behavior' as const,
    title: 'Investing Pattern Insight',
    message:
      'You tend to buy during market dips — great discipline! However, 3 of your last 5 purchases were in the same sector. Diversification can improve Sharpe ratio by 0.3-0.5 points.',
  },
  {
    id: 'ai4',
    type: 'risk' as const,
    title: 'Infosys Overbought Warning',
    message:
      'Infosys RSI has reached 72, entering overbought territory. If you\'re planning to add, consider waiting for a pullback to ₹1,580-1,600 support zone.',
    action: 'Set Price Alert',
  },
  {
    id: 'ai5',
    type: 'learning' as const,
    title: 'Skill Up: Options Trading',
    message:
      'Based on your trading pattern, learning basic options strategies could help you hedge your portfolio more effectively. Start with the "Options Trading Strategies" module.',
    action: 'Start Learning',
  },
]