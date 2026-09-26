require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ghorer_bazar_db';
const DB_NAME = process.env.DB_NAME || 'ghorer_bazar_db';
const JWT_SECRET = process.env.JWT_SECRET || 'ghorer_bazar_secret_super_key_2024';

// For Admin Login
// Phone: 01700000000
// Password: admin123

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Sample Initial Products for Ihsan Online Shop
const INITIAL_PRODUCTS = [
  {
    name: 'সুন্দরবন খলিসা ফুলের খাঁটি মধু',
    nameEn: 'Sundarban Kholisa Flower Honey',
    slug: 'sundarban-kholisa-flower-honey',
    category: 'মধু (Honey)',
    categorySlug: 'honey',
    description: 'সুন্দরবনের গভীর জঙ্গল থেকে প্রাকৃতিকভাবে সংগৃহীত ১০০% বিশুদ্ধ ও কোনো প্রকার ভেজাল মুক্ত কাঁচা খলিসা ফুলের খাঁটি মধু। এটি রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে ও শরীর সতেজ রাখে।',
    benefits: [
      'রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে',
      'কাশি ও ঠাণ্ডাজনিত সমস্যায় দ্রুত উপশম',
      'ত্বকের উজ্জ্বলতা ও সতেজতা বাড়াতে সহায়ক',
      'প্রাকৃতিক এনার্জি বুস্টার হিসেবে কাজ করে'
    ],
    price: 950,
    regularPrice: 1100,
    discountPercentage: 14,
    // images: [
    //   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
    //   'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80'
    // ],
    variants: [
      { weight: '500 gm', price: 500, regularPrice: 580 },
      { weight: '1 kg', price: 950, regularPrice: 1100 },
      { weight: '2 kg', price: 1850, regularPrice: 2150 }
    ],
    rating: 4.9,
    ratingCount: 142,
    stock: 85,
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    unit: 'kg',
    origin: 'সুন্দরবন, বাংলাদেশ'
  },
  {
    name: 'খাঁটি গাওয়া ঘি (প্রিমিয়াম কোয়ালিটি)',
    nameEn: 'Premium Pure Cow Ghee',
    slug: 'pure-cow-ghee-premium',
    category: 'ঘি (Ghee)',
    categorySlug: 'ghee',
    description: 'গ্রামের বিশ্বস্ত খামার থেকে খাঁটি গরুর দুধ সংগ্রহ করে ঐতিহ্যবাহী সনাতন পদ্ধতিতে জ্বাল দেওয়া সুস্বাদু ও সুগন্ধযুক্ত খাঁটি গাওয়া ঘি। কোনো কেমিক্যাল ও প্রিজারভেটিভ নেই।',
    benefits: [
      'হজমশক্তি বৃদ্ধিতে সহায়ক',
      'হাড় ও পেশীর দৃঢ়তা বৃদ্ধি করে',
      'শিশুদের স্মৃতিশক্তি ও দৈহিক বৃদ্ধিতে সাহায্য করে',
      'অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ ও রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে'
    ],
    price: 1350,
    regularPrice: 1500,
    discountPercentage: 10,
    // images: [
    //   'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    //   'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80'
    // ],
    variants: [
      { weight: '500 gm', price: 700, regularPrice: 800 },
      { weight: '1 kg', price: 1350, regularPrice: 1500 }
    ],
    rating: 5.0,
    ratingCount: 98,
    stock: 45,
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    unit: 'kg',
    origin: 'পাবনা, বাংলাদেশ'
  },
  {
    name: 'কাঠের ঘানি ভাঙা খাঁটি সরিষার তেল',
    nameEn: 'Cold Pressed Mustard Oil',
    slug: 'cold-pressed-mustard-oil',
    category: 'তেল (Oil)',
    categorySlug: 'oil',
    description: 'দেশি সেরা জাতের বাছাইকৃত সরিষা থেকে কাঠের ঘানিতে ভাঙানো শতভাগ খাঁটি সরিষার তেল। ঝাঁজালো ও পুষ্টিগুণে ভরপুর যা স্বাস্থ্যকর রান্নার জন্য আদর্শ।',
    benefits: [
      'হার্টের স্বাস্থ্য ভালো রাখতে সহায়ক',
      'ত্বক ও চুলের পুষ্টি যোগায়',
      'প্রাকৃতিক অ্যান্টিব্যাকটেরিয়াল উপাদান সমৃদ্ধ',
      'ঠাণ্ডা-কাশিতে মালিশের জন্য অত্যন্ত উপকারী'
    ],
    price: 360,
    regularPrice: 420,
    discountPercentage: 14,
    // images: [
    //   'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    //   'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
    // ],
    variants: [
      { weight: '1 Liter', price: 360, regularPrice: 420 },
      { weight: '2 Liter', price: 700, regularPrice: 820 },
      { weight: '5 Liter', price: 1700, regularPrice: 2000 }
    ],
    rating: 4.8,
    ratingCount: 215,
    stock: 120,
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    unit: 'Liter',
    origin: 'নাটোর, বাংলাদেশ'
  },
  {
    name: 'প্রিমিয়াম কালোজিরা মধু',
    nameEn: 'Premium Black Cumin Honey',
    slug: 'premium-black-cumin-honey',
    category: 'মধু (Honey)',
    categorySlug: 'honey',
    description: 'কালোজিরা ফুলের প্রাকৃতিক নির্যাস থেকে তৈরি অত্যন্ত পুষ্টিকর কালোজিরা মধু। সকল রোগের ওষুধ হিসেবে বিবেচিত কালোজিরার গুণ এতে বিদ্যমান।',
    benefits: [
      'রোগ প্রতিরোধ ক্ষমতা বহুগুণ বৃদ্ধি করে',
      'শ্বাসকষ্ট ও হাঁপানি নিয়ন্ত্রণে সহায়ক',
      'রক্তচাপ নিয়ন্ত্রণে রাখতে সাহায্য করে',
      'শারীরিক দুর্বলতা দূর করে শক্তি যোগায়'
    ],
    price: 1150,
    regularPrice: 1300,
    discountPercentage: 12,
    // images: [
    //   'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80'
    // ],
    variants: [
      { weight: '500 gm', price: 600, regularPrice: 680 },
      { weight: '1 kg', price: 1150, regularPrice: 1300 }
    ],
    rating: 4.9,
    ratingCount: 67,
    stock: 50,
    isFeatured: true,
    isBestSeller: false,
    isNew: true,
    unit: 'kg',
    origin: 'শরীয়তপুর, বাংলাদেশ'
  },
  {
    name: 'প্রাকৃতিক অর্গানিক সিয়া সিড (Chia Seeds)',
    nameEn: 'Organic Chia Seeds',
    slug: 'organic-chia-seeds',
    category: 'বাদাম ও বীজ (Nuts & Seeds)',
    categorySlug: 'nuts-seeds',
    description: 'উচ্চমানের পুষ্টিগুণ সম্পন্ন অর্গানিক চিয়া সিড যা ওমেগা-৩ ফ্যাটি এসিড, ফাইবার এবং প্রোটিনে ভরপুর। ওজন নিয়ন্ত্রণে অত্যন্ত কার্যকর।',
    benefits: [
      'ওজন কমাতে ও ডায়েটে অত্যন্ত কার্যকর',
      'প্রচুর পরিমাণ ওমেগা-৩ ও অ্যান্টিঅক্সিডেন্ট',
      'হজম প্রক্রিয়া সহজ করে',
      'রক্তে শর্করার মাত্রা নিয়ন্ত্রণে সাহায্য করে'
    ],
    price: 450,
    regularPrice: 550,
    discountPercentage: 18,
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { weight: '250 gm', price: 240, regularPrice: 300 },
      { weight: '500 gm', price: 450, regularPrice: 550 }
    ],
    rating: 4.7,
    ratingCount: 88,
    stock: 90,
    isFeatured: false,
    isBestSeller: true,
    isNew: false,
    unit: 'gm',
    origin: 'আমদানিকৃত'
  },
  {
    name: 'স্পেশাল মিক্সড ড্রাই ফ্রুটস ও নাটস (৯ উপাদান)',
    nameEn: 'Special Mixed Dry Fruits & Nuts',
    slug: 'special-mixed-dry-fruits-nuts',
    category: 'বাদাম ও বীজ (Nuts & Seeds)',
    categorySlug: 'nuts-seeds',
    description: 'কাজুবাদাম, কাঠবাদাম, পেস্তা বাদাম, আখরোট, কিশমিশ, খেজুর, শুকনো ডুমুরসহ ৯টি প্রিমিয়াম ড্রাই ফ্রুটস ও নাটের সুষম সংমিশ্রণ।',
    benefits: [
      'মস্তিষ্কের কার্যক্ষমতা ও স্মৃতিশক্তি বাড়ায়',
      'ভিটামিন ও মিনারেলসের ঘাটতি পূরণ করে',
      'ত্বক সুন্দর ও সতেজ রাখে',
      'শরীরের স্ট্যামিনা ও রোগ প্রতিরোধ শক্তি বৃদ্ধি করে'
    ],
    price: 850,
    regularPrice: 1050,
    discountPercentage: 19,
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { weight: '500 gm', price: 850, regularPrice: 1050 },
      { weight: '1 kg', price: 1650, regularPrice: 2000 }
    ],
    rating: 5.0,
    ratingCount: 160,
    stock: 65,
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    unit: 'kg',
    origin: 'আমদানিকৃত সেরা গ্রেড'
  }
];

