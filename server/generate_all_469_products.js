import fs from 'fs';
import path from 'path';

// 1. Load batch 1 items (229 items)
const b1Items = JSON.parse(fs.readFileSync('data/products229.json', 'utf8'));

// 2. Load batch 2 raw items (173 items)
const b2Raw = JSON.parse(fs.readFileSync('data/batch2_raw.json', 'utf8'));

// 3. Load batch 3 raw items (67 items)
const b3Raw = JSON.parse(fs.readFileSync('data/batch3_raw.json', 'utf8'));

console.log(`Loaded B1: ${b1Items.length}, B2: ${b2Raw.length}, B3: ${b3Raw.length}`);

// Category curated images
const categoryFallbacks = {
  Chocolates: [
    "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600"
  ],
  Drinks: [
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600"
  ],
  Dairy: [
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600"
  ],
  "Ice Cream": [
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600"
  ],
  Cleaning: [
    "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&q=80&w=600"
  ],
  "Personal Care": [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=600"
  ],
  Spices: [
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=600"
  ],
  Grocery: [
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600"
  ],
  Instant: [
    "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600"
  ],
  Electrical: [
    "https://images.unsplash.com/photo-1550524514-4b533f81e3a9?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600"
  ],
  Bakery: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=600"
  ]
};

// Brand & Keyword matcher for realistic category, pricing & imagery
function categorizeItem(name, batchNum) {
  const n = name.toLowerCase();

  // Personal Care: Hair Oil, Toothpaste, Soaps, Handwash, Hair Colour, Shampoos, Odomos
  if (
    n.includes('toothpaste') || n.includes('dant kanti') || n.includes('colgate') ||
    n.includes('sensodyne') || n.includes('meswak') || n.includes('babool') ||
    n.includes('dabur red') || n.includes('oral-b') || n.includes('toothbrush')
  ) {
    return {
      category: 'Personal Care',
      sub: 'Oral Care',
      price: 95,
      offer: 85,
      img: 'https://www.bbassets.com/media/uploads/p/l/267360_16-colgate-strong-teeth-anticavity-toothpaste-with-amino-shakti.jpg'
    };
  }

  if (
    n.includes('hair oil') || n.includes('dabur amla') || n.includes('jasmine hair oil') ||
    n.includes('shampoo') || n.includes('hair color') || n.includes('hair colour') ||
    n.includes('nupur henna') || n.includes('pantene') || n.includes('head & shoulders') ||
    n.includes('head and shoulders') || n.includes('clinic plus') || n.includes('sunsilk') ||
    n.includes('godrej expert') || n.includes('garnier') || n.includes('kajal') || n.includes('vatika')
  ) {
    return {
      category: 'Personal Care',
      sub: 'Hair Care & Colour',
      price: 130,
      offer: 115,
      img: 'https://www.bbassets.com/media/uploads/p/l/267350_14-dabur-amla-hair-oil.jpg'
    };
  }

  if (
    n.includes('soap') || n.includes('beauty bar') || n.includes('medimix') ||
    n.includes('wild stone') || n.includes('pears') || n.includes('liril') ||
    n.includes('lux') || n.includes('dove') || n.includes('santoor') ||
    n.includes('lifebuoy') || n.includes('dettol original') || n.includes('dettol skincare') ||
    n.includes('dettol soap') || n.includes('cinthol') || n.includes('moti soap') ||
    n.includes('johnsons baby') || n.includes('limda') || n.includes('hand wash') ||
    n.includes('dettol antiseptic') || n.includes('odomos')
  ) {
    return {
      category: 'Personal Care',
      sub: 'Baths & Soaps',
      price: 55,
      offer: 48,
      img: 'https://www.bbassets.com/media/uploads/p/l/267000_15-dettol-liquid-handwash-refill-original.jpg'
    };
  }

  // Drinks: Teas, Coffees, Health Drinks, Carbonated Drinks, Juices
  if (
    n.includes('tea') || n.includes('coffee') || n.includes('horlicks') || n.includes('boost') ||
    n.includes('bournvita') || n.includes('complan') || n.includes('tang') || n.includes('sting') ||
    n.includes('runner') || n.includes('power up') || n.includes('coca cola') || n.includes('sprite') ||
    n.includes('thums up') || n.includes('maaza') || n.includes('frooti') || n.includes('minute maid') ||
    n.includes('amul kool') || n.includes('amul masti buttermilk') || n.includes('buttermilk') ||
    n.includes('wagh bakri') || n.includes('taj mahal') || n.includes('lipton') ||
    n.includes('red label') || n.includes('nescafe') || n.includes('drink') || n.includes('kinley')
  ) {
    let p = 60, o = 52;
    if (n.includes('tea') || n.includes('coffee') || n.includes('horlicks') || n.includes('bournvita')) {
      p = 195; o = 175;
    }
    return {
      category: 'Drinks',
      sub: 'Beverages & Health Drinks',
      price: p,
      offer: o,
      img: 'https://www.bbassets.com/media/uploads/p/l/251023_13-coca-cola-soft-drink.jpg'
    };
  }

  // Biscuits, Cookies, Rusks, Breads -> Bakery & Snacks
  if (
    n.includes('biscuit') || n.includes('cookie') || n.includes('rusk') ||
    n.includes('bread') || n.includes('khari') || n.includes('buns') ||
    n.includes('toast') || n.includes('crackers') || n.includes('oreo') ||
    n.includes('parle') || n.includes('bourbon') || n.includes('good day') ||
    n.includes('dark fantasy') || n.includes('chocobakes') || n.includes('50-50') ||
    n.includes('malkist')
  ) {
    return {
      category: 'Bakery',
      sub: 'Breads, Biscuits & Rusks',
      price: 45,
      offer: 40,
      img: 'https://www.bbassets.com/media/uploads/p/l/100012502_20-nestle-kitkat-chocolate-bar.jpg'
    };
  }

  // Instant Food, Noodles, Pastas, Sauces, Ketchup, Ready mixes
  if (
    n.includes('maggi') || n.includes('yippee') || n.includes('noodles') ||
    n.includes('pasta') || n.includes('sauce') || n.includes('ketchup') ||
    n.includes('mayonnaise') || n.includes('instant mix') || n.includes('mtr') ||
    n.includes('suhana') || n.includes('chings') || n.includes('kelloggs') ||
    n.includes('ramen') || n.includes('spread') || n.includes('veeba') ||
    n.includes('knorr') || n.includes('soan papdi') || n.includes('gulab jamun') ||
    n.includes('ready-to-eat') || n.includes('snack cup') || n.includes('cake')
  ) {
    return {
      category: 'Instant',
      sub: 'Instant Foods & Sauces',
      price: 70,
      offer: 62,
      img: 'https://www.bbassets.com/media/uploads/p/l/266970_19-vim-dishwash-gel-lemon.jpg'
    };
  }

  // Cleaning, Laundry & Pest control
  if (
    n.includes('detergent') || n.includes('ariel') || n.includes('surf excel') ||
    n.includes('rin') || n.includes('tide') || n.includes('wheel') ||
    n.includes('genteel') || n.includes('comfort') || n.includes('hit') ||
    n.includes('good knight') || n.includes('all out') || n.includes('scrub') ||
    n.includes('mop') || n.includes('broom') || n.includes('dustpan') ||
    n.includes('cleaner') || n.includes('liquid vaporiser') || n.includes('diaper') ||
    n.includes('pampers')
  ) {
    let p = 140, o = 125;
    if (n.includes('sachet')) { p = 10; o = 9; }
    return {
      category: 'Cleaning',
      sub: 'Laundry & Home Hygiene',
      price: p,
      offer: o,
      img: 'https://www.bbassets.com/media/uploads/p/l/266952_18-lizol-disinfectant-floor-cleaner-citrus.jpg'
    };
  }

  // Spices & Salts
  if (
    n.includes('salt') || n.includes('masala') || n.includes('papad') ||
    n.includes('chorafali') || n.includes('mathiya')
  ) {
    return {
      category: 'Spices',
      sub: 'Salts & Cooking Seasonings',
      price: 28,
      offer: 25,
      img: 'https://www.bbassets.com/media/uploads/p/l/267200_14-everest-masala-chhole.jpg'
    };
  }

  // Electrical & Household Needs: Duracell, Eveready, Clock, Incense, Wicks, Glue
  if (
    n.includes('battery') || n.includes('duracell') || n.includes('eveready') ||
    n.includes('clock') || n.includes('incense') || n.includes('wicks') ||
    n.includes('glue') || n.includes('storage container')
  ) {
    return {
      category: 'Electrical',
      sub: 'Household & Electricals',
      price: 90,
      offer: 79,
      img: 'https://images.unsplash.com/photo-1550524514-4b533f81e3a9?auto=format&fit=crop&q=80&w=600'
    };
  }

  // Dairy: Ghee, Milkmaid, Condensed milk, Dairy whitener
  if (
    n.includes('ghee') || n.includes('milkmaid') || n.includes('dairy whitener') ||
    n.includes('condensed milk')
  ) {
    return {
      category: 'Dairy',
      sub: 'Dairy & Pure Ghee',
      price: 260,
      offer: 240,
      img: 'https://www.bbassets.com/media/uploads/p/l/100005470_19-amul-butter-pasteurised.jpg'
    };
  }

  // Grocery: Rice bags, oils, flours, namkeen, wafers, sev, mamra, dry fruits
  return {
    category: 'Grocery',
    sub: 'Grains, Snacks & Essentials',
    price: 95,
    offer: 84,
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600'
  };
}

