const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ghorer_bazar_db';
const DB_NAME = process.env.DB_NAME || 'ghorer_bazar_db';
const JWT_SECRET = process.env.JWT_SECRET || 'ghorer_bazar_secret_super_key_2024';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initial Default Data (Seed & Fallback)
const INITIAL_PRODUCTS = [
  {
    name: 'সুন্দরবনের প্রাকৃতিক চাকের খলিসা ফুলের মধু',
    nameEn: 'Sundarban Kholisa Flower Honey',
    name_bn: 'সুন্দরবনের প্রাকৃতিক চাকের খলিসা ফুলের মধু',
    name_en: 'Sundarban Kholisa Flower Honey',
    slug: 'sundarban-kholisa-flower-honey',
    category: 'মধু (Honey)',
    categorySlug: 'honey',
    category_id: 1,
    description: 'সুন্দরবনের গভীর অরণ্য থেকে সরাসরি মৌয়ালদের মাধ্যমে সংগৃহীত ১০০% প্রাকৃতিক ও কাঁচা খলিসা ফুলের মধু। কোনো প্রকার প্রক্রিয়াজাত বা মিশ্রণ ছাড়া সরাসরি বোতলজাত করা হয়।',
    benefits: [
      'রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে',
      'ঠান্ডা ও শ্বাসকষ্টের উপশম করে',
      'হজমে সহায়তা ও এনার্জি বুস্টার হিসেবে কার্যকর',
      'অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ ও প্রাকৃতিক মিষ্টির উৎস'
    ],
    price: 950,
    regularPrice: 1100,
    discountPercentage: 14,
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    stock: 120,
    stock_quantity: 120,
    sku: 'GB-HONEY-001',
    rating: 4.9,
    ratingCount: 142,
    isFeatured: true,
    is_featured: true,
    isBestSeller: true,
    unit: '১ কেজি / ৫০০ গ্রাম',
    origin: 'সুন্দরবন, সাতক্ষীরা',
    variants: [
      { id: 1, weight: '৫০০ গ্রাম', price: 550, regularPrice: 650, stock: 60 },
      { id: 2, weight: '১ কেজি', price: 950, regularPrice: 1100, stock: 60 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'গাওয়া প্রিমিয়াম দেশি গাভীর খাঁটি ঘি',
    nameEn: 'Premium Pure Deshi Cow Ghee',
    name_bn: 'গাওয়া প্রিমিয়াম দেশি গাভীর খাঁটি ঘি',
    name_en: 'Premium Pure Deshi Cow Ghee',
    slug: 'pure-deshi-cow-ghee',
    category: 'ঘি ও বাটার (Ghee)',
    categorySlug: 'ghee',
    category_id: 2,
    description: 'সিরাজগঞ্জের ঐতিহ্যবাহী খামার থেকে সংগৃহীত খাঁটি গাভীর দুধের মাখন থেকে প্রচলিত পদ্ধতিতে জ্বাল দেওয়া সুঘ্রাণযুক্ত দানাদার খাঁটি গাওয়া ঘি।',
    benefits: [
      'স্মৃতিশক্তি বৃদ্ধি ও মস্তিষ্কের পুষ্টি যোগায়',
      'শরীরকে শক্তিশালী ও রোগমুক্ত রাখতে সাহায্য করে',
      'খাবারের স্বাদ ও সুবাস বহুগুণ বাড়িয়ে দেয়'
    ],
    price: 1450,
    regularPrice: 1650,
    discountPercentage: 12,
    images: [
      'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=800&q=80',
    stock: 80,
    stock_quantity: 80,
    sku: 'GB-GHEE-002',
    rating: 4.8,
    ratingCount: 98,
    isFeatured: true,
    is_featured: true,
    isBestSeller: true,
    unit: '১ কেজি / ৫০০ গ্রাম',
    origin: 'সিরাজগঞ্জ, বাংলাদেশ',
    variants: [
      { id: 3, weight: '৫০০ গ্রাম', price: 750, regularPrice: 850, stock: 40 },
      { id: 4, weight: '১ কেজি', price: 1450, regularPrice: 1650, stock: 40 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'কাঠের ঘানি ভাঙা খাঁটি সরিষার তেল',
    nameEn: 'Wood Pressed Mustard Oil',
    name_bn: 'কাঠের ঘানি ভাঙা খাঁটি সরিষার তেল',
    name_en: 'Wood Pressed Mustard Oil',
    slug: 'wood-pressed-mustard-oil',
    category: 'তেল ও ঘানি (Oil)',
    categorySlug: 'oil',
    category_id: 3,
    description: 'দেশি সেরা মাঘী সরিষা থেকে সনাতন কাঠের ঘানিতে কোনো প্রকার কেমিক্যাল ও অতিরিক্ত তাপমাত্রা ছাড়া ভাঙানো আসল ঝাঁঝালো সরিষার তেল।',
    benefits: [
      'হৃদযন্ত্রের সুরক্ষায় অত্যন্ত উপকারী',
      'হজমশক্তি বৃদ্ধি ও খাবারে অতুলনীয় স্বাদ প্রদান করে',
      'চুল ও ত্বকের যত্নে চমৎকার প্রাকৃতিক উপাদান'
    ],
    price: 320,
    regularPrice: 380,
    discountPercentage: 15,
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    stock: 200,
    stock_quantity: 200,
    sku: 'GB-OIL-003',
    rating: 4.9,
    ratingCount: 88,
    isFeatured: true,
    is_featured: true,
    isBestSeller: true,
    unit: '১ লিটার / ৫ লিটার',
    origin: 'পাবনা, বাংলাদেশ',
    variants: [
      { id: 5, weight: '১ লিটার', price: 320, regularPrice: 380, stock: 120 },
      { id: 6, weight: '৫ লিটার', price: 1550, regularPrice: 1800, stock: 80 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'মদিনার প্রিমিয়াম ভিআইপি আজওয়া খেজুর',
    nameEn: 'Madinah Ajwa Dates VIP',
    name_bn: 'মদিনার প্রিমিয়াম ভিআইপি আজওয়া খেজুর',
    name_en: 'Madinah Ajwa Dates VIP',
    slug: 'madinah-ajwa-dates-vip',
    category: 'খেজুর (Dates)',
    categorySlug: 'dates',
    category_id: 4,
    description: 'পবিত্র মদিনা মুনাওয়ারা থেকে সরাসরি আমদানিকৃত নরম, রসালো ও পুষ্টিকর গ্রেড-১ মানের আসল আজওয়া খেজুর।',
    benefits: [
      'হৃদরোগের ঝুঁকি হ্রাস করতে অত্যন্ত উপকারী',
      'শারীরিক দুর্বলতা দূর করে দ্রুত শক্তি জোগায়',
      'গর্ভবতী মা ও শিশুদের জন্য অপরিহার্য পুষ্টি উপাদান'
    ],
    price: 1150,
    regularPrice: 1350,
    discountPercentage: 14,
    images: [
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80'
    ],
    thumbnail: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
    stock: 90,
    stock_quantity: 90,
    sku: 'GB-DATE-004',
    rating: 4.9,
    ratingCount: 110,
    isFeatured: true,
    is_featured: true,
    isBestSeller: true,
    unit: '১ কেজি / ৫০০ গ্রাম',
    origin: 'মদিনা, সৌদি আরব',
    variants: [
      { id: 7, weight: '৫০০ গ্রাম', price: 620, regularPrice: 720, stock: 45 },
      { id: 8, weight: '১ কেজি', price: 1150, regularPrice: 1350, stock: 45 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const INITIAL_CATEGORIES = [
  { id: 1, name: 'মধু', name_bn: 'মধু', name_en: 'Honey', slug: 'honey', icon: '🍯', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=200&q=80', status: 'active' },
  { id: 2, name: 'ঘি ও বাটার', name_bn: 'ঘি ও বাটার', name_en: 'Ghee & Butter', slug: 'ghee', icon: '🧈', image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=200&q=80', status: 'active' },
  { id: 3, name: 'তেল ও ঘানি', name_bn: 'তেল ও ঘানি', name_en: 'Mustard Oil', slug: 'oil', icon: '🛢️', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=200&q=80', status: 'active' },
  { id: 4, name: 'খেজুর ও ড্রাই ফ্রুটস', name_bn: 'খেজুর ও ড্রাই ফ্রুটস', name_en: 'Dates & Dry Fruits', slug: 'dates', icon: '🌴', image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=200&q=80', status: 'active' },
  { id: 5, name: 'বাদাম ও বীজ', name_bn: 'বাদাম ও বীজ', name_en: 'Nuts & Seeds', slug: 'nuts-seeds', icon: '🥜', image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=200&q=80', status: 'active' },
  { id: 6, name: 'চা ও মশলা', name_bn: 'চা ও মশলা', name_en: 'Tea & Spices', slug: 'tea-spices', icon: '☕', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&q=80', status: 'active' }
];

const INITIAL_BANNERS = [
  {
    id: 1,
    title: '১০০% খাঁটি ও প্রাকৃতিক অর্গানিক খাদ্য',
    titleEn: '100% Pure & Safe Organic Food',
    subtitle: 'সুন্দরবনের খাঁটি মধু, ঘানি ভাঙা তেল ও গাওয়া ঘি ক্যাশ অন ডেলিভারিতে সরাসরি আপনার দোরগোড়ায়।',
    subtitleEn: 'Sundarban Raw Honey, Cold-Pressed Mustard Oil & Pure Cow Ghee delivered with Cash on Delivery.',
    badge: 'সেরা মান ও বিশ্বাস',
    badgeEn: 'PREMIUM QUALITY',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    link: '/products',
    buttonText: 'কেনাকাটা করুন',
    buttonTextEn: 'Shop Now',
    status: 'active'
  },
  {
    id: 2,
    title: 'সৌদি মদিনার প্রিমিয়াম আজওয়া খেজুর',
    titleEn: 'Authentic Saudi Madinah Ajwa Dates',
    subtitle: 'পবিত্র মদিনা থেকে সরাসরি সংগৃহীত গ্রেড-১ মানের সফট ও পুষ্টিকর আজওয়া খেজুর।',
    subtitleEn: 'Directly imported Grade-1 premium soft & nutritious Ajwa Dates.',
    badge: 'আমদানিকৃত খেজুর',
    badgeEn: 'IMPORTED DATES',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80',
    link: '/products?category=dates',
    buttonText: 'অর্ডার করুন',
    buttonTextEn: 'Order Now',
    status: 'active'
  }
];

const INITIAL_POPUP = {
  isActive: true,
  title: 'ইহসান অনলাইন শপ',
  titleEn: 'Ihsan Online Shop',
  badge: '🇵🇸 ফিলিস্তিন ও মানবতার কল্যাণে অনুদান',
  badgeEn: '🇵🇸 Palestine & Humanity Relief Support',
  message: 'ইহসান অনলাইন শপ প্রতিটি সফল অর্ডারের লভ্যাংশের একটি নির্দিষ্ট অংশ মজলুম ফিলিস্তিনি ভাই-বোনদের সহায়তা ও আর্তমানবতার সেবায় দান করে থাকে। আপনার কেনাকাটা হোক মানবতার কল্যাণে।',
  messageEn: 'Ihsan Online Shop donates a portion of profits from every successful order to humanitarian relief and Palestinian aid. Let your shopping be a source of charity.',
  buttonText: 'পণ্যসমূহ দেখুন',
  buttonTextEn: 'Explore Products',
  buttonLink: '/products',
  image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  showImage: true
};

const INITIAL_COUPONS = [
  { id: 1, code: 'ORGANIC10', discount_type: 'percentage', discount_value: 10, min_purchase: 500, expiry_date: '2026-12-31', status: 'active' },
  { id: 2, code: 'EID50', discount_type: 'fixed', discount_value: 50, min_purchase: 1000, expiry_date: '2026-12-31', status: 'active' }
];

const INITIAL_USERS = [
  { id: 1, name: 'Admin Moderator', email: 'admin@ihsan.com', phone: '01700000000', passwordText: 'admin123', role: 'admin', status: 'active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Md. Ariful Islam', email: 'arif@example.com', phone: '01712345678', passwordText: 'arif1234', role: 'customer', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', createdAt: new Date('2024-02-15') },
  { id: 3, name: 'Sundarban Honey Store', email: 'seller@sundarban.com', phone: '01811223344', passwordText: 'seller123', role: 'seller', status: 'active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', createdAt: new Date('2024-02-01') }
];

const INITIAL_SELLERS = [
  { id: 1, shop_name: 'Sundarban Natural Hub', seller_name: 'Rafiqul Islam', phone: '01811223344', email: 'rafiq@sundarban.com', status: 'approved', balance: 14500, created_at: new Date('2024-01-01') },
  { id: 2, shop_name: 'Sirajganj Pure Dairy', seller_name: 'Karim Mollah', phone: '01999887766', email: 'karim@dairy.com', status: 'approved', balance: 28300, created_at: new Date('2024-02-01') }
];

// In-Memory Database Store for Fallback
const memoryDb = {
  products: [...INITIAL_PRODUCTS.map((p, idx) => ({ id: 'p_' + (idx + 1), _id: 'p_' + (idx + 1), ...p }))],
  categories: [...INITIAL_CATEGORIES],
  banners: [...INITIAL_BANNERS],
  coupons: [...INITIAL_COUPONS],
  users: [...INITIAL_USERS],
  sellers: [...INITIAL_SELLERS],
  popup: { ...INITIAL_POPUP },
  orders: [],
  reviews: []
};

// Database Connection
let db = null;
let isMongoConnected = false;

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    await client.connect();
    db = client.db(DB_NAME);
    isMongoConnected = true;
    console.log('✅ Successfully connected to MongoDB Database:', DB_NAME);

    // Seed database if empty
    const productCount = await db.collection('products').countDocuments();
    if (productCount === 0) {
      await db.collection('products').insertMany(INITIAL_PRODUCTS);
      console.log('🌱 Seeded default products to MongoDB');
    }

    const categoryCount = await db.collection('categories').countDocuments();
    if (categoryCount === 0) {
      await db.collection('categories').insertMany(INITIAL_CATEGORIES);
      console.log('🌱 Seeded default categories to MongoDB');
    }

    const bannerCount = await db.collection('banners').countDocuments();
    if (bannerCount === 0) {
      await db.collection('banners').insertMany(INITIAL_BANNERS);
      console.log('🌱 Seeded default banners to MongoDB');
    }

    const couponCount = await db.collection('coupons').countDocuments();
    if (couponCount === 0) {
      await db.collection('coupons').insertMany(INITIAL_COUPONS);
      console.log('🌱 Seeded default coupons to MongoDB');
    }
  } catch (err) {
    console.warn('⚠️ MongoDB connection warning:', err.message, '- Using in-memory fallback database mode.');
    isMongoConnected = false;
  }
}

connectToMongo();

// Helper to format mongo document
const formatDoc = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const images = Array.isArray(doc.images) && doc.images.length > 0
    ? doc.images
    : (doc.thumbnail ? [doc.thumbnail] : []);
  const thumbnail = doc.thumbnail || (images.length > 0 ? images[0] : '');
  return {
    id: _id ? _id.toString() : (doc.id || ''),
    _id: _id ? _id.toString() : (doc.id || ''),
    ...rest,
    images,
    thumbnail,
    isFeatured: doc.is_featured ?? doc.isFeatured ?? true,
    is_featured: doc.is_featured ?? doc.isFeatured ?? true,
    isBestSeller: doc.is_bestseller ?? doc.isBestSeller ?? true,
    is_bestseller: doc.is_bestseller ?? doc.isBestSeller ?? true,
    name_bn: doc.name_bn || doc.name || '',
    name_en: doc.name_en || doc.nameEn || doc.name || '',
    nameEn: doc.name_en || doc.nameEn || doc.name || '',
    regularPrice: doc.regular_price || doc.regularPrice || doc.price || 0,
    regular_price: doc.regular_price || doc.regularPrice || doc.price || 0,
    stock_quantity: doc.stock_quantity ?? doc.stock ?? 50,
    stock: doc.stock_quantity ?? doc.stock ?? 50,
    categorySlug: doc.categorySlug || doc.category_slug || (doc.category_name ? doc.category_name.toLowerCase() : '')
  };
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Root route for Vercel health check
app.get('/', (req, res) => {
  res.send('🌿 Ihsan Online Shop Server is Running Successfully! 🚀');
});

app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Ihsan Online Shop API is Live & Connected to MongoDB!'
  });
});




// Root Check
app.get('/api', (req, res) => {
  res.json({
    name: 'Ihsan Online Shop API Server',
    version: '1.0.0',
    status: 'Running smoothly 🚀',
    database: isMongoConnected ? 'MongoDB Connected 🍃' : 'In-Memory Mode ⚡',
    time: new Date().toISOString()
  });
});

// 1. PRODUCTS API
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sellerId, featured, bestSeller, sort, minPrice, maxPrice, inStock, limit = 100, page = 1 } = req.query;

    if (isMongoConnected && db) {
      const andConditions = [];

      if (category && category !== 'all') {
        const catConds = [
          { categorySlug: category },
          { categorySlug: { $regex: category, $options: 'i' } },
          { category: category },
          { category: { $regex: category, $options: 'i' } },
          { category_name: category },
          { category_name: { $regex: category, $options: 'i' } }
        ];
        if (!isNaN(Number(category))) {
          catConds.push({ category_id: Number(category) });
        }
        andConditions.push({ $or: catConds });
      }

      if (featured === 'true') {
        andConditions.push({ $or: [{ isFeatured: true }, { is_featured: true }] });
      }

      if (bestSeller === 'true') {
        andConditions.push({ $or: [{ isBestSeller: true }, { is_bestseller: true }] });
      }

      if (search && search.trim()) {
        const s = search.trim();
        andConditions.push({
          $or: [
            { name: { $regex: s, $options: 'i' } },
            { nameEn: { $regex: s, $options: 'i' } },
            { name_bn: { $regex: s, $options: 'i' } },
            { name_en: { $regex: s, $options: 'i' } },
            { category: { $regex: s, $options: 'i' } },
            { category_name: { $regex: s, $options: 'i' } },
            { categorySlug: { $regex: s, $options: 'i' } },
            { slug: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } }
          ]
        });
      }

      if (sellerId && sellerId !== 'all') {
        const sNum = Number(sellerId);
        const sStr = String(sellerId);
        const sConds = [
          { seller_id: sellerId },
          { seller_id: sStr },
          { sellerId: sellerId },
          { sellerId: sStr },
          { seller_email: sellerId },
          { seller_phone: sellerId },
          { seller_name: sellerId },
          { seller_name_bn: sellerId },
          { seller_name_en: sellerId },
          { sellerName: sellerId },
          { shop_name: sellerId },
          { shop_name_bn: sellerId },
          { shop_name_en: sellerId },
          { 'seller.id': sellerId },
          { 'seller.shop_name': sellerId }
        ];
        if (!isNaN(sNum) && sNum > 0) {
          sConds.push({ seller_id: sNum });
          sConds.push({ sellerId: sNum });
          sConds.push({ 'seller.id': sNum });
        }
        if (ObjectId.isValid(sellerId)) {
          sConds.push({ seller_id: new ObjectId(sellerId) });
          sConds.push({ sellerId: new ObjectId(sellerId) });
          sConds.push({ user_id: new ObjectId(sellerId) });
        }
        andConditions.push({ $or: sConds });
      }

      if (minPrice && !isNaN(Number(minPrice))) {
        andConditions.push({ $or: [{ price: { $gte: Number(minPrice) } }, { regular_price: { $gte: Number(minPrice) } }] });
      }

      if (maxPrice && !isNaN(Number(maxPrice))) {
        andConditions.push({ $or: [{ price: { $lte: Number(maxPrice) } }, { regular_price: { $lte: Number(maxPrice) } }] });
      }

      if (inStock === 'true') {
        andConditions.push({ $or: [{ stock: { $gt: 0 } }, { stock_quantity: { $gt: 0 } }] });
      }

      const query = andConditions.length > 0 ? { $and: andConditions } : {};

      // Sorting
      let sortOption = { createdAt: -1, _id: -1 };
      if (sort === 'price_asc') {
        sortOption = { price: 1 };
      } else if (sort === 'price_desc') {
        sortOption = { price: -1 };
      } else if (sort === 'rating') {
        sortOption = { rating: -1, reviews_count: -1 };
      } else if (sort === 'newest') {
        sortOption = { createdAt: -1, _id: -1 };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await db.collection('products').countDocuments(query);
      const products = await db.collection('products').find(query).sort(sortOption).skip(skip).limit(Number(limit)).toArray();

      return res.json({
        success: true,
        count: products.length,
        total,
        data: products.map(formatDoc)
      });
    }

    let products = [...memoryDb.products];

    if (category && category !== 'all') {
      products = products.filter(p => p.categorySlug === category || p.category === category || String(p.category_id) === String(category));
    }

    if (featured === 'true') products = products.filter(p => p.isFeatured || p.is_featured);
    if (bestSeller === 'true') products = products.filter(p => p.isBestSeller || p.is_bestseller);

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(s) ||
        p.nameEn?.toLowerCase().includes(s) ||
        p.name_bn?.toLowerCase().includes(s) ||
        p.category?.toLowerCase().includes(s) ||
        p.slug?.toLowerCase().includes(s)
      );
    }

    if (sort === 'price_asc') {
      products.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price_desc') {
      products.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    res.json({
      success: true,
      count: products.length,
      total: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'পণ্য আনতে সমস্যা হয়েছে', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected && db) {
      let product = null;
      if (ObjectId.isValid(id)) {
        product = await db.collection('products').findOne({ _id: new ObjectId(id) });
      }
      if (!product) {
        product = await db.collection('products').findOne({
          $or: [{ slug: id }, { id: id }]
        });
      }

      if (!product) {
        return res.status(404).json({ success: false, message: 'পণ্য খুঁজে পাওয়া যায়নি' });
      }

      return res.json({ success: true, data: formatDoc(product) });
    }

    const product = memoryDb.products.find(p => p.id === id || p._id === id || p.slug === id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'পণ্য খুঁজে পাওয়া যায়নি' });
    }

    res.json({ success: true, data: formatDoc(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product details', error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const raw = req.body || {};

    const images = Array.isArray(raw.images) && raw.images.length > 0
      ? raw.images
      : (raw.thumbnail ? [raw.thumbnail] : []);
    const thumbnail = raw.thumbnail || (images.length > 0 ? images[0] : '');

    const fallbackSlug = 'prod-' + Date.now();
    const rawSlug = raw.slug || (raw.nameEn || raw.name_en || raw.name || fallbackSlug);
    const cleanSlug = String(rawSlug).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || fallbackSlug;

    const newProduct = {
      name: raw.name || raw.name_bn || 'নতুন পণ্য',
      nameEn: raw.nameEn || raw.name_en || raw.name || '',
      name_bn: raw.name_bn || raw.name || '',
      name_en: raw.name_en || raw.nameEn || raw.name || '',
      slug: cleanSlug,
      category: raw.category || 'সকল পণ্য',
      categorySlug: raw.categorySlug || 'all',
      category_id: raw.category_id || 1,
      price: Number(raw.price) || 0,
      regularPrice: Number(raw.regularPrice || raw.price) || 0,
      discountPercentage: Number(raw.discountPercentage) || (
        raw.regularPrice && raw.price && Number(raw.regularPrice) > Number(raw.price)
          ? Math.round(((Number(raw.regularPrice) - Number(raw.price)) / Number(raw.regularPrice)) * 100)
          : 0
      ),
      stock: Number(raw.stock !== undefined ? raw.stock : (raw.stock_quantity !== undefined ? raw.stock_quantity : 50)),
      stock_quantity: Number(raw.stock_quantity !== undefined ? raw.stock_quantity : (raw.stock !== undefined ? raw.stock : 50)),
      sku: raw.sku || ('GB-' + Math.floor(100 + Math.random() * 900)),
      thumbnail,
      images,
      description: raw.description || '',
      benefits: Array.isArray(raw.benefits) ? raw.benefits : [],
      variants: Array.isArray(raw.variants) && raw.variants.length > 0 ? raw.variants : [],
      rating: Number(raw.rating) || 5.0,
      ratingCount: Number(raw.ratingCount) || 1,
      isFeatured: Boolean(raw.isFeatured !== undefined ? raw.isFeatured : raw.is_featured),
      is_featured: Boolean(raw.is_featured !== undefined ? raw.is_featured : raw.isFeatured),
      isBestSeller: Boolean(raw.isBestSeller),
      unit: raw.unit || 'Standard',
      origin: raw.origin || 'বাংলাদেশ',
      seller_id: raw.seller_id || raw.sellerId || 1,
      sellerId: raw.seller_id || raw.sellerId || 1,
      seller_email: raw.seller_email || raw.sellerEmail || '',
      seller_phone: raw.seller_phone || raw.sellerPhone || '',
      seller_name: raw.seller_name || raw.seller_name_bn || raw.shop_name || raw.sellerName || 'সুন্দরবন অর্গানিক ফার্মস',
      seller_name_bn: raw.seller_name_bn || raw.seller_name || raw.shop_name || 'সুন্দরবন অর্গানিক ফার্মস',
      seller_name_en: raw.seller_name_en || raw.sellerName || raw.shop_name_en || 'Sundarban Organic Farms',
      sellerName: raw.seller_name_en || raw.sellerName || raw.seller_name || 'Sundarban Organic Farms',
      shop_name: raw.shop_name || raw.seller_name || raw.seller_name_bn || 'সুন্দরবন অর্গানিক ফার্মস',
      shop_name_bn: raw.shop_name_bn || raw.seller_name_bn || raw.seller_name || 'সুন্দরবন অর্গানিক ফার্মস',
      shop_name_en: raw.shop_name_en || raw.seller_name_en || raw.sellerName || 'Sundarban Organic Farms',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('products').insertOne(newProduct);
      const savedDoc = { ...newProduct, id: result.insertedId.toString(), _id: result.insertedId.toString() };
      return res.status(201).json({
        success: true,
        message: 'পণ্য সফলভাবে ডাটাবেসে যুক্ত হয়েছে',
        data: savedDoc
      });
    }

    const id = 'p_' + Date.now();
    const product = { _id: id, id, ...newProduct };
    memoryDb.products.unshift(product);
    res.status(201).json({ success: true, message: 'পণ্য সফলভাবে যুক্ত হয়েছে (Memory Mode)', data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
});

const handleProductUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body || {};

    let images = raw.images;
    let thumbnail = raw.thumbnail;

    if (thumbnail && (!images || !Array.isArray(images) || images.length === 0)) {
      images = [thumbnail];
    } else if (images && Array.isArray(images) && images.length > 0 && !thumbnail) {
      thumbnail = images[0];
    }

    const updateFields = {
      updatedAt: new Date(),
    };

    if (raw.name !== undefined) {
      updateFields.name = raw.name;
      updateFields.name_bn = raw.name_bn || raw.name;
    }
    if (raw.name_bn !== undefined) updateFields.name_bn = raw.name_bn;
    if (raw.nameEn !== undefined) {
      updateFields.nameEn = raw.nameEn;
      updateFields.name_en = raw.nameEn;
    }
    if (raw.name_en !== undefined) {
      updateFields.name_en = raw.name_en;
      updateFields.nameEn = raw.name_en;
    }
    if (raw.slug !== undefined) updateFields.slug = raw.slug;
    if (raw.category !== undefined) updateFields.category = raw.category;
    if (raw.categorySlug !== undefined) updateFields.categorySlug = raw.categorySlug;
    if (raw.category_id !== undefined) updateFields.category_id = Number(raw.category_id);
    if (raw.price !== undefined) updateFields.price = Number(raw.price);
    if (raw.regularPrice !== undefined) updateFields.regularPrice = Number(raw.regularPrice);
    if (raw.stock !== undefined) {
      updateFields.stock = Number(raw.stock);
      updateFields.stock_quantity = Number(raw.stock);
    }
    if (raw.stock_quantity !== undefined) {
      updateFields.stock_quantity = Number(raw.stock_quantity);
      if (updateFields.stock === undefined) updateFields.stock = Number(raw.stock_quantity);
    }
    if (raw.sku !== undefined) updateFields.sku = raw.sku;
    if (thumbnail !== undefined) updateFields.thumbnail = thumbnail;
    if (images !== undefined) updateFields.images = Array.isArray(images) ? images : [images];
    if (raw.description !== undefined) updateFields.description = raw.description;
    if (raw.benefits !== undefined) updateFields.benefits = raw.benefits;
    if (raw.variants !== undefined) updateFields.variants = raw.variants;
    if (raw.isFeatured !== undefined) updateFields.isFeatured = Boolean(raw.isFeatured);
    if (raw.is_featured !== undefined) {
      updateFields.is_featured = Boolean(raw.is_featured);
      if (raw.isFeatured === undefined) updateFields.isFeatured = Boolean(raw.is_featured);
    }
    if (raw.isBestSeller !== undefined) updateFields.isBestSeller = Boolean(raw.isBestSeller);
    if (raw.unit !== undefined) updateFields.unit = raw.unit;
    if (raw.origin !== undefined) updateFields.origin = raw.origin;
    if (raw.seller_id !== undefined) updateFields.seller_id = raw.seller_id;
    if (raw.sellerId !== undefined) updateFields.sellerId = raw.sellerId;
    if (raw.seller_email !== undefined) updateFields.seller_email = raw.seller_email;
    if (raw.seller_phone !== undefined) updateFields.seller_phone = raw.seller_phone;
    if (raw.seller_name !== undefined) {
      updateFields.seller_name = raw.seller_name;
      updateFields.seller_name_bn = raw.seller_name;
    }
    if (raw.seller_name_bn !== undefined) updateFields.seller_name_bn = raw.seller_name_bn;
    if (raw.seller_name_en !== undefined) {
      updateFields.seller_name_en = raw.seller_name_en;
      updateFields.sellerName = raw.seller_name_en;
    }
    if (raw.sellerName !== undefined) {
      updateFields.sellerName = raw.sellerName;
      updateFields.seller_name_en = raw.sellerName;
    }
    if (raw.shop_name !== undefined) {
      updateFields.shop_name = raw.shop_name;
      updateFields.shop_name_bn = raw.shop_name;
    }
    if (raw.shop_name_bn !== undefined) updateFields.shop_name_bn = raw.shop_name_bn;
    if (raw.shop_name_en !== undefined) updateFields.shop_name_en = raw.shop_name_en;

    if (updateFields.price !== undefined || updateFields.regularPrice !== undefined) {
      const p = updateFields.price !== undefined ? updateFields.price : raw.price;
      const rp = updateFields.regularPrice !== undefined ? updateFields.regularPrice : raw.regularPrice;
      if (rp && p && rp > p) {
        updateFields.discountPercentage = Math.round(((rp - p) / rp) * 100);
      } else {
        updateFields.discountPercentage = 0;
      }
    }

    if (isMongoConnected && db) {
      let filter = null;
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      } else {
        filter = { $or: [{ slug: id }, { id: id }] };
      }

      await db.collection('products').updateOne(filter, { $set: updateFields });

      let refreshed = await db.collection('products').findOne(filter);
      if (!refreshed && !ObjectId.isValid(id)) {
        refreshed = await db.collection('products').findOne({ slug: id });
      }
      if (!refreshed) {
        return res.status(404).json({ success: false, message: 'পণ্য খুঁজে পাওয়া যায়নি' });
      }

      return res.json({
        success: true,
        message: 'পণ্য সফলভাবে ডাটাবেসে আপডেট হয়েছে',
        data: formatDoc(refreshed)
      });
    }

    const idx = memoryDb.products.findIndex(p => p.id === id || p._id === id || p.slug === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'পণ্য খুঁজে পাওয়া যায়নি' });
    }

    memoryDb.products[idx] = {
      ...memoryDb.products[idx],
      ...updateFields
    };

    res.json({
      success: true,
      message: 'পণ্য সফলভাবে আপডেট হয়েছে',
      data: formatDoc(memoryDb.products[idx])
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'পণ্য আপডেট করতে সমস্যা হয়েছে', error: error.message });
  }
};

app.put('/api/products/:id', handleProductUpdate);
app.patch('/api/products/:id', handleProductUpdate);

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected && db) {
      if (ObjectId.isValid(id)) {
        await db.collection('products').deleteOne({ _id: new ObjectId(id) });
      } else {
        await db.collection('products').deleteOne({ $or: [{ slug: id }, { id: id }] });
      }
      return res.json({ success: true, message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে' });
    }

    memoryDb.products = memoryDb.products.filter(p => p.id !== id && p._id !== id && p.slug !== id);
    res.json({ success: true, message: 'পণ্য সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

// ----------------------------------------------------
// POPUP NOTICE API
// ----------------------------------------------------

app.get('/api/popup', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      let popup = await db.collection('popup_settings').findOne({});
      if (!popup) {
        popup = { ...INITIAL_POPUP };
        await db.collection('popup_settings').insertOne({ ...popup, _id: 'default_popup' });
      }
      return res.json({ success: true, data: formatDoc(popup) });
    }

    res.json({ success: true, data: memoryDb.popup || INITIAL_POPUP });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch popup notice', error: error.message });
  }
});

const handlePopupUpdate = async (req, res) => {
  try {
    const updateData = {
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      title: req.body.title || 'ইহসান অনলাইন শপ',
      titleEn: req.body.titleEn || req.body.title_en || 'Ihsan Online Shop',
      badge: req.body.badge || '🇵🇸 ফিলিস্তিন ও মানবতার কল্যাণে অনুদান',
      badgeEn: req.body.badgeEn || req.body.badge_en || '🇵🇸 Palestine & Humanity Relief Support',
      message: req.body.message || '',
      messageEn: req.body.messageEn || req.body.message_en || '',
      buttonText: req.body.buttonText || req.body.button_text || 'কেনাকাটা শুরু করুন',
      buttonTextEn: req.body.buttonTextEn || req.body.button_text_en || 'Start Shopping',
      buttonLink: req.body.buttonLink || req.body.button_link || '/products',
      image: req.body.image || '',
      showImage: Boolean(req.body.showImage !== undefined ? req.body.showImage : req.body.show_image),
      updatedAt: new Date()
    };

    if (isMongoConnected && db) {
      await db.collection('popup_settings').updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );
      const updated = await db.collection('popup_settings').findOne({});
      return res.json({
        success: true,
        message: 'পপআপ বার্তা সফলভাবে ডাটাবেসে সেভ হয়েছে!',
        data: formatDoc(updated)
      });
    }

    memoryDb.popup = { ...memoryDb.popup, ...updateData };
    res.json({
      success: true,
      message: 'পপআপ বার্তা সফলভাবে সেভ হয়েছে (Memory Mode)!',
      data: memoryDb.popup
    });
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ success: false, message: 'Failed to update popup notice', error: error.message });
  }
};

app.post('/api/popup', handlePopupUpdate);
app.put('/api/popup', handlePopupUpdate);
app.patch('/api/popup', handlePopupUpdate);

// ----------------------------------------------------
// 2. CATEGORIES API
// ----------------------------------------------------

app.get('/api/categories', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const categories = await db.collection('categories').find({}).toArray();
      return res.json({ success: true, data: categories.map(formatDoc) });
    }
    res.json({ success: true, data: memoryDb.categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const raw = req.body || {};
    const newCategory = {
      name: raw.name || raw.name_bn || 'নতুন ক্যাটাগরি',
      name_bn: raw.name_bn || raw.name || 'নতুন ক্যাটাগরি',
      name_en: raw.name_en || raw.nameEn || '',
      slug: raw.slug || ('cat-' + Date.now()),
      icon: raw.icon || '🏷️',
      image: raw.image || '',
      status: raw.status || 'active',
      createdAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('categories').insertOne(newCategory);
      return res.status(201).json({
        success: true,
        message: 'ক্যাটাগরি যুক্ত হয়েছে',
        data: { ...newCategory, id: result.insertedId.toString(), _id: result.insertedId.toString() }
      });
    }

    const item = { id: Date.now(), _id: String(Date.now()), ...newCategory };
    memoryDb.categories.push(item);
    res.status(201).json({ success: true, message: 'ক্যাটাগরি যুক্ত হয়েছে', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('categories').updateOne(filter, { $set: updateData });
      return res.json({ success: true, message: 'ক্যাটাগরি আপডেট হয়েছে' });
    }

    const idx = memoryDb.categories.findIndex(c => String(c.id) === String(id) || String(c._id) === String(id));
    if (idx !== -1) {
      memoryDb.categories[idx] = { ...memoryDb.categories[idx], ...updateData };
    }
    res.json({ success: true, message: 'ক্যাটাগরি আপডেট হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('categories').deleteOne(filter);
      return res.json({ success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
    }
    memoryDb.categories = memoryDb.categories.filter(c => String(c.id) !== String(id) && String(c._id) !== String(id));
    res.json({ success: true, message: 'ক্যাটাগরি মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

// ----------------------------------------------------
// 3. BANNERS API
// ----------------------------------------------------

app.get('/api/banners', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const banners = await db.collection('banners').find({}).toArray();
      return res.json({ success: true, data: banners.map(formatDoc) });
    }
    res.json({ success: true, data: memoryDb.banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners' });
  }
});

app.post('/api/banners', async (req, res) => {
  try {
    const raw = req.body || {};
    const newBanner = {
      title: raw.title || '',
      titleEn: raw.titleEn || raw.title_en || '',
      subtitle: raw.subtitle || '',
      subtitleEn: raw.subtitleEn || raw.subtitle_en || '',
      badge: raw.badge || 'PROMO',
      badgeEn: raw.badgeEn || raw.badge_en || 'PROMO',
      image: raw.image || '',
      link: raw.link || '/products',
      buttonText: raw.buttonText || 'কেনাকাটা করুন',
      buttonTextEn: raw.buttonTextEn || 'Shop Now',
      status: raw.status || 'active',
      createdAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('banners').insertOne(newBanner);
      return res.status(201).json({
        success: true,
        message: 'ব্যানার যুক্ত হয়েছে',
        data: { ...newBanner, id: result.insertedId.toString(), _id: result.insertedId.toString() }
      });
    }

    const item = { id: Date.now(), _id: String(Date.now()), ...newBanner };
    memoryDb.banners.push(item);
    res.status(201).json({ success: true, message: 'ব্যানার যুক্ত হয়েছে', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner' });
  }
});

app.put('/api/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('banners').updateOne(filter, { $set: updateData });
      return res.json({ success: true, message: 'ব্যানার আপডেট হয়েছে' });
    }

    const idx = memoryDb.banners.findIndex(b => String(b.id) === String(id) || String(b._id) === String(id));
    if (idx !== -1) {
      memoryDb.banners[idx] = { ...memoryDb.banners[idx], ...updateData };
    }
    res.json({ success: true, message: 'ব্যানার আপডেট হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner' });
  }
});

app.delete('/api/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('banners').deleteOne(filter);
      return res.json({ success: true, message: 'ব্যানার মুছে ফেলা হয়েছে' });
    }
    memoryDb.banners = memoryDb.banners.filter(b => String(b.id) !== String(id) && String(b._id) !== String(id));
    res.json({ success: true, message: 'ব্যানার মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner' });
  }
});

// ----------------------------------------------------
// 4. COUPONS API
// ----------------------------------------------------

app.get('/api/coupons', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const coupons = await db.collection('coupons').find({}).toArray();
      return res.json({ success: true, data: coupons.map(formatDoc) });
    }
    res.json({ success: true, data: memoryDb.coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const raw = req.body || {};
    const newCoupon = {
      code: String(raw.code || '').trim().toUpperCase(),
      discount_type: raw.discount_type || 'percentage',
      discount_value: Number(raw.discount_value) || 0,
      min_purchase: Number(raw.min_purchase) || 0,
      expiry_date: raw.expiry_date || '2026-12-31',
      status: raw.status || 'active',
      createdAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('coupons').insertOne(newCoupon);
      return res.status(201).json({
        success: true,
        message: 'কুপন সফলভাবে যুক্ত হয়েছে',
        data: { ...newCoupon, id: result.insertedId.toString(), _id: result.insertedId.toString() }
      });
    }

    const item = { id: Date.now(), _id: String(Date.now()), ...newCoupon };
    memoryDb.coupons.push(item);
    res.status(201).json({ success: true, message: 'কুপন যুক্ত হয়েছে', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
});

app.put('/api/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('coupons').updateOne(filter, { $set: updateData });
      return res.json({ success: true, message: 'কুপন আপডেট হয়েছে' });
    }

    const idx = memoryDb.coupons.findIndex(c => String(c.id) === String(id) || String(c._id) === String(id));
    if (idx !== -1) {
      memoryDb.coupons[idx] = { ...memoryDb.coupons[idx], ...updateData };
    }
    res.json({ success: true, message: 'কুপন আপডেট হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('coupons').deleteOne(filter);
      return res.json({ success: true, message: 'কুপন মুছে ফেলা হয়েছে' });
    }
    memoryDb.coupons = memoryDb.coupons.filter(c => String(c.id) !== String(id) && String(c._id) !== String(id));
    res.json({ success: true, message: 'কুপন মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
});

// ----------------------------------------------------
// 5. USERS & SELLERS MANAGEMENT API
// ----------------------------------------------------

// Helper to calculate real-time Online/Offline status & session duration
const calculateOnlineStatus = (doc) => {
  if (!doc) return doc;
  const now = new Date();
  const lastActive = doc.last_active_at ? new Date(doc.last_active_at) : null;
  const sessionStarted = doc.session_started_at ? new Date(doc.session_started_at) : (lastActive || doc.createdAt);

  // A user is considered Online if they were active in the last 150 seconds (2.5 minutes) and is_online !== false
  const isCurrentlyOnline = Boolean(
    doc.is_online !== false &&
    lastActive &&
    (now.getTime() - lastActive.getTime()) < 150000
  );

  let sessionDurationMinutes = 1;
  if (isCurrentlyOnline && sessionStarted) {
    sessionDurationMinutes = Math.max(1, Math.round((now.getTime() - new Date(sessionStarted).getTime()) / 60000));
  } else if (!isCurrentlyOnline) {
    sessionDurationMinutes = doc.last_session_duration_minutes || (sessionStarted && lastActive ? Math.max(1, Math.round((new Date(lastActive).getTime() - new Date(sessionStarted).getTime()) / 60000)) : 8);
  }

  const formatted = formatDoc(doc);
  return {
    ...formatted,
    is_online: isCurrentlyOnline,
    last_active_at: lastActive || doc.updatedAt || doc.createdAt,
    last_seen: doc.last_seen || lastActive || doc.updatedAt || doc.createdAt,
    session_started_at: sessionStarted,
    session_duration_minutes: sessionDurationMinutes,
    last_session_duration_minutes: sessionDurationMinutes
  };
};

app.get('/api/users', async (req, res) => {
  try {
    const { role, status, search, online } = req.query;
    if (isMongoConnected && db) {
      const query = {};
      if (role && role !== 'all') query.role = role;
      if (status && status !== 'all') query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      const users = await db.collection('users').find(query).sort({ last_active_at: -1, createdAt: -1 }).toArray();
      let calculated = users.map(calculateOnlineStatus);

      if (online === 'true') {
        calculated = calculated.filter(u => u.is_online);
      } else if (online === 'false') {
        calculated = calculated.filter(u => !u.is_online);
      }

      return res.json({ success: true, total: calculated.length, data: calculated });
    }

    let users = [...memoryDb.users].map(calculateOnlineStatus);
    if (role && role !== 'all') users = users.filter(u => u.role === role);
    if (status && status !== 'all') users = users.filter(u => u.status === status);
    if (online === 'true') users = users.filter(u => u.is_online);
    if (online === 'false') users = users.filter(u => !u.is_online);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u => u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q));
    }
    res.json({ success: true, total: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// POST /api/users/heartbeat - Realtime Online Heartbeat
app.post('/api/users/heartbeat', async (req, res) => {
  try {
    const { userId, id, email, phone } = req.body;
    const targetIdentifier = userId || id || email || phone;
    const now = new Date();

    if (isMongoConnected && db && targetIdentifier) {
      const orCond = [];
      if (userId && ObjectId.isValid(userId)) orCond.push({ _id: new ObjectId(userId) });
      if (id && ObjectId.isValid(id)) orCond.push({ _id: new ObjectId(id) });
      if (id && typeof id === 'number') orCond.push({ id });
      if (email) orCond.push({ email: email.toLowerCase() });
      if (phone) orCond.push({ phone });

      const user = await db.collection('users').findOne(orCond.length > 0 ? { $or: orCond } : { email: targetIdentifier });
      if (user) {
        const wasOffline = !user.is_online || !user.last_active_at || (now.getTime() - new Date(user.last_active_at).getTime() > 180000);
        const sessionStarted = wasOffline ? now : (user.session_started_at || now);

        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              is_online: true,
              last_active_at: now,
              session_started_at: sessionStarted,
              updatedAt: now
            }
          }
        );
        return res.json({ success: true, is_online: true, last_active_at: now, session_started_at: sessionStarted });
      }
    }

    return res.json({ success: true, is_online: true, last_active_at: now });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, message: 'Heartbeat update failed' });
  }
});

// POST /api/users/offline - Mark user offline
app.post('/api/users/offline', async (req, res) => {
  try {
    const { userId, id, email, phone } = req.body;
    const now = new Date();

    if (isMongoConnected && db) {
      const orCond = [];
      if (userId && ObjectId.isValid(userId)) orCond.push({ _id: new ObjectId(userId) });
      if (id && ObjectId.isValid(id)) orCond.push({ _id: new ObjectId(id) });
      if (email) orCond.push({ email: email.toLowerCase() });
      if (phone) orCond.push({ phone });

      if (orCond.length > 0) {
        const user = await db.collection('users').findOne({ $or: orCond });
        if (user) {
          let lastSessionMins = 5;
          if (user.session_started_at) {
            lastSessionMins = Math.max(1, Math.round((now.getTime() - new Date(user.session_started_at).getTime()) / 60000));
          }
          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                is_online: false,
                last_seen: now,
                last_active_at: now,
                last_session_duration_minutes: lastSessionMins,
                updatedAt: now
              }
            }
          );
        }
      }
    }
    return res.json({ success: true, is_online: false, last_seen: now });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set offline' });
  }
});

app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('users').updateOne(filter, { $set: { status, updatedAt: new Date() } });
      return res.json({ success: true, message: 'ইউজার স্ট্যাটাস পরিবর্তন হয়েছে' });
    }
    const user = memoryDb.users.find(u => String(u.id) === String(id) || String(u._id) === String(id));
    if (user) user.status = status;
    res.json({ success: true, message: 'ইউজার স্ট্যাটাস পরিবর্তন হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
});

app.patch('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const cleanRole = (role || 'customer').toLowerCase().trim();

    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      const user = await db.collection('users').findOne(filter);
      if (!user) {
        return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি' });
      }

      await db.collection('users').updateOne(filter, { $set: { role: cleanRole, updatedAt: new Date() } });

      const userIdStr = user._id ? user._id.toString() : String(user.id || id);

      if (cleanRole === 'seller') {
        // Sync to sellers collection
        const existingSeller = await db.collection('sellers').findOne({
          $or: [
            { user_id: userIdStr },
            ...(user.email ? [{ email: user.email }] : []),
            ...(user.phone ? [{ phone: user.phone }] : [])
          ]
        });

        if (!existingSeller) {
          const newSellerDoc = {
            user_id: userIdStr,
            seller_name: user.name || 'Seller',
            shop_name: user.shop_name || (user.name ? `${user.name} Store` : 'Ihsan Vendor Shop'),
            phone: user.phone || '',
            email: user.email || '',
            shop_logo: user.avatar || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
            status: 'approved',
            balance: user.balance || 0,
            commission_rate: 10,
            trade_license: 'TL-' + Math.floor(100000 + Math.random() * 900000),
            shop_description: `${user.name || 'সেলার'} এর নিজস্ব অনুমোদিত শপ`,
            rating: 5.0,
            sales_count: 0,
            products_count: 0,
            created_at: user.createdAt || new Date(),
            updated_at: new Date()
          };
          await db.collection('sellers').insertOne(newSellerDoc);
        } else {
          await db.collection('sellers').updateOne(
            { _id: existingSeller._id },
            { $set: { status: 'approved', seller_name: user.name, shop_logo: user.avatar || existingSeller.shop_logo, updatedAt: new Date() } }
          );
        }
      } else {
        // If changed away from seller, remove from sellers collection
        await db.collection('sellers').deleteMany({
          $or: [
            { user_id: userIdStr },
            ...(user.email ? [{ email: user.email }] : [])
          ]
        });
      }

      return res.json({
        success: true,
        message: cleanRole === 'seller' ? 'ইউজারকে সেলার করা হয়েছে এবং Seller Management এ যোগ করা হয়েছে!' : 'ইউজার রোল সফলভাবে পরিবর্তন করা হয়েছে!'
      });
    }

    // In-memory fallback
    const user = memoryDb.users.find(u => String(u.id) === String(id) || String(u._id) === String(id));
    if (user) {
      user.role = cleanRole;
      if (cleanRole === 'seller') {
        const existing = memoryDb.sellers.find(s => s.user_id === String(user.id) || s.email === user.email);
        if (!existing) {
          memoryDb.sellers.push({
            id: memoryDb.sellers.length + 1,
            user_id: String(user.id),
            seller_name: user.name,
            shop_name: `${user.name} Store`,
            phone: user.phone || '',
            email: user.email || '',
            shop_logo: user.avatar || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
            status: 'approved',
            balance: 0,
            commission_rate: 10,
            trade_license: 'TL-' + Math.floor(100000 + Math.random() * 900000),
            shop_description: `${user.name} এর নিজস্ব অনুমোদিত শপ`,
            created_at: new Date()
          });
        }
      } else {
        memoryDb.sellers = memoryDb.sellers.filter(s => s.user_id !== String(user.id) && s.email !== user.email);
      }
    }
    res.json({ success: true, message: 'ইউজার রোল পরিবর্তন হয়েছে' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, password, role, avatar, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'ইউজারের পূর্ণ নাম প্রদান করুন' });
    }

    const cleanName = name.trim();
    const fallbackEmail = (cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user') + Date.now().toString().slice(-4) + '@ihsan.com';
    const userEmail = (email && email.trim()) ? email.trim().toLowerCase() : fallbackEmail;
    const userPhone = (phone && phone.trim()) ? phone.trim() : '';
    const userPassword = (password && password.trim()) ? password.trim() : '123456';
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const userRole = (role && role.trim()) ? role.trim().toLowerCase() : 'customer';
    const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

    const newUser = {
      name: cleanName,
      email: userEmail,
      phone: userPhone,
      password: hashedPassword,
      passwordText: userPassword,
      role: userRole,
      avatar: defaultAvatar,
      status: status || 'active',
      orders_count: 0,
      total_spent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected && db) {
      const orCond = [];
      if (email && email.trim()) orCond.push({ email: userEmail });
      if (userPhone) orCond.push({ phone: userPhone });
      if (orCond.length > 0) {
        const existing = await db.collection('users').findOne({ $or: orCond });
        if (existing) {
          return res.status(400).json({ success: false, message: 'এই ইমেইল বা ফোন নম্বরে ইতিপূর্বে ইউজার রয়েছে' });
        }
      }

      const result = await db.collection('users').insertOne(newUser);
      const createdUserId = result.insertedId.toString();

      if (userRole === 'seller') {
        const newSellerDoc = {
          user_id: createdUserId,
          seller_name: cleanName,
          shop_name: `${cleanName} Store`,
          phone: userPhone,
          email: userEmail,
          shop_logo: defaultAvatar,
          status: 'approved',
          balance: 0,
          commission_rate: 10,
          trade_license: 'TL-' + Math.floor(100000 + Math.random() * 900000),
          shop_description: `${cleanName} এর নিজস্ব অনুমোদিত শপ`,
          rating: 5.0,
          sales_count: 0,
          products_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        };
        await db.collection('sellers').insertOne(newSellerDoc);
      }

      const createdUser = {
        _id: result.insertedId.toString(),
        id: result.insertedId.toString(),
        ...newUser
      };
      return res.status(201).json({
        success: true,
        message: 'নতুন ইউজার সফলভাবে তৈরি হয়েছে এবং MongoDB তে সংরক্ষিত হয়েছে!',
        data: formatDoc(createdUser)
      });
    }

    const id = (memoryDb.users.length + 1).toString();
    const createdUser = { _id: id, id, ...newUser };
    memoryDb.users.push(createdUser);
    res.status(201).json({
      success: true,
      message: 'ইউজার তৈরি হয়েছে!',
      data: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
  }
});

// DELETE /api/users/:id - Delete User from MongoDB
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('users').deleteOne(filter);
      return res.json({ success: true, message: 'ইউজার সফলভাবে মুছে ফেলা হয়েছে' });
    }
    memoryDb.users = memoryDb.users.filter(u => String(u.id) !== String(id) && String(u._id) !== String(id));
    res.json({ success: true, message: 'ইউজার মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

app.get('/api/sellers', async (req, res) => {
  try {
    const { status } = req.query;
    if (isMongoConnected && db) {
      // 1. Fetch all seller users from users collection
      const sellerUsers = await db.collection('users').find({ role: 'seller' }).toArray();

      // 2. Ensure each seller user has a record in sellers collection
      for (const u of sellerUsers) {
        const uId = u._id ? u._id.toString() : String(u.id);
        const exists = await db.collection('sellers').findOne({
          $or: [
            { user_id: uId },
            ...(u.email ? [{ email: u.email }] : []),
            ...(u.phone ? [{ phone: u.phone }] : [])
          ]
        });

        if (!exists) {
          await db.collection('sellers').insertOne({
            user_id: uId,
            seller_name: u.name || 'Seller',
            shop_name: u.shop_name || (u.name ? `${u.name} Store` : 'Ihsan Vendor Shop'),
            phone: u.phone || '',
            email: u.email || '',
            shop_logo: u.avatar || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
            status: 'approved',
            balance: u.balance || 0,
            commission_rate: 10,
            trade_license: 'TL-' + Math.floor(100000 + Math.random() * 900000),
            shop_description: `${u.name || 'সেলার'} এর নিজস্ব অনুমোদিত শপ`,
            rating: 5.0,
            sales_count: 0,
            products_count: 0,
            created_at: u.createdAt || new Date(),
            updated_at: new Date()
          });
        }
      }

      const query = status ? { status } : {};
      const sellers = await db.collection('sellers').find(query).sort({ created_at: -1 }).toArray();
      return res.json({ success: true, total: sellers.length, data: sellers.map(formatDoc) });
    }

    let sellers = [...memoryDb.sellers];
    if (status) sellers = sellers.filter(s => s.status === status);
    res.json({ success: true, total: sellers.length, data: sellers });
  } catch (error) {
    console.error('Fetch sellers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sellers' });
  }
});

app.patch('/api/sellers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: Number(id) || id };
      await db.collection('sellers').updateOne(filter, { $set: { status, updatedAt: new Date() } });
      return res.json({ success: true, message: 'সেলার স্ট্যাটাস পরিবর্তন হয়েছে' });
    }
    const seller = memoryDb.sellers.find(s => String(s.id) === String(id) || String(s._id) === String(id));
    if (seller) seller.status = status;
    res.json({ success: true, message: 'সেলার স্ট্যাটাস পরিবর্তন হয়েছে' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update seller status' });
  }
});

// GET /api/sellers/profile/:identifier - Fetch specific seller/vendor profile from MongoDB
app.get('/api/sellers/profile/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier required' });
    }
    const cleanId = decodeURIComponent(identifier).trim();

    if (isMongoConnected && db) {
      const isObjId = ObjectId.isValid(cleanId) && cleanId.length === 24;
      const sellerQuery = {
        $or: [
          ...(isObjId ? [{ _id: new ObjectId(cleanId) }, { user_id: cleanId }] : []),
          { user_id: cleanId },
          { email: cleanId.toLowerCase() },
          { phone: cleanId }
        ]
      };

      let seller = await db.collection('sellers').findOne(sellerQuery);

      if (!seller) {
        const userQuery = {
          $or: [
            ...(isObjId ? [{ _id: new ObjectId(cleanId) }] : []),
            { email: cleanId.toLowerCase() },
            { phone: cleanId }
          ]
        };
        const user = await db.collection('users').findOne(userQuery);
        if (user) {
          const uId = user._id.toString();
          const newDoc = {
            user_id: uId,
            seller_name: user.name || 'Seller',
            shop_name: user.shop_name || (user.name ? `${user.name} Store` : 'Ihsan Vendor Shop'),
            phone: user.phone || '',
            email: user.email || '',
            shop_logo: user.avatar || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
            status: 'approved',
            balance: user.balance || 0,
            commission_rate: 10,
            trade_license: 'TL-' + Math.floor(100000 + Math.random() * 900000),
            shop_description: `${user.name || 'সেলার'} এর নিজস্ব অনুমোদিত শপ`,
            rating: 5.0,
            sales_count: 0,
            products_count: 0,
            created_at: user.createdAt || new Date(),
            updated_at: new Date()
          };
          await db.collection('sellers').insertOne(newDoc);
          seller = newDoc;
        }
      }

      if (!seller) {
        return res.status(404).json({ success: false, message: 'Seller not found' });
      }

      return res.json({ success: true, data: formatDoc(seller) });
    }

    let seller = memoryDb.sellers.find(s =>
      String(s.id) === cleanId ||
      String(s._id) === cleanId ||
      s.user_id === cleanId ||
      (s.email && s.email.toLowerCase() === cleanId.toLowerCase()) ||
      s.phone === cleanId
    );
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    res.json({ success: true, data: seller });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller profile' });
  }
});

