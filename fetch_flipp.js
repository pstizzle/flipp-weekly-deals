// === Flipp Weekly Ad Fetcher (HTML parser version) ===
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

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html",
};

async function getWeeklyDeals() {
  console.log("Fetching Flipp weekly ads...");
  const res = await fetch(`https://flipp.com/en-us/weekly_ads?postal_code=${ZIP}`, {
    headers: HEADERS,
  });
  const html = await res.text();

  // Extract JSON embedded in the HTML (look for __NEXT_DATA__)
  const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
  if (!jsonMatch) {
    console.error("❌ Could not find JSON in page");
    fs.writeFileSync("weekly_deals.json", "[]");
    return;
  }

  const embeddedData = JSON.parse(jsonMatch[1]);
  const flyers = embeddedData?.props?.pageProps?.flyers || [];
  console.log(`📦 Found ${flyers.length} flyers near ${ZIP}`);

  const allDeals = [];
  for (const flyer of flyers) {
    const name = flyer?.merchant?.name || "Unknown";
    if (!STORES.includes(name)) continue;

    // Extract item summaries if present
    const items = flyer.items || flyer.featured_items || [];
    for (const i of items) {
      allDeals.push({
        store: name,
        item: i.name || i.title || "Unnamed",
        price: i.current_price || i.price_text || "",
        valid_to: flyer.valid_to,
      });
    }
  }

  fs.writeFileSync("weekly_deals.json", JSON.stringify(allDeals, null, 2));
  console.log(`✅ Saved ${allDeals.length} deals`);
}

getWeeklyDeals().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