const INITIAL_CATEGORIES = [
  { id: 'all', name: 'সব পণ্য', slug: 'all', icon: 'Sparkles', count: 24 },
  { id: 'honey', name: 'মধু (Honey)', slug: 'honey', icon: 'Flower', count: 6 },
  { id: 'ghee', name: 'ঘি (Ghee)', slug: 'ghee', icon: 'Milk', count: 4 },
  { id: 'oil', name: 'তেল (Oil)', slug: 'oil', icon: 'Droplets', count: 5 },
  { id: 'nuts-seeds', name: 'বাদাম ও বীজ', slug: 'nuts-seeds', icon: 'Nut', count: 8 },
  { id: 'spices', name: 'মসলা (Spices)', slug: 'spices', icon: 'Flame', count: 7 },
  { id: 'tea', name: 'চা ও পানীয়', slug: 'tea', icon: 'Coffee', count: 4 }
];

const INITIAL_BANNERS = [
  {
    id: 1,
    title: '১০০% খাঁটি ও প্রাকৃতিক খাদ্য পণ্য',
    subtitle: 'সুস্থ থাকুন, পরিবারের জন্য বেছে নিন বিশ্বস্ত ইহসান অনলাইন শপ',
    buttonText: 'অর্ডার করুন এখনই',
    link: '/products',
    badge: 'সেরা অর্গানিক ফুড প্ল্যাটফর্ম',
    bgGradient: 'from-emerald-900 via-emerald-800 to-teal-900',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    title: 'সুন্দরবনের খাঁটি মধু ও পাহাড়ি ঘি',
    subtitle: 'কোনো কেমিক্যাল নেই, কোনো প্রিজারভেটিভ নেই - শতভাগ নিরাপদ',
    buttonText: 'অফার দেখুন',
    link: '/products?category=honey',
    badge: 'সীমিত সময়ের অফার',
    bgGradient: 'from-amber-950 via-amber-900 to-yellow-950',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    title: 'কাঠের ঘানি ভাঙা খাঁটি সরিষার তেল',
    subtitle: 'ঐতিহ্যবাহী স্বাদে ও গন্ধে সমৃদ্ধ স্বাস্থ্যকর রান্নার একমাত্র সঙ্গী',
    buttonText: 'এখনই কিনুন',
    link: '/products?category=oil',
    badge: 'হট ডিল',
    bgGradient: 'from-teal-950 via-emerald-950 to-green-950',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80'
  }
];