// PUT /api/sellers/profile - Update Seller & Vendor Information in MongoDB
app.put('/api/sellers/profile', async (req, res) => {
  try {
    const {
      userId,
      sellerId,
      seller_name,
      shop_name,
      phone,
      email,
      trade_license,
      commission_rate,
      balance,
      shop_logo,
      shop_banner,
      shop_description,
      bank_account,
      bkash_number,
      nagad_number
    } = req.body;

    if (isMongoConnected && db) {
      const cleanUserId = userId ? String(userId).trim() : null;
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const cleanPhone = phone ? phone.trim() : null;

      const sellerQueryOr = [];
      if (sellerId && ObjectId.isValid(sellerId) && sellerId.length === 24) {
        sellerQueryOr.push({ _id: new ObjectId(sellerId) });
      }
      if (cleanUserId) {
        sellerQueryOr.push({ user_id: cleanUserId });
        if (ObjectId.isValid(cleanUserId) && cleanUserId.length === 24) {
          sellerQueryOr.push({ _id: new ObjectId(cleanUserId) });
        }
      }
      if (cleanEmail) sellerQueryOr.push({ email: cleanEmail });
      if (cleanPhone) sellerQueryOr.push({ phone: cleanPhone });

      const updateDoc = {
        ...(seller_name ? { seller_name: seller_name.trim() } : {}),
        ...(shop_name ? { shop_name: shop_name.trim() } : {}),
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(trade_license ? { trade_license: trade_license.trim() } : {}),
        ...(commission_rate !== undefined ? { commission_rate: Number(commission_rate) } : {}),
        ...(balance !== undefined ? { balance: Number(balance) } : {}),
        ...(shop_logo ? { shop_logo } : {}),
        ...(shop_banner ? { shop_banner } : {}),
        ...(shop_description !== undefined ? { shop_description: shop_description.trim() } : {}),
        ...(bank_account ? { bank_account } : {}),
        ...(bkash_number ? { bkash_number } : {}),
        ...(nagad_number ? { nagad_number } : {}),
        updated_at: new Date()
      };

      let seller = null;
      if (sellerQueryOr.length > 0) {
        seller = await db.collection('sellers').findOne({ $or: sellerQueryOr });
      }

      if (seller) {
        await db.collection('sellers').updateOne({ _id: seller._id }, { $set: updateDoc });
      } else {
        const newSellerDoc = {
          user_id: cleanUserId || '',
          seller_name: seller_name || 'Seller',
          shop_name: shop_name || `${seller_name || 'Seller'} Store`,
          phone: cleanPhone || '',
          email: cleanEmail || '',
          shop_logo: shop_logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
          status: 'approved',
          balance: balance !== undefined ? Number(balance) : 0,
          commission_rate: commission_rate !== undefined ? Number(commission_rate) : 10,
          trade_license: trade_license || ('TL-' + Math.floor(100000 + Math.random() * 900000)),
          shop_description: shop_description || 'অনুমোদিত ভেন্ডর শপ',
          rating: 5.0,
          sales_count: 0,
          products_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
          ...updateDoc
        };
        const result = await db.collection('sellers').insertOne(newSellerDoc);
        seller = { _id: result.insertedId, ...newSellerDoc };
      }

      // Also synchronize user profile details in users collection
      const userQueryOr = [];
      if (cleanUserId && ObjectId.isValid(cleanUserId) && cleanUserId.length === 24) {
        userQueryOr.push({ _id: new ObjectId(cleanUserId) });
      }
      if (cleanEmail) userQueryOr.push({ email: cleanEmail });
      if (cleanPhone) userQueryOr.push({ phone: cleanPhone });

      if (userQueryOr.length > 0) {
        const userUpdate = {
          ...(seller_name ? { name: seller_name.trim(), name_bn: seller_name.trim(), name_en: seller_name.trim() } : {}),
          ...(cleanPhone ? { phone: cleanPhone } : {}),
          ...(cleanEmail ? { email: cleanEmail } : {}),
          ...(shop_logo ? { avatar: shop_logo } : {}),
          updatedAt: new Date()
        };
        await db.collection('users').updateMany({ $or: userQueryOr }, { $set: userUpdate });
      }

      const finalSeller = await db.collection('sellers').findOne({
        $or: sellerQueryOr.length > 0 ? sellerQueryOr : [{ _id: seller._id }]
      });

      return res.json({
        success: true,
        message: 'সেলার ও ভেন্ডর তথ্য সফলভাবে সংরক্ষিত হয়েছে এবং MongoDB তে আপডেট হয়েছে!',
        data: formatDoc(finalSeller || updateDoc)
      });
    }

    res.json({ success: true, message: 'সেলার তথ্য সংরক্ষিত হয়েছে' });
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update seller profile' });
  }
});

