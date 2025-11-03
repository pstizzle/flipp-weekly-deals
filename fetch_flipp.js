// === Flipp Weekly Ad Fetcher (CommonJS version) ===
// Works on GitHub Actions out of the box

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

const ZIP = "85383";
const STORES = [
  "Fry's Food Stores",
  "Walmart",
  "Safeway",
  "Sprouts Farmers Market",
  "Costco Wholesale",
  "Target"
];

const BASE = "https://backflipp.wishabi.com/flipp";

(async () => {
  try {
    console.log("Fetching flyers...");
    const flyersRes = await fetch(`${BASE}/services/flyers?postal_code=${ZIP}`);
    const flyers = await flyersRes.json();

    const selectedFlyers = flyers.filter(f => STORES.includes(f.merchant?.name));
    const allDeals = [];

    for (const flyer of selectedFlyers) {
      console.log(`Fetching deals for ${flyer.merchant.name}...`);
      const itemsRes = await fetch(`${BASE}/flyers/${flyer.id}/items`);
      const items = await itemsRes.json();

      for (const i of items) {
        allDeals.push({
          store: flyer.merchant.name,
          item: i.name,
          price: i.current_price,
          category: i.category,
          valid_to: flyer.valid_to
        });
      }
    }

    fs.writeFileSync("weekly_deals.json", JSON.stringify(allDeals, null, 2));
    console.log(`✅ Saved ${allDeals.length} deals to weekly_deals.json`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