// Initial Popup Notice for Palestine and Charity Relief
const INITIAL_POPUP = {
  isActive: true,
  title: 'ইহসান অনলাইন শপ',
  titleEn: 'Ihsan Online Shop',
  badge: '🇵🇸 ফিলিস্তিন ও মানবতার কল্যাণে অনুদান',
  badgeEn: '🇵🇸 Palestine & Humanity Relief Support',
  message: '‘ইহসান অনলাইন শপ’ এর ব্যবসায়িক লাভের কিছু অংশ ফিলিস্তিনের মাজলুম পরিবারের জন্য এবং অসহায় দুস্থদের সহায়তার জন্য ব্যয় করা হয়। তাই ‘ইহসান অনলাইন শপ’ এই ফ্যামিলির সাথে যুক্ত হয়ে অসহায় দুস্থদের সহায়তার জন্য পাশে থাকুন।',
  messageEn: 'A portion of the profits from "Ihsan Online Shop" is dedicated to supporting the oppressed families of Palestine and helping underprivileged people. Join the Ihsan Online Shop family and stand with humanity!',
  buttonText: 'কেনাকাটা শুরু করুন',
  buttonTextEn: 'Start Shopping',
  buttonLink: '/products',
  image: '',
  showImage: false,
  updatedAt: new Date()
};