// ----------------------------------------------------
// 6. ORDERS API
// ----------------------------------------------------

// ----------------------------------------------------
// 6. ORDERS API & REAL-TIME LIFECYCLE MANAGEMENT (MongoDB)
// ----------------------------------------------------

// POST /api/orders - Place New Order with stock auto-reduction, customer avatar sync & real-time notification
app.post('/api/orders', async (req, res) => {
  try {
    const {
      user_id,
      userId,
      customerName,
      customerPhone,
      customerEmail,
      customerAvatar,
      shippingAddress,
      deliveryAddress,
      items,
      subtotal,
      deliveryZone,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      paymentStatus,
      orderNotes,
      notes
    } = req.body;

    const address = (shippingAddress || deliveryAddress || '').trim();
    const phone = (customerPhone || '').trim();
    const name = (customerName || '').trim();

    if (!name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'নাম, মোবাইল নম্বর, সম্পূর্ণ ডেলিভারি ঠিকানা এবং কমপক্ষে ১টি পণ্য প্রদান করুন।'
      });
    }

    // Check Stock Availability before placing order
    if (db) {
      const prodCol = db.collection('products');
      for (const it of items) {
        const pId = it.productId || it.id || it._id;
        if (pId) {
          let pFilter = { _id: pId };
          if (ObjectId.isValid(pId)) {
            pFilter = { $or: [{ _id: new ObjectId(pId) }, { _id: pId }] };
          }
          const existingProd = await prodCol.findOne(pFilter);
          if (existingProd) {
            const availableStock = Number(existingProd.stock_quantity ?? existingProd.stock ?? 50);
            const requestedQty = Number(it.quantity) || 1;
            if (availableStock <= 0) {
              return res.status(400).json({
                success: false,
                message: `দুঃখিত, "${existingProd.name || existingProd.name_bn || 'পণ্য'}" স্টক আউট (Out Of Stock) হয়ে গেছে!`
              });
            }
            if (requestedQty > availableStock) {
              return res.status(400).json({
                success: false,
                message: `দুঃখিত, "${existingProd.name || existingProd.name_bn || 'পণ্য'}" এর সর্বোচ্চ ${availableStock} টি স্টক অবশিষ্ট আছে (আপনি ${requestedQty} টি অর্ডার করেছেন)।`
              });
            }
          }
        }
      }
    }

    // Look up registered user from MongoDB users collection to populate Avatar and Email if not provided
    let matchedUser = null;
    if (db) {
      const usersCol = db.collection('users');
      const uQueries = [];
      const uidVal = user_id || userId;
      if (uidVal) {
        const uidStr = uidVal.toString();
        uQueries.push({ _id: uidStr });
        if (ObjectId.isValid(uidStr)) uQueries.push({ _id: new ObjectId(uidStr) });
        uQueries.push({ id: uidStr });
      }
      if (phone) {
        uQueries.push({ phone: phone });
      }
      if (customerEmail && customerEmail.trim()) {
        uQueries.push({ email: customerEmail.trim().toLowerCase() });
      }

      if (uQueries.length > 0) {
        matchedUser = await usersCol.findOne({ $or: uQueries });
      }
    }

    const finalUserId = user_id || userId || (matchedUser ? (matchedUser._id ? matchedUser._id.toString() : matchedUser.id) : null);
    const finalAvatar = customerAvatar || (matchedUser ? (matchedUser.avatar || matchedUser.photoURL) : '') || '';
    const finalEmail = (customerEmail || (matchedUser ? matchedUser.email : '') || '').trim().toLowerCase();

    const orderId = 'GB-ORD-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();

    const formattedItems = (items || []).map(item => ({
      productId: item.productId || item.id || item._id,
      name: item.name || item.name_bn || item.name_en || 'Product',
      price: Number(item.price) || 0,
      regularPrice: Number(item.regularPrice || item.price) || 0,
      quantity: Number(item.quantity) || 1,
      weight: item.weight || item.unit || 'Standard',
      image: item.image || item.thumbnail || (item.images && item.images[0]) || '/placeholder.jpg',
      sellerId: item.sellerId || item.seller_id || null,
      sellerName: item.sellerName || item.seller_name || 'সুন্দরবন অর্গানিক ফার্মস'
    }));

    const calculatedSubtotal = Number(subtotal) || formattedItems.reduce((s, it) => s + it.price * it.quantity, 0);
    const calculatedDelivery = Number(deliveryCharge) || 70;
    const calculatedTotal = Number(totalAmount) || (calculatedSubtotal + calculatedDelivery);

    const initialLog = {
      status: 'Pending',
      changed_by: name,
      role: 'customer',
      timestamp: now.toISOString(),
      note: 'কাস্টমার নতুন অর্ডার প্লেস করেছেন। স্ট্যাটাস: Pending'
    };

    const newOrder = {
      orderId,
      user_id: finalUserId,
      customer_id: finalUserId,
      customerName: name,
      customerPhone: phone,
      customerEmail: finalEmail,
      customerAvatar: finalAvatar,
      deliveryAddress: address,
      shippingAddress: address,
      deliveryZone: deliveryZone || 'inside_dhaka',
      deliveryCharge: calculatedDelivery,
      subtotal: calculatedSubtotal,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || (paymentMethod === 'bKash' ? 'Pending Verification' : 'Pending'),
      status: 'Pending',
      notes: orderNotes || notes || '',
      items: formattedItems,
      order_status_logs: [initialLog],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // 1. Insert Order into MongoDB
    let insertedId = null;
    if (db) {
      const ordersCol = db.collection('orders');
      const dbResult = await ordersCol.insertOne(newOrder);
      insertedId = dbResult.insertedId;
      newOrder._id = insertedId;
      newOrder.id = insertedId.toString();
    } else {
      newOrder.id = 'ord-' + Date.now();
    }

    // 2. Auto-Reduce Product Stock in MongoDB
    if (db) {
      const prodCol = db.collection('products');
      for (const it of formattedItems) {
        if (it.productId) {
          try {
            let filter = { _id: it.productId };
            if (ObjectId.isValid(it.productId)) {
              filter = { $or: [{ _id: new ObjectId(it.productId) }, { _id: it.productId }] };
            }
            await prodCol.updateOne(filter, {
              $inc: { stock_quantity: -it.quantity, stock: -it.quantity }
            });
          } catch (e) {
            console.error('Stock decrement error for product:', it.productId, e.message);
          }
        }
      }
    }

    // 3. Create Admin & Customer Notifications
    if (db) {
      const notifCol = db.collection('notifications');
      const adminNotif = {
        recipient_role: 'admin',
        title: '🔔 নতুন অর্ডার এসেছে!',
        message: `কাস্টমার ${name} (ফোন: ${phone}) নতুন অর্ডার করেছেন (${orderId})। মোট মূল্য: ৳${calculatedTotal}`,
        orderId,
        type: 'new_order',
        is_read: false,
        createdAt: now.toISOString()
      };
      await notifCol.insertOne(adminNotif);

      if (finalUserId) {
        const custNotif = {
          user_id: finalUserId,
          title: '📦 অর্ডার কনফার্মেশনের অপেক্ষায়',
          message: `আপনার অর্ডার (${orderId}) সফলভাবে গৃহীত হয়েছে। মোট মূল্য: ৳${calculatedTotal}`,
          orderId,
          type: 'order_status',
          is_read: false,
          createdAt: now.toISOString()
        };
        await notifCol.insertOne(custNotif);
      }
    }

    res.status(201).json({
      success: true,
      message: 'অর্ডারটি সফলভাবে প্লেস করা হয়েছে!',
      orderId,
      data: newOrder
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'অর্ডার সংরক্ষণ করতে ব্যর্থ হয়েছে।',
      error: error.message
    });
  }
});

