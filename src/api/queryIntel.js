// Frontend mini classifier — mirrors the backend rule-based engine so mock data
// is intelligent when the API is unavailable. Returns { category, brands, sellers, priceRange }.

const SITE_CATALOG = [
  // name, slug, baseUrl, categories[], generalist
  ['Daraz',           'daraz',     'https://www.daraz.com.bd',        '*',                                                      true],
  ['Pickaboo',        'pickaboo',  'https://www.pickaboo.com',        'smartphone,laptop,tablet,headphone,camera,smartwatch,tv,appliance,ac,refrigerator,gaming,beauty,fashion', true],
  ['BD-Shop',         'bdshop',    'https://www.bdshop.com',          'smartphone,laptop,tablet,headphone,camera,smartwatch,tv,appliance,ac,refrigerator,gaming,beauty,sports',  true],
  ['Othoba',          'othoba',    'https://www.othoba.com',          'smartphone,laptop,headphone,smartwatch,tv,appliance,ac,refrigerator,kitchen,fashion,beauty,grocery,baby,furniture', true],
  ['Priyoshop',       'priyoshop', 'https://www.priyoshop.com',       'fashion,beauty,smartphone,headphone,smartwatch,kitchen,appliance,baby,sports', true],
  ['Startech',        'startech',  'https://www.startech.com.bd',     'laptop,desktop,smartphone,tablet,headphone,camera,gaming,smartwatch,tv,appliance', false],
  ['Ryans Computers', 'ryans',     'https://www.ryanscomputers.com',  'laptop,desktop,smartphone,tablet,headphone,camera,gaming,smartwatch,tv,appliance', false],
  ['Walton',          'walton',    'https://waltonbd.com',            'ac,refrigerator,tv,appliance,smartphone,laptop', false],
  ['Chaldal',         'chaldal',   'https://chaldal.com',             'grocery,kitchen,baby,beauty,appliance', false],
  ['Rokomari',        'rokomari',  'https://www.rokomari.com',        'book', false],
];

const CAT_KEYWORDS = {
  smartphone:  ['phone','mobile','smartphone','iphone','galaxy','redmi','oppo','vivo','realme','pixel','pro max','ultra','plus','note','mi 11','mi 13','poco'],
  laptop:      ['laptop','notebook','macbook','thinkpad','pavilion','ideapad','vivobook','zenbook','rog','tuf','predator','nitro','inspiron','probook','elitebook'],
  tablet:      ['tab','tablet','ipad','galaxy tab','mi pad','matepad'],
  desktop:     ['desktop','pc','cpu','prebuilt','gaming pc','monitor','motherboard','graphics card','gpu','ssd','nvme','psu'],
  headphone:   ['headphone','headset','earphone','earbud','airpods','buds','wh-1000','tws','jbl','bose','sennheiser'],
  camera:      ['camera','dslr','mirrorless','gopro','insta360','lens','tripod','drone','action camera'],
  smartwatch:  ['watch','smartwatch','mi band','amazfit','galaxy watch','apple watch','fitness band'],
  gaming:      ['ps5','ps4','xbox','nintendo','controller','keyboard','mouse','gaming chair','playstation'],
  tv:          ['tv','television','smart tv','led tv','oled','qled','4k tv'],
  ac:          ['ac','air conditioner','split ac','window ac','inverter ac','aircon'],
  refrigerator:['fridge','refrigerator','freezer','deep freezer','mini fridge'],
  appliance:   ['microwave','oven','blender','grinder','mixer','washing machine','iron','rice cooker','pressure cooker','air fryer','kettle','toaster','heater','vacuum','fan','ceiling fan'],
  kitchen:     ['pan','pot','cookware','knife','cutlery','utensil','dinner set','plate','bowl','mug'],
  fashion:     ['saree','panjabi','kurta','shirt','t-shirt','jeans','pant','shoe','sneaker','sandal','bag','handbag','sunglass','cap','jacket','jamdani','salwar','kameez'],
  beauty:      ['cream','lotion','serum','lipstick','foundation','face wash','shampoo','conditioner','perfume','fragrance','cosmetic','makeup','skincare','cetaphil','nivea'],
  book:        ['book','novel','poetry','story','ebook','samagra','atomic habits','humayun ahmed','misir ali','himu','textbook','rabindranath'],
  grocery:     ['rice','oil','sugar','flour','atta','masala','dal','lentil','chinigura','tea','coffee','milk','biscuit','chocolate','sauce','ketchup','noodles','egg','fish','meat','chicken','vegetable','fruit','spice','salt','pran','radhuni','nescafe'],
  baby:        ['diaper','baby food','formula','stroller','baby walker','feeder','toy'],
  sports:      ['cricket','bat','football','basketball','jersey','yoga mat','dumbbell','treadmill','gym','running shoe','cycle','bicycle'],
  automotive:  ['car','bike','motorcycle','helmet','tire','tyre','battery','engine oil','dashcam'],
  furniture:   ['sofa','bed','mattress','table','chair','wardrobe','cabinet','shelf','desk','drawer'],
};