// Fallback in-memory store
let memoryDb = {
  products: [...INITIAL_PRODUCTS.map((p, idx) => ({ _id: `p_${idx + 1}`, id: `p_${idx + 1}`, ...p }))],
  categories: [...INITIAL_CATEGORIES],
  banners: [...INITIAL_BANNERS],
  popup: { ...INITIAL_POPUP },
  orders: [
    {
      _id: 'ord_1',
      id: 'ord_1',
      orderId: 'GB-2024-1001',
      customerName: 'আব্দুল করিম',
      customerPhone: '01711223344',
      shippingAddress: 'ধানমন্ডি, ঢাকা',
      items: [
        {
          productId: 'p_1',
          name: 'সুন্দরবন খলিসা ফুলের খাঁটি মধু',
          price: 950,
          quantity: 1,
          selectedVariant: { weight: '1 kg', price: 950 }
        }
      ],
      deliveryCharge: 60,
      totalAmount: 1010,
      paymentMethod: 'Cash on Delivery',
      status: 'Processing',
      orderNotes: 'দ্রুত ডেলিভারি করবেন প্লিজ',
      createdAt: new Date(Date.now() - 3600000 * 5)
    }
  ],
  reviews: [
    {
      _id: 'rev_1',
      id: 'rev_1',
      productId: 'p_1',
      customerName: 'তানভীর আহমেদ',
      rating: 5,
      comment: 'মাশাল্লাহ, খাঁটি সুন্দরবনের মধুর আসল স্বাদ পেয়েছি। প্যাকেজিং খুবই দারুণ ছিল।',
      date: '২ দিন আগে'
    },
    {
      _id: 'rev_2',
      id: 'rev_2',
      productId: 'p_2',
      customerName: 'ফারহানা ইসলাম',
      rating: 5,
      comment: 'ঘির সুবাস আর কোয়ালিটি অনেক চমৎকার। নিয়মিত কাস্টমার হয়ে গেলাম!',
      date: '৫ দিন আগে'
    }
  ],
  users: []
};

// Database Connection
let db = null;
let isMongoConnected = false;

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
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
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed, using in-memory mock database mode.');
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
    thumbnail
  };
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Root Check
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Ihsan Online Shop E-Commerce Server',
    version: '1.0.0',
    dbConnected: isMongoConnected,
    timestamp: new Date()
  });
});