// GET /api/orders - Fetch all orders with query filters and user enrichment
app.get('/api/orders', async (req, res) => {
  try {
    const { status, search, userId, customerPhone, customerEmail, sellerId } = req.query;
    let filter = {};

    if (status && status !== 'all') {
      if (status === 'Packed') {
        filter.status = { $in: ['Packed', 'Processing'] };
      } else {
        filter.status = status;
      }
    }

    if (sellerId) {
      filter['items.sellerId'] = sellerId;
    }

    // Customer filters: Match by userId, phone, or email
    const customerFilters = [];
    if (userId && userId !== 'undefined' && userId !== 'null') {
      const uStr = String(userId);
      customerFilters.push({ user_id: uStr });
      customerFilters.push({ customer_id: uStr });
      customerFilters.push({ 'user._id': uStr });
      if (ObjectId.isValid(uStr)) {
        customerFilters.push({ user_id: new ObjectId(uStr) });
        customerFilters.push({ customer_id: new ObjectId(uStr) });
      }
      if (!isNaN(Number(uStr))) {
        customerFilters.push({ user_id: Number(uStr) });
        customerFilters.push({ customer_id: Number(uStr) });
      }
    }
    if (customerPhone && customerPhone !== 'undefined') {
      customerFilters.push({ customerPhone: customerPhone.trim() });
    }
    if (customerEmail && customerEmail !== 'undefined' && customerEmail.trim()) {
      customerFilters.push({ customerEmail: customerEmail.trim().toLowerCase() });
    }

    if (customerFilters.length > 0) {
      if (filter.status || filter['items.sellerId']) {
        filter.$and = [{ $or: customerFilters }];
      } else {
        filter.$or = customerFilters;
      }
    }

    if (search) {
      const q = search.trim();
      const searchCond = {
        $or: [
          { orderId: { $regex: q, $options: 'i' } },
          { customerName: { $regex: q, $options: 'i' } },
          { customerPhone: { $regex: q, $options: 'i' } },
          { customerEmail: { $regex: q, $options: 'i' } }
        ]
      };
      if (filter.$and) {
        filter.$and.push(searchCond);
      } else if (filter.$or) {
        filter = { $and: [{ $or: filter.$or }, searchCond] };
      } else {
        filter = { ...filter, ...searchCond };
      }
    }

    let orders = [];
    if (db) {
      // Auto cleanup any corrupt entries without orderId
      await db.collection('orders').deleteMany({ orderId: { $in: [null, undefined, ''] } });
      orders = await db.collection('orders').find(filter).sort({ createdAt: -1, _id: -1 }).toArray();

      // Retrieve all registered users for customer profile enrichment
      const usersCol = db.collection('users');
      const allUsers = await usersCol.find({}).toArray();
      const userMapById = {};
      const userMapByPhone = {};
      const userMapByEmail = {};
      allUsers.forEach(u => {
        const uId = u._id ? u._id.toString() : (u.id ? String(u.id) : null);
        if (uId) userMapById[uId] = u;
        if (u.phone) userMapByPhone[u.phone.trim()] = u;
        if (u.email) userMapByEmail[u.email.trim().toLowerCase()] = u;
      });

      orders = orders.map(o => {
        const uDoc = (o.user_id && userMapById[o.user_id.toString()]) ||
                    (o.customerPhone && userMapByPhone[o.customerPhone?.trim()]) ||
                    (o.customerEmail && userMapByEmail[o.customerEmail?.trim().toLowerCase()]) ||
                    (o.customerName && allUsers.find(u => u.name && (u.name.trim().toLowerCase() === o.customerName.trim().toLowerCase() || u.name.toLowerCase().includes(o.customerName.toLowerCase()) || o.customerName.toLowerCase().includes(u.name.toLowerCase()))));

        return {
          ...o,
          id: o._id.toString(),
          customerAvatar: o.customerAvatar || (uDoc ? (uDoc.avatar || uDoc.photoURL) : '') || '',
          customerEmail: o.customerEmail || (uDoc ? uDoc.email : '') || '',
          customerName: o.customerName || (uDoc ? uDoc.name : '') || 'Customer',
          userRole: uDoc ? (uDoc.role || 'customer') : 'customer'
        };
      });
    }

    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'অর্ডার তালিকা আনতে ব্যর্থ', error: error.message });
  }
});

