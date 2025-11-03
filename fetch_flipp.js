import fs from "node:fs";
import fetch from "node-fetch";

const ZIP = "85383";
const URL = `https://flipp.com/en-us/weekly_ads?postal_code=${ZIP}`;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html",
};

async function safeFetch(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function getWeeklyDeals() {
  console.log("🚀 Fetching Flipp weekly ads page...");
  const html = await safeFetch(URL);

  // Flipp now uses a JSON blob in window.__FLIPP_DATA__ or similar
  const match =
    html.match(/window\.__FLIPP_DATA__\s*=\s*(\{.*?\});/) ||
    html.match(/<script[^>]*>.*?(?:__NEXT_DATA__|__APOLLO_STATE__)\s*=\s*(\{.*?\})<\/script>/s);

  if (!match) {
    console.error("❌ Still can't locate embedded JSON. Flipp may have changed again.");
    fs.writeFileSync("weekly_deals.json", "[]");
    return;
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (err) {
    console.error("❌ JSON parse failed:", err);
    fs.writeFileSync("weekly_deals.json", "[]");
    return;
  }

  // Try common nesting paths
  const flyers =
    data?.props?.pageProps?.flyers ||
    data?.pageProps?.flyers ||
    data?.data?.flyers ||
    [];
  console.log(`📦 Found ${flyers.length} flyers near ${ZIP}`);

  const deals = [];
  for (const flyer of flyers) {
    const store = flyer?.merchant?.name || flyer?.merchant_name;
    const items = flyer?.items || flyer?.featured_items || [];
    for (const item of items) {
      deals.push({
        store,
        name: item.name || item.title || "Unnamed",
        price: item.current_price || item.price_text || "—",
      });
    }
  }

  fs.writeFileSync("weekly_deals.json", JSON.stringify(deals, null, 2));
  console.log(`✅ Saved ${deals.length} deals`);
}

getWeeklyDeals().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
