import fs from 'fs';

const usedUrls = new Set();

const TRUSTED_DOMAINS = [
  'bbassets.com',
  'media-amazon.com',
  'cdn.zeptonow.com',
  'instamart-media-assets.swiggy.com',
  'jiomart.com',
  'rukminim',
  'flipkart.com',
  'grofers.com',
  'blinkit.com',
  'dmart.in',
  'itcstore.in',
  'patanjaliayurved.net',
  'dabur.com',
  'amul.com',
  'openfoodfacts.org'
];

async function searchBingImages(query) {
  try {
    const searchUrl = 'https://www.bing.com/images/search?q=' + encodeURIComponent(query + ' product pack shot india') + '&form=HDRSC2';
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!res.ok) return [];
    const text = await res.text();
    const matches = [...text.matchAll(/murl&quot;:&quot;(https?:[^&]+)&quot;/g)];
    const urls = matches.map(m => m[1]);
    return urls;
  } catch (e) {
    return [];
  }
}

function selectBestImages(candidates, existingUsed) {
  const isExcluded = (u) => {
    const l = u.toLowerCase();
    return (
      l.includes('logo') ||
      l.includes('icon') ||
      l.includes('banner') ||
      l.includes('vector') ||
      l.includes('recipe') ||
      l.includes('avatar') ||
      l.includes('unsplash.com') ||
      l.includes('placeholder') ||
      l.endsWith('.svg') ||
      l.endsWith('.gif')
    );
  };

  const valid = candidates.filter(u => !isExcluded(u) && !existingUsed.has(u));

  // Sort: prioritize trusted domains
  const sorted = valid.sort((a, b) => {
    const aTrusted = TRUSTED_DOMAINS.some(d => a.includes(d));
    const bTrusted = TRUSTED_DOMAINS.some(d => b.includes(d));
    if (aTrusted && !bTrusted) return -1;
    if (!aTrusted && bTrusted) return 1;
    return 0;
  });

  return sorted;
}

async function testSample() {
  const products = JSON.parse(fs.readFileSync('data/products469.json', 'utf8')).slice(0, 10);
  for (const p of products) {
    const candidates = await searchBingImages(p.name);
    const best = selectBestImages(candidates, usedUrls);
    if (best.length > 0) {
      usedUrls.add(best[0]);
      console.log(`[${p.category}] ${p.name}`);
      console.log(`  -> Selected: ${best[0]}`);
      if (best[1]) console.log(`  -> Gallery 2: ${best[1]}`);
    } else {
      console.log(`[FAILED] ${p.name}`);
    }
    // Small delay to be respectful to rate limits
    await new Promise(r => setTimeout(r, 200));
  }
}

testSample();