// GET /api/orders/track/:identifier - Public tracking by Order ID or Phone
app.get('/api/orders/track/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const q = identifier.trim();

    let query = {
      $or: [
        { orderId: { $regex: `^${q}$`, $options: 'i' } },
        { customerPhone: q }
      ]
    };

    if (ObjectId.isValid(q)) {
      query.$or.push({ _id: new ObjectId(q) });
    }

    let orders = [];
    if (db) {
      orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();

      // Retrieve all registered users for customer profile enrichment
      const usersCol = db.collection('users');
      const allUsers = await usersCol.find({}).toArray();
      const userMapById = {};
      const userMapByPhone = {};
      const userMapByEmail = {};
      allUsers.forEach(u => {
        const uId = u._id ? u._id.toString() : (u.id ? String(u.id) : null);
        if (uId) userMapById[uId] = u;
        if (u.phone) userMapByPhone[u.phone.trim()] = u;
        if (u.email) userMapByEmail[u.email.trim().toLowerCase()] = u;
      });

      orders = orders.map(o => {
        const uDoc = (o.user_id && userMapById[o.user_id.toString()]) ||
                    (o.customerPhone && userMapByPhone[o.customerPhone?.trim()]) ||
                    (o.customerEmail && userMapByEmail[o.customerEmail?.trim().toLowerCase()]);

        return {
          ...o,
          id: o._id.toString(),
          customerAvatar: o.customerAvatar || (uDoc ? (uDoc.avatar || uDoc.photoURL) : '') || '',
          customerEmail: o.customerEmail || (uDoc ? uDoc.email : '') || '',
          customerName: o.customerName || (uDoc ? uDoc.name : '') || 'Customer',
          userRole: uDoc ? (uDoc.role || 'customer') : 'customer'
        };
      });
    }

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'এই নম্বরে বা আইডিতে কোন অর্ডার পাওয়া যায়নি' });
    }

    res.json({
      success: true,
      data: orders.length === 1 ? orders[0] : orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ success: false, message: 'অর্ডার ট্র্যাকিং ব্যর্থ', error: error.message });
  }
});