// 1. PRODUCTS API
// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, featured, bestSeller, limit = 50, page = 1 } = req.query;

    if (isMongoConnected && db) {
      const query = {};
      if (category && category !== 'all') {
        query.$or = [
          { categorySlug: category },
          { category: category }
        ];
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { nameEn: { $regex: search, $options: 'i' } },
          { name_bn: { $regex: search, $options: 'i' } },
          { name_en: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (featured === 'true') query.isFeatured = true;
      if (bestSeller === 'true') query.isBestSeller = true;

      const skip = (Number(page) - 1) * Number(limit);
      const total = await db.collection('products').countDocuments(query);
      const products = await db.collection('products').find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(Number(limit)).toArray();

      return res.json({
        success: true,
        data: products.map(formatDoc),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    }

    // In-memory filter
    let results = [...memoryDb.products];
    if (category && category !== 'all') {
      results = results.filter(p => p.categorySlug === category || p.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(s)) ||
        (p.name_bn && p.name_bn.toLowerCase().includes(s)) ||
        (p.name_en && p.name_en.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s))
      );
    }
    if (featured === 'true') results = results.filter(p => p.isFeatured || p.is_featured);
    if (bestSeller === 'true') results = results.filter(p => p.isBestSeller);

    res.json({
      success: true,
      data: results.map(formatDoc),
      total: results.length,
      page: 1,
      totalPages: 1
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// GET /api/products/:id
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
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, data: formatDoc(product) });
    }

    const product = memoryDb.products.find(p => p.id === id || p._id === id || p.slug === id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: formatDoc(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product details', error: error.message });
  }
});

// POST /api/products (Admin Create Product)
app.post('/api/products', async (req, res) => {
  try {
    const raw = req.body || {};
    
    // Normalize images and thumbnail
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

// PUT & PATCH /api/products/:id (Admin Update Product)
const handleProductUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body || {};

    // Normalize images and thumbnail if provided
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

    // Recalculate discount percentage if price or regularPrice updated
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

    // In memory store update
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

// DELETE /api/products/:id (Admin Delete Product)
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

// GET /api/popup
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

// POST & PUT /api/popup (Admin Update Popup Notice)
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

// 2. CATEGORIES API
// GET /api/categories
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: memoryDb.categories });
});

// 3. BANNERS API
// GET /api/banners
app.get('/api/banners', (req, res) => {
  res.json({ success: true, data: memoryDb.banners });
});