const BRAND_TO_CATS = {
  walton:    ['ac','refrigerator','tv','appliance','smartphone'],
  samsung:   ['smartphone','tv','tablet','smartwatch','refrigerator','ac','appliance'],
  lg:        ['tv','refrigerator','ac','appliance'],
  apple:     ['smartphone','laptop','tablet','headphone','smartwatch'],
  xiaomi:    ['smartphone','smartwatch','headphone','appliance'],
  asus:      ['laptop','desktop','gaming'],
  lenovo:    ['laptop','desktop','tablet'],
  hp:        ['laptop','desktop'],
  dell:      ['laptop','desktop'],
  sony:      ['headphone','tv','camera','gaming'],
  bose:      ['headphone'],
  jbl:       ['headphone'],
  daikin:    ['ac'],
  gree:      ['ac'],
  midea:     ['ac','appliance'],
  panasonic: ['ac','appliance','tv'],
  haier:     ['ac','refrigerator','appliance'],
  singer:    ['appliance','tv','refrigerator'],
  vision:    ['appliance','tv'],
  philips:   ['appliance','beauty'],
  aarong:    ['fashion','beauty'],
  nike:      ['fashion','sports'],
  adidas:    ['fashion','sports'],
  pran:      ['grocery'],
  radhuni:   ['grocery'],
  nescafe:   ['grocery'],
};

const PRICE_RANGE = {
  smartphone:[5000,500000], laptop:[20000,1500000], tablet:[5000,300000], desktop:[15000,800000],
  headphone:[300,100000], camera:[5000,800000], smartwatch:[500,300000], gaming:[500,500000],
  tv:[10000,800000], ac:[20000,400000], refrigerator:[10000,400000], appliance:[1000,500000],
  kitchen:[100,100000], fashion:[100,200000], beauty:[50,50000], book:[30,20000],
  grocery:[10,20000], baby:[50,50000], sports:[100,200000], automotive:[50,5000000],
  furniture:[500,500000], general:[10,1000000],
};

export function classifyQuery(raw) {
  const q = (raw || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return { query: '', category: 'general', categories: ['general'], brands: [], confidence: 0, priceRange: PRICE_RANGE.general };

  const tokens = q.split(/\s+/);
  const scores = {};
  Object.entries(CAT_KEYWORDS).forEach(([cat, kws]) => {
    let s = 0;
    kws.forEach((kw) => {
      if (kw.includes(' ')) { if (q.includes(kw)) s += 3; }
      else { tokens.forEach((t) => { if (t === kw) s += 2; }); }
    });
    if (s > 0) scores[cat] = s;
  });

  const brands = Object.keys(BRAND_TO_CATS).filter((b) => q.includes(b));
  brands.forEach((b) => BRAND_TO_CATS[b].forEach((c) => { scores[c] = (scores[c] || 0) + 1; }));

  const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  if (ranked.length === 0) {
    return { query: raw, category: 'general', categories: ['general'], brands, confidence: 0, priceRange: PRICE_RANGE.general };
  }
  const top = scores[ranked[0]];
  const cats = ranked.filter((c) => scores[c] * 2 >= top);
  const confidence = Math.min(1, top / 5);
  return { query: raw, category: ranked[0], categories: cats, brands, confidence, priceRange: PRICE_RANGE[ranked[0]] || PRICE_RANGE.general };
}

/** Return sites likely to carry this query, in priority order. */
export function routeSites(intent) {
  if (!intent || intent.confidence === 0) {
    return SITE_CATALOG.filter(([,,,,gen]) => gen).map((s) => ({ name: s[0], slug: s[1], baseUrl: s[2] }));
  }
  const target = new Set(intent.categories);
  return SITE_CATALOG
    .filter(([,,, cats, gen]) => {
      if (cats === '*') return true;
      const supported = cats.split(',');
      const overlap = supported.some((c) => target.has(c));
      if (gen) return supported.includes(intent.category);
      return overlap;
    })
    .map((s) => ({ name: s[0], slug: s[1], baseUrl: s[2] }));
}

/** Build a smart mock seller list when the API isn't available. */
export function smartMockSellers(rawQuery) {
  const intent = classifyQuery(rawQuery);
  const sites = routeSites(intent);
  const [lo, hi] = intent.priceRange;
  const center = Math.round(lo + (hi - lo) * 0.25);
  const spread = Math.max(50, Math.round(center * 0.15));

  return sites.map((site, i) => {
    const offset = Math.round((Math.random() - 0.5) * spread * 2);
    const price = Math.max(lo, center + offset + i * Math.round(center * 0.02));
    const original = Math.random() > 0.5 ? Math.round(price * (1.05 + Math.random() * 0.25)) : null;
    const baseHost = site.baseUrl;
    const path = '/search?q=' + encodeURIComponent(rawQuery);
    return {
      siteName: site.name,
      siteSlug: site.slug,
      price,
      originalPrice: original,
      inStock: Math.random() > 0.1,
      rating: 3.8 + Math.random() * 1.1,
      productUrl: baseHost + path,
    };
  });
}