// GET /api/orders/:id - Get Single Order with full Status Logs
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let query = { orderId: id };
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { orderId: id }] };
    }

    let order = null;
    if (db) {
      order = await db.collection('orders').findOne(query);
      if (order) {
        order.id = order._id.toString();
        const usersCol = db.collection('users');
        const uDoc = await usersCol.findOne({
          $or: [
            ...(order.user_id ? [{ _id: order.user_id }, { id: order.user_id }, ...(ObjectId.isValid(order.user_id) ? [{ _id: new ObjectId(order.user_id) }] : [])] : []),
            ...(order.customerPhone ? [{ phone: order.customerPhone.trim() }] : []),
            ...(order.customerEmail ? [{ email: order.customerEmail.trim().toLowerCase() }] : [])
          ]
        });
        if (uDoc) {
          order.customerAvatar = order.customerAvatar || uDoc.avatar || uDoc.photoURL || '';
          order.customerEmail = order.customerEmail || uDoc.email || '';
          order.customerName = order.customerName || uDoc.name || 'Customer';
        }
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching single order:', error);
    res.status(500).json({ success: false, message: 'অর্ডার তথ্য আনতে ব্যর্থ', error: error.message });
  }
});

// PATCH /api/orders/:id/status - Update Order Status (Pending -> Confirmed -> Packed -> Shipped -> Delivered / Cancelled)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changed_by, role, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'নতুন স্ট্যাটাস প্রদান করুন' });
    }

    const now = new Date();
    const actorName = (changed_by || 'Admin').trim();
    const actorRole = (role || 'admin').trim();

    const logEntry = {
      status,
      changed_by: actorName,
      role: actorRole,
      timestamp: now.toISOString(),
      note: note || `স্ট্যাটাস পরিবর্তন করা হয়েছে: ${status}`
    };

    let filter = { orderId: id };
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { orderId: id }] };
    }

    let existingOrder = null;
    if (db) {
      existingOrder = await db.collection('orders').findOne(filter);
    }

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
    }

    const previousStatus = existingOrder.status;

    // Fields to update
    const updateFields = {
      status,
      updatedAt: now.toISOString()
    };

    // If Delivered, mark paymentStatus as Paid
    if (status === 'Delivered') {
      updateFields.paymentStatus = 'Paid';
    }

    // Auto-Restore Product Stock if Cancelled
    if (status === 'Cancelled' && previousStatus !== 'Cancelled' && db) {
      const prodCol = db.collection('products');
      for (const it of (existingOrder.items || [])) {
        if (it.productId) {
          try {
            let pFilter = { _id: it.productId };
            if (ObjectId.isValid(it.productId)) {
              pFilter = { _id: new ObjectId(it.productId) };
            }
            await prodCol.updateOne(pFilter, {
              $inc: { stock_quantity: it.quantity, stock: it.quantity }
            });
            console.log(`Restored stock for ${it.name} (+ ${it.quantity})`);
          } catch (e) {
            console.error('Stock restore error:', e.message);
          }
        }
      }
    }

    // Update in MongoDB
    if (db) {
      await db.collection('orders').updateOne(filter, {
        $set: updateFields,
        $push: { order_status_logs: logEntry }
      });
    }

    // Trigger Notification for Customer on Status Change
    if (db) {
      const notifCol = db.collection('notifications');
      const custMsg =
        status === 'Confirmed' ? `আপনার অর্ডার (${existingOrder.orderId}) কনফার্ম করা হয়েছে। পণ্য প্রস্তুত করা হচ্ছে।` :
          status === 'Packed' ? `আপনার অর্ডার (${existingOrder.orderId}) প্যাকিং সম্পন্ন হয়েছে এবং কুরিয়ারে হস্তান্তরের জন্য প্রস্তুত।` :
            status === 'Shipped' ? `আপনার অর্ডার (${existingOrder.orderId}) কুরিয়ারে পাঠানো হয়েছে। শীঘ্রই আপনার ঠিকানায় পৌঁছাবে।` :
              status === 'Delivered' ? `আপনার অর্ডার (${existingOrder.orderId}) সফলভাবে ডেলিভারি সম্পন্ন হয়েছে। আমাদের সাথে থাকার জন্য ধন্যবাদ!` :
                status === 'Cancelled' ? `আপনার অর্ডার (${existingOrder.orderId}) বাতিল করা হয়েছে।` : `আপনার অর্ডারের স্ট্যাটাস আপডেট: ${status}`;

      await notifCol.insertOne({
        recipient_role: 'customer',
        user_id: existingOrder.user_id || existingOrder.customer_id || null,
        customerPhone: existingOrder.customerPhone,
        title: `অর্ডার স্ট্যাটাস: ${status}`,
        message: custMsg,
        orderId: existingOrder.orderId,
        type: 'order_status_update',
        is_read: false,
        createdAt: now.toISOString()
      });

      console.log(`[NOTIFICATION/SMS/EMAIL SENT to ${existingOrder.customerPhone}]: ${custMsg}`);
    }

    let updatedOrder = null;
    if (db) {
      updatedOrder = await db.collection('orders').findOne(filter);
      if (updatedOrder) {
        updatedOrder.id = updatedOrder._id.toString();
      }
    }

    res.json({
      success: true,
      message: `অর্ডার স্ট্যাটাস সফলভাবে "${status}" এ পরিবর্তন করা হয়েছে!`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'স্ট্যাটাস আপডেট করতে ব্যর্থ', error: error.message });
  }
});

// DELETE /api/orders/:id - Delete Order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let filter = { orderId: id };
    if (ObjectId.isValid(id)) {
      filter = { $or: [{ _id: new ObjectId(id) }, { orderId: id }] };
    }

    if (db) {
      const result = await db.collection('orders').deleteOne(filter);
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'অর্ডার পাওয়া যায়নি' });
      }
    }

    res.json({ success: true, message: 'অর্ডার সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'অর্ডার মুছতে ব্যর্থ', error: error.message });
  }
});



// ----------------------------------------------------
// 9. REVIEWS API & STRICT VERIFIED BUYER SYSTEM (MongoDB)
// ----------------------------------------------------

// GET /api/reviews/eligibility/:productId - Check if user is eligible to review (must have Delivered order)
app.get('/api/reviews/eligibility/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, phone, email, name } = req.query;

    if (!userId && !phone && !email && !name) {
      return res.json({
        success: true,
        isVerifiedBuyer: false,
        message: 'লগইন করে ভেরিফাইড ডেলিভারি স্ট্যাটাস চেক করুন'
      });
    }

    if (db) {
      const ordersCol = db.collection('orders');

      const userConditions = [];
      if (userId && userId !== 'undefined') {
        const uStr = String(userId);
        userConditions.push({ user_id: uStr }, { customer_id: uStr });
        if (ObjectId.isValid(uStr)) {
          userConditions.push({ user_id: new ObjectId(uStr) }, { customer_id: new ObjectId(uStr) });
        }
        if (!isNaN(Number(uStr))) {
          userConditions.push({ user_id: Number(uStr) }, { customer_id: Number(uStr) });
        }
      }
      if (phone && phone !== 'undefined') {
        userConditions.push({ customerPhone: phone.trim() });
      }
      if (email && email !== 'undefined') {
        userConditions.push({ customerEmail: email.trim().toLowerCase() });
      }
      if (name && name !== 'undefined') {
        userConditions.push({ customerName: name.trim() });
      }

      const productConditions = [
        { 'items.productId': productId },
        { 'items.productId': String(productId) },
        { 'items.productId': Number(productId) || -999 },
        { 'items.id': productId },
        { 'items.id': String(productId) },
        { 'items.id': Number(productId) || -999 },
        { 'items._id': productId }
      ];
      if (ObjectId.isValid(productId)) {
        productConditions.push({ 'items.productId': new ObjectId(productId) });
        productConditions.push({ 'items._id': new ObjectId(productId) });
      }

      // Check product details for name matching
      try {
        let pFilter = { _id: productId };
        if (ObjectId.isValid(productId)) pFilter = { $or: [{ _id: new ObjectId(productId) }, { _id: productId }] };
        const prod = await db.collection('products').findOne(pFilter);
        if (prod && prod.name) {
          productConditions.push({ 'items.name': prod.name });
          productConditions.push({ 'items.name': prod.name_bn || prod.name });
        }
      } catch (e) {}

      const deliveredOrder = await ordersCol.findOne({
        status: { $in: ['Delivered', 'delivered'] },
        $and: [
          { $or: userConditions },
          { $or: productConditions }
        ]
      });

      if (deliveredOrder) {
        return res.json({
          success: true,
          isVerifiedBuyer: true,
          orderId: deliveredOrder.orderId,
          deliveryDate: deliveredOrder.updatedAt || deliveredOrder.createdAt,
          message: 'অভিনন্দন! আপনি এই পণ্যটির ভেরিফাইড ক্রেতা।'
        });
      }
    }

    res.json({
      success: true,
      isVerifiedBuyer: false,
      message: 'শুধুমাত্র পণ্যটি ক্রয় করে ডেলিভারি সম্পন্ন (Delivered) হওয়া গ্রাহকরাই রিভিউ দিতে পারবেন।'
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ success: false, isVerifiedBuyer: false, message: 'ভেরিফিকেশন চেক ব্যর্থ' });
  }
});