// 4. ORDERS API
// POST /api/orders (Place Order)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerPhone, shippingAddress, items, deliveryCharge, totalAmount, paymentMethod, orderNotes } = req.body;

    if (!customerName || !customerPhone || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'নাম, মোবাইল নম্বর, ঠিকানা এবং কমপক্ষে ১টি পণ্য নির্বাচন করুন।'
      });
    }

    const orderId = `GB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      orderId,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      deliveryCharge: Number(deliveryCharge) || 60,
      totalAmount: Number(totalAmount),
      paymentMethod: paymentMethod || 'Cash on Delivery',
      orderNotes: orderNotes || '',
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('orders').insertOne(newOrder);
      return res.status(201).json({
        success: true,
        message: 'আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
        data: { ...newOrder, id: result.insertedId.toString(), _id: result.insertedId.toString() }
      });
    }

    const id = `ord_${memoryDb.orders.length + 1}`;
    const order = { _id: id, id, ...newOrder };
    memoryDb.orders.unshift(order);

    res.status(201).json({
      success: true,
      message: 'আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
});

// GET /api/orders (Admin View)
app.get('/api/orders', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    if (isMongoConnected && db) {
      const query = status ? { status } : {};
      const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).limit(Number(limit)).toArray();
      return res.json({ success: true, data: orders.map(formatDoc) });
    }

    let orders = [...memoryDb.orders];
    if (status) orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// GET /api/orders/track/:identifier (Track by orderId or Phone)
app.get('/api/orders/track/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = decodeURIComponent(identifier).trim();

    if (isMongoConnected && db) {
      const order = await db.collection('orders').findOne({
        $or: [
          { orderId: cleanId },
          { customerPhone: cleanId },
          ...(ObjectId.isValid(cleanId) ? [{ _id: new ObjectId(cleanId) }] : [])
        ]
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি' });
      }
      return res.json({ success: true, data: formatDoc(order) });
    }

    const order = memoryDb.orders.find(o =>
      o.orderId === cleanId ||
      o.customerPhone === cleanId ||
      o.id === cleanId ||
      o._id === cleanId
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to track order' });
  }
});

// PATCH /api/orders/:id/status (Admin Update Status)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    if (isMongoConnected && db) {
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { orderId: id };
      const result = await db.collection('orders').findOneAndUpdate(
        filter,
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!result) return res.status(404).json({ success: false, message: 'Order not found' });
      return res.json({ success: true, message: 'অর্ডারের স্ট্যাটাস সফলভাবে পরিবর্তন হয়েছে', data: formatDoc(result) });
    }

    const order = memoryDb.orders.find(o => o._id === id || o.id === id || o.orderId === id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    order.updatedAt = new Date();
    res.json({ success: true, message: 'অর্ডারের স্ট্যাটাস সফলভাবে পরিবর্তন হয়েছে', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// 5. REVIEWS API
// GET /api/reviews/:productId
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (isMongoConnected && db) {
      const reviews = await db.collection('reviews').find({ productId }).sort({ createdAt: -1 }).toArray();
      return res.json({ success: true, data: reviews.map(formatDoc) });
    }

    const reviews = memoryDb.reviews.filter(r => r.productId === productId || productId === 'all');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, customerName, rating, comment } = req.body;
    if (!customerName || !comment) {
      return res.status(400).json({ success: false, message: 'আপনার নাম এবং রিভিউ মন্তব্য আবশ্যক' });
    }

    const newReview = {
      productId: productId || 'general',
      customerName,
      rating: Number(rating) || 5,
      comment,
      date: 'আজকে',
      createdAt: new Date()
    };

    if (isMongoConnected && db) {
      const result = await db.collection('reviews').insertOne(newReview);
      return res.status(201).json({
        success: true,
        message: 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে!',
        data: { ...newReview, id: result.insertedId.toString() }
      });
    }

    const id = (memoryDb.reviews.length + 1).toString();
    const created = { _id: id, id, ...newReview };
    memoryDb.reviews.unshift(created);
    res.status(201).json({ success: true, message: 'রিভিউ সফলভাবে জমা দেওয়া হয়েছে!', data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
});

// 6. STATS API (For Admin Dashboard)
// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    if (isMongoConnected && db) {
      const totalProducts = await db.collection('products').countDocuments();
      const totalOrders = await db.collection('orders').countDocuments();
      const orders = await db.collection('orders').find({}).toArray();
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

// 7. SIMPLE AUTH API
// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'নাম, মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      phone,
      email: email || '',
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date()
    };

    if (isMongoConnected && db) {
      const existing = await db.collection('users').findOne({ phone });
      if (existing) {
        return res.status(400).json({ success: false, message: 'এই নম্বরে আগেই অ্যাকাউন্ট খোলা হয়েছে' });
      }
      const result = await db.collection('users').insertOne(newUser);
      const token = jwt.sign({ id: result.insertedId.toString(), phone, name, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        success: true,
        message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
        token,
        user: { id: result.insertedId.toString(), name, phone, email }
      });
    }

    const existing = memoryDb.users.find(u => u.phone === phone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'এই নম্বরে আগেই অ্যাকাউন্ট খোলা হয়েছে' });
    }
    const id = (memoryDb.users.length + 1).toString();
    const user = { _id: id, id, ...newUser };
    memoryDb.users.push(user);
    const token = jwt.sign({ id, phone, name, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
      token,
      user: { id, name, phone, email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'মোবাইল নম্বর ও পাসওয়ার্ড দিন' });
    }

    // Default Demo Admin bypass
    if (phone === '01700000000' && password === 'admin123') {
      const token = jwt.sign({ id: 'admin_1', phone, name: 'Admin Ihsan Online Shop', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true,
        message: 'এডমিন লগইন সফল হয়েছে',
        token,
        user: { id: 'admin_1', name: 'Admin Ihsan Online Shop', phone, role: 'admin' }
      });
    }

    let user = null;
    if (isMongoConnected && db) {
      user = await db.collection('users').findOne({ phone });
    } else {
      user = memoryDb.users.find(u => u.phone === phone);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড প্রদান করেছেন' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড প্রদান করেছেন' });
    }

    const token = jwt.sign({ id: user._id || user.id, phone: user.phone, name: user.name, role: user.role || 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      message: 'লগইন সফল হয়েছে!',
      token,
      user: { id: user._id || user.id, name: user.name, phone: user.phone, role: user.role || 'customer' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Ihsan Online Shop Server running on http://localhost:${PORT}`);
  console.log(`📦 REST Endpoints ready at http://localhost:${PORT}/api/products`);
});