// Convert Batch 2 items (P230 to P402)
const b2Products = b2Raw.map((item, i) => {
  const globalIdx = 229 + i + 1; // 230 ... 402
  const hexId = "65f" + globalIdx.toString(16).padStart(21, '0');
  const catInfo = categorizeItem(item.name, 2);

  const catImgs = categoryFallbacks[catInfo.category] || categoryFallbacks.Grocery;
  const fallbackImg = catImgs[i % catImgs.length];
  const images = catInfo.img ? [catInfo.img, fallbackImg] : [fallbackImg];

  return {
    _id: hexId,
    code: `P${globalIdx}`,
    name: item.name,
    category: catInfo.category,
    subCategory: catInfo.sub,
    price: catInfo.price,
    offerPrice: catInfo.offer,
    image: images,
    description: [
      `100% Original & Authentic ${item.name}`,
      `Batch 2 Catalog Item | Ref: P${globalIdx}`,
      "Handpicked quality grocery with fast express delivery in 30 minutes"
    ],
    inStock: true,
    purchaseCount: Math.floor(Math.random() * 60) + 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

// Convert Batch 3 items (P403 to P469)
const b3Products = b3Raw.map((item, i) => {
  const globalIdx = 229 + b2Raw.length + i + 1; // 403 ... 469
  const hexId = "65f" + globalIdx.toString(16).padStart(21, '0');
  const catInfo = categorizeItem(item.name, 3);

  const catImgs = categoryFallbacks[catInfo.category] || categoryFallbacks.Grocery;
  const fallbackImg = catImgs[i % catImgs.length];
  const images = catInfo.img ? [catInfo.img, fallbackImg] : [fallbackImg];

  return {
    _id: hexId,
    code: `P${globalIdx}`,
    name: item.name,
    category: catInfo.category,
    subCategory: catInfo.sub,
    price: catInfo.price,
    offerPrice: catInfo.offer,
    image: images,
    description: [
      `Authentic Store Product: ${item.name}`,
      `Batch 3 Catalog Item | Ref: P${globalIdx}`,
      "Guaranteed fresh & high quality with speedy doorstep delivery"
    ],
    inStock: true,
    purchaseCount: Math.floor(Math.random() * 50) + 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

// Combine all 3 batches
const all469Products = [...b1Items, ...b2Products, ...b3Products];

console.log(`TOTAL CONSOLIDATED PRODUCTS: ${all469Products.length}`);
fs.writeFileSync('data/products469.json', JSON.stringify(all469Products, null, 2));

// Print category breakdown
const breakdown = {};
all469Products.forEach(p => {
  breakdown[p.category] = (breakdown[p.category] || 0) + 1;
});
console.log('Category distribution across 469 products:', breakdown);