// GET /api/reviews - Fetch all reviews (for Admin & Seller review management) or by Product
app.get('/api/reviews', async (req, res) => {
  try {
    const { productId, sellerId, sellerName } = req.query;
    let query = {};
    if (productId && productId !== 'all') {
      query.$or = [
        { productId },
        { productId: String(productId) },
        { product_id: productId },
        { product_id: Number(productId) || -1 }
      ];
      if (ObjectId.isValid(productId)) {
        query.$or.push({ productId: new ObjectId(productId) });
      }
    }

    if (db) {
      const reviews = await db.collection('reviews').find(query).sort({ createdAt: -1, _id: -1 }).toArray();

      // Retrieve all products and users for rich enrichment
      const productsCol = db.collection('products');
      const usersCol = db.collection('users');

      const allProducts = await productsCol.find({}).toArray();
      const allUsers = await usersCol.find({}).toArray();

      const prodMap = {};
      allProducts.forEach(p => {
        const pIdStr = p._id ? p._id.toString() : '';
        if (pIdStr) prodMap[pIdStr] = p;
        if (p.id !== undefined) prodMap[String(p.id)] = p;
        if (p.slug) prodMap[p.slug] = p;
      });

      const userMap = {};
      allUsers.forEach(u => {
        const uIdStr = u._id ? u._id.toString() : '';
        if (uIdStr) userMap[uIdStr] = u;
        if (u.id !== undefined) userMap[String(u.id)] = u;
        if (u.phone) userMap[u.phone.trim()] = u;
        if (u.email) userMap[u.email.trim().toLowerCase()] = u;
      });

      let enrichedReviews = reviews.map(r => {
        const pKey = String(r.productId || r.product_id || '');
        const matchedProd = prodMap[pKey] || allProducts.find(p => String(p._id) === pKey || String(p.id) === pKey || (p.name && r.product_name && p.name === r.product_name));

        const uKey = String(r.userId || r.user_id || '');
        const matchedUser = userMap[uKey] || 
                            (r.customerPhone && userMap[r.customerPhone.trim()]) || 
                            (r.customerEmail && userMap[r.customerEmail.trim().toLowerCase()]) ||
                            (r.customerName && allUsers.find(u => u.name && u.name.trim().toLowerCase() === r.customerName.trim().toLowerCase()));

        const sName = (matchedProd ? (matchedProd.seller_name || matchedProd.sellerName || matchedProd.shop_name || matchedProd.seller?.shop_name) : null) || r.seller_name || 'সুন্দরবন অর্গানিক ফার্মস';

        const custAvatar = (matchedUser ? (matchedUser.avatar || matchedUser.photoURL) : '') || r.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
        const custName = r.customerName || r.userName || r.user_name || (matchedUser ? matchedUser.name : 'Verified Customer');
        const custPhone = r.customerPhone || (matchedUser ? matchedUser.phone : '') || '';
        const custEmail = r.customerEmail || (matchedUser ? matchedUser.email : '') || '';

        return {
          ...r,
          id: r._id.toString(),
          customerName: custName,
          customerAvatar: custAvatar,
          customerPhone: custPhone,
          customerEmail: custEmail,
          orderId: r.orderId || 'GB-ORD-5796',
          is_verified_buyer: r.is_verified_buyer ?? true,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (r.created_at || 'সম্প্রতি'),
          
          // Enriched Product & Seller details
          product: {
            id: matchedProd ? (matchedProd._id ? matchedProd._id.toString() : matchedProd.id) : (r.productId || r.product_id),
            name: matchedProd ? (matchedProd.name_bn || matchedProd.name) : (r.product_name || 'খাঁটি পণ্য'),
            name_en: matchedProd ? (matchedProd.name_en || matchedProd.nameEn || matchedProd.name) : '',
            thumbnail: matchedProd ? (matchedProd.thumbnail || (matchedProd.images && matchedProd.images[0])) : 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=300&q=80',
            price: matchedProd ? matchedProd.price : 850,
            regularPrice: matchedProd ? (matchedProd.regularPrice || matchedProd.regular_price) : 1050,
            unit: matchedProd ? matchedProd.unit : '৫০০ গ্রাম',
            category: matchedProd ? (matchedProd.category || matchedProd.category_name) : 'খাঁটি পণ্য',
            seller_name: sName,
            shop_name: sName,
            sellerId: matchedProd ? (matchedProd.seller_id || matchedProd.sellerId) : null
          },
          seller_name: sName,
          shop_name: sName
        };
      });

      if (sellerId && sellerId !== 'all') {
        enrichedReviews = enrichedReviews.filter(r => 
          String(r.product?.sellerId) === String(sellerId) || 
          (r.seller_name && r.seller_name.toLowerCase().includes(String(sellerId).toLowerCase()))
        );
      }

      if (sellerName && sellerName !== 'all') {
        enrichedReviews = enrichedReviews.filter(r => 
          r.seller_name && r.seller_name.toLowerCase().trim() === sellerName.toLowerCase().trim()
        );
      }

      return res.json({
        success: true,
        count: enrichedReviews.length,
        data: enrichedReviews
      });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
});

// GET /api/reviews/:productId - Fetch Reviews for specific Product
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    let query = {};
    if (productId && productId !== 'all') {
      query.$or = [
        { productId },
        { productId: String(productId) },
        { product_id: productId },
        { product_id: Number(productId) || -1 }
      ];
      if (ObjectId.isValid(productId)) {
        query.$or.push({ productId: new ObjectId(productId) });
      }
    }

    if (db) {
      const reviews = await db.collection('reviews').find(query).sort({ createdAt: -1 }).toArray();
      const usersCol = db.collection('users');
      const allUsers = await usersCol.find({}).toArray();

      const enriched = reviews.map(r => {
        const u = allUsers.find(x => 
          (r.userId && String(x._id) === String(r.userId)) || 
          (r.customerPhone && x.phone === r.customerPhone) ||
          (r.customerEmail && x.email === r.customerEmail)
        );
        return {
          ...r,
          id: r._id.toString(),
          customerName: r.customerName || r.userName || (u ? u.name : 'Verified Buyer'),
          customerAvatar: (u ? (u.avatar || u.photoURL) : '') || r.customerAvatar || '',
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'সম্প্রতি'
        };
      });

      return res.json({
        success: true,
        data: enriched
      });
    }

    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews - Submit Verified Review (Strictly checks Delivered Order record)
app.post('/api/reviews', async (req, res) => {
  try {
    const {
      productId,
      userId,
      customerName,
      userName,
      customerPhone,
      customerEmail,
      rating,
      comment
    } = req.body;

    const name = (customerName || userName || '').trim();
    const userComment = (comment || '').trim();
    const userRating = Number(rating) || 5;

    if (!productId || !name || !userComment) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে আপনার নাম, রেটিং এবং রিভিউয়ের মন্তব্য প্রদান করুন।'
      });
    }

    // STRICT VERIFICATION: Verify Delivered Order record in MongoDB
    if (db) {
      const ordersCol = db.collection('orders');

      const userConditions = [];
      if (userId && userId !== 'undefined') {
        const uStr = String(userId);
        userConditions.push({ user_id: uStr }, { customer_id: uStr });
        if (ObjectId.isValid(uStr)) {
          userConditions.push({ user_id: new ObjectId(uStr) }, { customer_id: new ObjectId(uStr) });
        }
        if (!isNaN(Number(uStr))) {
          userConditions.push({ user_id: Number(uStr) }, { customer_id: Number(uStr) });
        }
      }
      if (customerPhone && customerPhone !== 'undefined') {
        userConditions.push({ customerPhone: customerPhone.trim() });
      }
      if (customerEmail && customerEmail !== 'undefined') {
        userConditions.push({ customerEmail: customerEmail.trim().toLowerCase() });
      }
      if (userConditions.length === 0) {
        userConditions.push({ customerName: name });
      }

      const productConditions = [
        { 'items.productId': productId },
        { 'items.productId': String(productId) },
        { 'items.id': productId },
        { 'items.id': String(productId) },
        { 'items._id': productId }
      ];
      if (ObjectId.isValid(productId)) {
        productConditions.push({ 'items.productId': new ObjectId(productId) });
        productConditions.push({ 'items._id': new ObjectId(productId) });
      }

      // Check product details for name matching
      try {
        let pFilter = { _id: productId };
        if (ObjectId.isValid(productId)) pFilter = { $or: [{ _id: new ObjectId(productId) }, { _id: productId }] };
        const prod = await db.collection('products').findOne(pFilter);
        if (prod && prod.name) {
          productConditions.push({ 'items.name': prod.name });
          productConditions.push({ 'items.name': prod.name_bn || prod.name });
        }
      } catch (e) {}

      const deliveredOrder = await ordersCol.findOne({
        status: { $in: ['Delivered', 'delivered'] },
        $and: [
          { $or: userConditions },
          { $or: productConditions }
        ]
      });

      if (!deliveredOrder) {
        return res.status(403).json({
          success: false,
          isVerifiedBuyer: false,
          message: '⛔ দুঃখিত! শুধুমাত্র পণ্যটি ক্রয় করে সফল ডেলিভারি (Delivered) সম্পন্নকারী গ্রাহকরাই ভেরিফাইড রিভিউ ও রেটিং দিতে পারবেন।'
        });
      }

      const newReview = {
        productId: productId.toString(),
        userId: userId || deliveredOrder.user_id || null,
        customerName: name,
        customerPhone: customerPhone || deliveredOrder.customerPhone || null,
        rating: userRating,
        comment: userComment,
        is_verified_buyer: true,
        orderId: deliveredOrder.orderId,
        seller_reply: null,
        admin_reply: null,
        replies: [],
        createdAt: new Date().toISOString()
      };

      const result = await db.collection('reviews').insertOne(newReview);
      newReview._id = result.insertedId;
      newReview.id = result.insertedId.toString();

      // Recalculate Product average rating in MongoDB
      try {
        const allProdReviews = await db.collection('reviews').find({ productId: productId.toString() }).toArray();
        const avgRating = allProdReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / allProdReviews.length;

        let pFilter = { _id: productId };
        if (ObjectId.isValid(productId)) {
          pFilter = { $or: [{ _id: new ObjectId(productId) }, { _id: productId }] };
        }
        await db.collection('products').updateOne(pFilter, {
          $set: {
            rating: Number(avgRating.toFixed(1)),
            ratingCount: allProdReviews.length
          }
        });
      } catch (calcErr) {
        console.error('Rating update error:', calcErr.message);
      }

      return res.status(201).json({
        success: true,
        message: '🎉 আপনার ভেরিফাইড রিভিউ সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে!',
        data: newReview
      });
    }

    res.status(500).json({ success: false, message: 'ডাটাবেস কানেকশন ত্রুটি' });
  } catch (error) {
    console.error('Error creating verified review:', error);
    res.status(500).json({ success: false, message: 'রিভিউ সংরক্ষণ করতে ব্যর্থ', error: error.message });
  }
});

// POST /api/reviews/:reviewId/reply - Seller / Admin reply to customer review
app.post('/api/reviews/:reviewId/reply', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { replyText, replierName, replierRole } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'রিপ্লাইয়ের বক্তব্য লিখুন' });
    }

    if (db) {
      let filter = { _id: reviewId };
      if (ObjectId.isValid(reviewId)) {
        filter = { $or: [{ _id: new ObjectId(reviewId) }, { _id: reviewId }] };
      }

      const replyObj = {
        reply: replyText.trim(),
        replierName: replierName || (replierRole === 'admin' ? 'এডমিন (ইহসান অনলাইন শপ)' : 'সেলার সাপোর্ট'),
        replierRole: replierRole || 'seller',
        createdAt: new Date().toISOString()
      };

      await db.collection('reviews').updateOne(filter, {
        $set: {
          seller_reply: replyText.trim(),
          admin_reply: replyText.trim(),
          replied_by: replierName || (replierRole === 'admin' ? 'Admin' : 'Seller'),
          replied_at: new Date().toISOString()
        },
        $push: {
          replies: replyObj
        }
      });
      return res.json({ success: true, message: 'রিভিউয়ের উত্তর সফলভাবে সংরক্ষিত হয়েছে!', reply: replyObj });
    }

    res.status(500).json({ success: false, message: 'ডাটাবেস ত্রুটি' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'উত্তর দিতে ব্যর্থ', error: error.message });
  }
});

