// Netlify Function: /api/quote?symbols=AAPL,MSFT,NVDA
const FINNHUB = 'https://finnhub.io/api/v1';

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Missing FINNHUB_API_KEY. Add it in Netlify → Site settings → Environment variables.',
      }),
    };
  }

  const symbolsParam =
    (event.queryStringParameters && event.queryStringParameters.symbols) || '';
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  if (!symbols.length) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Pass ?symbols=AAPL,MSFT' }),
    };
  }

  try {
    const quotes = {};
    for (const symbol of symbols) {
      const url = `${FINNHUB}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && typeof data.c === 'number' && data.c > 0) {
        quotes[symbol] = data;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        quotes,
        source: 'finnhub',
        count: Object.keys(quotes).length,
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: String(err.message || err) }),
    };
  }
};
