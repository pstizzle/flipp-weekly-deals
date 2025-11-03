// === Flipp Weekly Ad Fetcher (HTML embed version) ===
import fs from "node:fs";

const ZIP = "85383";
const STORES = [
  "Fry's Food Stores",
  "Walmart",
  "Safeway",
  "Sprouts Farmers Market",
  "Costco Wholesale",
  "Target"
];

const URL = `https://flipp.com/en-us/weekly_ads?postal_code=${ZIP}`;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html",
};

async function safeFetch(url) {
  const res = await fetch(url, { headers: HEADERS });
  const txt = await res.text();
  return txt;
}

async function getWeeklyDeals() {
  console.log("🚀 Fetching Flipp weekly ads page...");
  const html = await safeFetch(URL);

  // Extract JSON embedded in <script id="__NEXT_DATA__" type="application/json">
  const match = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">(.*?)<\/script>/s
  );
  if (!match) {
    console.error("❌ Unable to locate embedded JSON in the HTML");
    fs.writeFileSync("weekly_deals.json", "[]");
    return;
  }

  const data = JSON.parse(match[1]);
  const flyers = data?.props?.pageProps?.flyers || [];
  console.log(`📦 Found ${flyers.length} flyers near ${ZIP}`);

  const allDeals = [];

  for (const flyer of flyers) {
    const storeName = flyer.merchant?.name;
    if (!STORES.includes(storeName)) continue;

    console.log(`🔍 Processing store: ${storeName} (id: ${flyer.id})`);
    const items = flyer.items || flyer.featured_items || [];
    console.log(`→ Found ${items.length} items`);

    for (const item of items) {
      allDeals.push({
        store: storeName,
        item: item.name || item.title || "Unnamed Item",
        price: item.current_price || item.price_text || null,
        category: item.category || "Uncategorized",
        valid_to: flyer.valid_to || null
      });
    }
  }

  fs.writeFileSync("weekly_deals.json", JSON.stringify(allDeals, null, 2));
  console.log(`✅ Saved ${allDeals.length} deals`);
}

getWeeklyDeals().catch(err => {
  console.error("❌ Error during fetch:", err);
  process.exit(1);
});