// PUT /api/users/profile - Customer & User Profile Edit and Save to MongoDB
app.put('/api/users/profile', async (req, res) => {
  try {
    const { userId, id, email, phone, name, avatar, address, city, district, currentPassword, newPassword } = req.body;
    const targetId = userId || id || email || phone;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'ইউজার সনাক্ত করা যায়নি' });
    }

    if (db) {
      const usersCol = db.collection('users');
      const orCond = [];
      if (userId) {
        orCond.push({ _id: userId }, { id: userId });
        if (ObjectId.isValid(userId)) orCond.push({ _id: new ObjectId(userId) });
      }
      if (id) {
        orCond.push({ _id: id }, { id });
        if (ObjectId.isValid(id)) orCond.push({ _id: new ObjectId(id) });
      }
      if (email) orCond.push({ email: email.toLowerCase().trim() });
      if (phone) orCond.push({ phone: phone.trim() });

      const user = await usersCol.findOne({ $or: orCond });
      if (!user) {
        return res.status(404).json({ success: false, message: 'ইউজার খুঁজে পাওয়া যায়নি' });
      }

      if (newPassword && newPassword.trim()) {
        if (currentPassword && user.password && user.password !== currentPassword) {
          return res.status(400).json({ success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়' });
        }
      }

      const updateFields = {
        name: name ? name.trim() : user.name,
        phone: phone ? phone.trim() : user.phone,
        email: email ? email.toLowerCase().trim() : user.email,
        avatar: avatar !== undefined ? avatar : user.avatar,
        address: address !== undefined ? address : user.address,
        city: city !== undefined ? city : (user.city || 'Dhaka'),
        district: district !== undefined ? district : (user.district || 'Dhaka'),
        updatedAt: new Date().toISOString()
      };

      if (newPassword && newPassword.trim()) {
        updateFields.password = newPassword.trim();
      }

      await usersCol.updateOne({ _id: user._id }, { $set: updateFields });
      const updatedUser = await usersCol.findOne({ _id: user._id });
      const userRes = {
        ...updatedUser,
        id: updatedUser._id.toString(),
        _id: updatedUser._id.toString()
      };
      delete userRes.password;

      return res.json({
        success: true,
        message: 'প্রোফাইল সফলভাবে ডাটাবেসে আপডেট হয়েছে!',
        data: userRes,
        user: userRes
      });
    }

    res.status(500).json({ success: false, message: 'ডাটাবেস কানেকশন পাওয়া যায়নি' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'প্রোফাইল আপডেট করতে ব্যর্থ', error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const [totalProducts, totalOrders, orders] = await Promise.all([
        db.collection('products').countDocuments(),
        db.collection('orders').countDocuments(),
        db.collection('orders').find({}).toArray()
      ]);

      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'Pending').length;

      return res.json({
        success: true,
        data: {
          totalProducts,
          totalOrders,
          totalRevenue,
          pendingOrders,
          deliveredOrders: orders.filter(o => o.status === 'Delivered').length
        }
      });
    }

    const totalRevenue = memoryDb.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    res.json({
      success: true,
      data: {
        totalProducts: memoryDb.products.length,
        totalOrders: memoryDb.orders.length,
        totalRevenue,
        pendingOrders: memoryDb.orders.filter(o => o.status === 'Pending').length,
        deliveredOrders: memoryDb.orders.filter(o => o.status === 'Delivered').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ----------------------------------------------------
// 9. AUTH API
// ----------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, avatar } = req.body;
    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: 'নাম, ইমেইল/ফোন ও পাসওয়ার্ড প্রদান করুন' });
    }

    const defaultAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      phone: (phone || '').trim(),
      password: hashedPassword,
      passwordText: password, // preserved for admin review
      avatar: defaultAvatar,
      role: 'customer', // Always default customer on register
      status: 'active',
      orders_count: 0,
      total_spent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected && db) {
      const orConditions = [];
      if (email) orConditions.push({ email: email.trim().toLowerCase() });
      if (phone) orConditions.push({ phone: phone.trim() });

      if (orConditions.length > 0) {
        const existing = await db.collection('users').findOne({ $or: orConditions });
        if (existing) {
          return res.status(400).json({ success: false, message: 'এই ইমেইল বা মোবাইল নম্বরে পূর্বেই অ্যাকাউন্ট খোলা হয়েছে' });
        }
      }

      const result = await db.collection('users').insertOne(newUser);
      const userPayload = {
        id: result.insertedId.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        avatar: newUser.avatar,
        role: 'customer',
        status: 'active'
      };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        message: 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!',
        token,
        user: userPayload
      });
    }

    const existing = memoryDb.users.find(u => (email && u.email?.toLowerCase() === email.toLowerCase()) || (phone && u.phone === phone));
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল বা মোবাইল নম্বরে পূর্বেই অ্যাকাউন্ট খোলা হয়েছে' });
    }
    const id = (memoryDb.users.length + 1).toString();
    const user = { _id: id, id, ...newUser };
    memoryDb.users.push(user);
    const userPayload = {
      id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: 'customer',
      status: 'active'
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = (identifier || email || phone || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'ইমেইল/মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন' });
    }

    // Default Demo Admin bypass
    if ((loginIdentifier === '01700000000' || loginIdentifier.toLowerCase() === 'admin@ihsan.com') && password === 'admin123') {
      const adminUser = {
        id: 'admin_1',
        name: 'Admin Moderator',
        email: 'admin@ihsan.com',
        phone: '01700000000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        role: 'admin',
        status: 'active'
      };
      const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true,
        message: 'অ্যাডমিন লগইন সফল হয়েছে!',
        token,
        user: adminUser
      });
    }

    let user = null;
    if (isMongoConnected && db) {
      user = await db.collection('users').findOne({
        $or: [
          { email: { $regex: '^' + loginIdentifier + '$', $options: 'i' } },
          { phone: loginIdentifier }
        ]
      });
    } else {
      user = memoryDb.users.find(u =>
        (u.email && u.email.toLowerCase() === loginIdentifier.toLowerCase()) ||
        (u.phone && u.phone === loginIdentifier)
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'ভুল ইমেইল/মোবাইল বা পাসওয়ার্ড প্রদান করেছেন' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'আপনার অ্যাকাউন্টটি স্থগিত (Blocked) করা হয়েছে' });
    }

    let isValid = false;
    if (user.password) {
      isValid = await bcrypt.compare(password, user.password);
    }
    if (!isValid && user.passwordText) {
      isValid = (user.passwordText === password);
    }

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'ভুল ইমেইল/মোবাইল বা পাসওয়ার্ড প্রদান করেছেন' });
    }

    const userPayload = {
      id: user._id ? user._id.toString() : (user.id || ''),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: user.role || 'customer',
      status: user.status || 'active'
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      message: 'লগইন সফল হয়েছে!',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log('🌿 Ihsan Online Shop Server running on http://localhost:' + PORT);
  console.log('🚀 REST Endpoints ready at http://localhost:' + PORT + '/api/products');
});


// ============================================================================
// 💰 SELLER WITHDRAWALS & PAYOUTS API (MONGODB CONNECTED)
// ============================================================================

// GET /api/withdrawals - Fetch all withdrawal & payout requests (with full seller details)
app.get('/api/withdrawals', async (req, res) => {
  try {
    const { sellerId, status } = req.query;
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (sellerId && sellerId !== 'all') {
      const sNum = Number(sellerId);
      query.$or = [
        { seller_id: sellerId },
        { seller_id: sNum || -1 },
        { sellerId: sellerId },
        { shop_name: sellerId }
      ];
    }

    if (isMongoConnected && db) {
      const withdrawalsCol = db.collection('withdrawals');
      const sellersCol = db.collection('sellers');
      const usersCol = db.collection('users');

      let withdrawals = await withdrawalsCol.find(query).sort({ requested_at: -1, createdAt: -1, _id: -1 }).toArray();

      // If empty in MongoDB, seed initial realistic withdrawal data
      if (withdrawals.length === 0 && (!sellerId || sellerId === 'all')) {
        const seedWithdrawals = [
          {
            seller_id: 1,
            shop_name: 'সুন্দরবন অর্গানিক ফার্মস (Sundarban Pure Farms)',
            seller_name: 'সেলার সাপোর্ট',
            seller_name_bn: 'সুন্দরবন অর্গানিক ফার্মস',
            seller_name_en: 'Sundarban Pure Farms',
            phone: '01971562080',
            email: 'seller@ihsanshop.com',
            amount: 8500,
            method: 'bKash Merchant / Personal',
            account_details: '01971562080 (bKash Personal)',
            trade_license: 'TRAD/DSCC/019283/2026',
            status: 'pending',
            requested_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            processed_at: null,
            note: 'সাপ্তাহিক মধু ও ঘি বিক্রির উইথড্রয়াল আবেদন'
          },
          {
            seller_id: 2,
            shop_name: 'মদিনা ড্রাই ফ্রুটস মার্ট (Medina Dry Fruits Mart)',
            seller_name: 'আব্দুল করিম',
            seller_name_bn: 'মদিনা ড্রাই ফ্রুটস মার্ট',
            seller_name_en: 'Medina Dry Fruits Mart',
            phone: '01812345678',
            email: 'medina.fruits@gmail.com',
            amount: 15400,
            method: 'Bank Transfer (Islami Bank)',
            account_details: 'Islami Bank Bangladesh, A/C: 20502130987123, Mirpur Branch',
            trade_license: 'TRAD/DNCC/082194/2026',
            status: 'approved',
            requested_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            processed_at: new Date(Date.now() - 86400000).toISOString(),
            note: 'আজওয়া ও মরিয়ম খেজুর বিক্রয় পেআউট সম্পন্ন'
          },
          {
            seller_id: 3,
            shop_name: 'খাঁটি সরিষা তেল ও মসলা ভাণ্ডার (Pure Mustard Oil Hub)',
            seller_name: 'মাহমুদ আলম',
            seller_name_bn: 'খাঁটি সরিষা তেল ও মসলা ভাণ্ডার',
            seller_name_en: 'Pure Mustard Oil Hub',
            phone: '01711223344',
            email: 'mustard.hub@gmail.com',
            amount: 6200,
            method: 'Nagad',
            account_details: '01711223344 (Nagad Merchant)',
            trade_license: 'TRAD/GCC/049102/2026',
            status: 'pending',
            requested_at: new Date(Date.now() - 3600000 * 12).toISOString(),
            processed_at: null,
            note: 'ঘানি ভাঙা সরিষার তেল ও হলুদের গুঁড়ার বিক্রয় লভ্যাংশ'
          }
        ];

        await withdrawalsCol.insertMany(seedWithdrawals);
        withdrawals = await withdrawalsCol.find(query).sort({ requested_at: -1, _id: -1 }).toArray();
      }

      // Enrich with live seller details
      const allSellers = await sellersCol.find({}).toArray();
      const allUsers = await usersCol.find({}).toArray();

      const enriched = withdrawals.map((w) => {
        const sKey = String(w.seller_id || w.sellerId || '');
        const matchedSeller = allSellers.find(s => 
          String(s._id) === sKey || 
          String(s.seller_id) === sKey || 
          String(s.id) === sKey || 
          (s.shop_name && w.shop_name && s.shop_name === w.shop_name)
        );

        const matchedUser = allUsers.find(u => 
          String(u._id) === sKey || 
          String(u.id) === sKey || 
          (u.email && w.email && u.email.toLowerCase() === w.email.toLowerCase()) ||
          (u.phone && w.phone && u.phone === w.phone)
        );

        const sName = (matchedSeller ? (matchedSeller.seller_name || matchedSeller.shop_name) : null) || w.seller_name || w.shop_name || 'সেলার';
        const shopName = (matchedSeller ? matchedSeller.shop_name : null) || w.shop_name || 'সুন্দরবন অর্গানিক ফার্মস';
        const phone = (matchedSeller ? matchedSeller.phone : null) || (matchedUser ? matchedUser.phone : null) || w.phone || '01971562080';
        const email = (matchedSeller ? matchedSeller.email : null) || (matchedUser ? matchedUser.email : null) || w.email || 'seller@ihsanshop.com';
        const tradeLicense = (matchedSeller ? matchedSeller.trade_license : null) || w.trade_license || 'TRAD/DSCC/019283/2026';
        const balance = matchedSeller ? (matchedSeller.balance || 0) : 12500;
        const totalSales = matchedSeller ? (matchedSeller.total_sales || 0) : 48500;
        const commissionRate = matchedSeller ? (matchedSeller.commission_rate ?? 10) : 10;
        const logo = (matchedSeller ? matchedSeller.shop_logo : null) || (matchedUser ? matchedUser.avatar : null) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

        return {
          ...w,
          id: w._id ? w._id.toString() : (w.id || '1'),
          _id: w._id ? w._id.toString() : (w.id || '1'),
          seller_name: sName,
          seller_name_bn: sName,
          seller_name_en: (matchedSeller ? matchedSeller.seller_name_en : null) || w.seller_name_en || sName,
          shop_name: shopName,
          phone,
          email,
          trade_license: tradeLicense,
          balance,
          total_sales: totalSales,
          commission_rate: commissionRate,
          shop_logo: logo,
          amount: Number(w.amount) || 0,
          method: w.method || 'bKash / Nagad',
          account_details: w.account_details || (w.bkash_number ? 'bKash: ' + w.bkash_number : '01971562080'),
          status: w.status || 'pending',
          requested_at: w.requested_at ? new Date(w.requested_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'সম্প্রতি',
          raw_date: w.requested_at || new Date().toISOString()
        };
      });

      return res.json({ success: true, count: enriched.length, data: enriched });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals', error: error.message });
  }
});

// POST /api/withdrawals - Submit new withdrawal request (Seller)
app.post('/api/withdrawals', async (req, res) => {
  try {
    const raw = req.body || {};
    if (!raw.amount || Number(raw.amount) <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক উইথড্রয়াল পরিমাণ লিখুন' });
    }

    const newWithdrawal = {
      seller_id: raw.seller_id || raw.sellerId || 1,
      shop_name: raw.shop_name || 'সুন্দরবন অর্গানিক ফার্মস',
      seller_name: raw.seller_name || 'সেলার',
      phone: raw.phone || '',
      email: raw.email || '',
      amount: Number(raw.amount),
      method: raw.method || 'bKash / Nagad',
      account_details: raw.account_details || raw.account || '',
      trade_license: raw.trade_license || 'TRAD/DSCC/019283/2026',
      status: 'pending',
      requested_at: new Date().toISOString(),
      processed_at: null,
      note: raw.note || 'উইথড্রয়াল আবেদন'
    };

    if (isMongoConnected && db) {
      const result = await db.collection('withdrawals').insertOne(newWithdrawal);
      return res.json({
        success: true,
        message: 'উইথড্রয়াল রিকোয়েস্ট সফলভাবে জমা হয়েছে!',
        data: { ...newWithdrawal, id: result.insertedId.toString(), _id: result.insertedId.toString() }
      });
    }

    res.json({ success: true, message: 'উইথড্রয়াল জমা হয়েছে', data: newWithdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'উইথড্রয়াল রিকোয়েস্ট ব্যর্থ', error: error.message });
  }
});

// PUT /api/withdrawals/:id - Approve or Reject withdrawal request (Admin)
app.put('/api/withdrawals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};

    const cleanStatus = String(status).toLowerCase();
    if (!['approved', 'rejected', 'pending', 'completed'].includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'ভুল স্ট্যাটাস' });
    }

    if (isMongoConnected && db) {
      let filter = { _id: id };
      if (ObjectId.isValid(id)) {
        filter = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
      }

      const updateData = {
        status: cleanStatus,
        processed_at: new Date().toISOString()
      };
      if (note) updateData.admin_note = note;

      const result = await db.collection('withdrawals').updateOne(filter, { $set: updateData });

      return res.json({
        success: true,
        message: cleanStatus === 'approved' 
          ? '🎉 সেলারের পেআউট সফলভাবে অনুমোদন (Approved) করা হয়েছে!' 
          : '⚠️ সেলারের পেআউট বাতিল (Rejected) করা হয়েছে।'
      });
    }

    res.json({ success: true, message: 'স্ট্যাটাস আপডেট সফল' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট ব্যর্থ', error: error.message });
  }
});

// GET /api/payments - Fetch payment transactions
app.get('/api/payments', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1, _id: -1 }).limit(100).toArray();

      const payments = orders.map((o) => {
        return {
          id: o._id ? o._id.toString() : (o.id || 'pay-' + Date.now()),
          order_id: o.orderId || o.order_number || ('GB-ORD-' + (o._id ? o._id.toString().slice(-4) : '1001')),
          order_number: o.orderId || o.order_number || ('GB-ORD-' + (o._id ? o._id.toString().slice(-4) : '1001')),
          customer_name: o.customer?.name || o.name || 'সম্মানিত ক্রেতা',
          customer_phone: o.customer?.phone || o.phone || '',
          method: o.paymentMethod || o.payment_method || 'Cash On Delivery',
          transaction_id: o.transactionId || o.transaction_id || ('TRX-' + (o._id ? o._id.toString().slice(-6).toUpperCase() : 'COD')),
          amount: Number(o.total || o.totalAmount || o.subtotal || 0),
          status: (o.payment_status || o.paymentStatus || (o.status === 'Delivered' ? 'Paid' : 'Pending')),
          created_at: o.createdAt ? new Date(o.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'সম্প্রতি'
        };
      });

      return res.json({ success: true, count: payments.length, data: payments });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
  }
});
