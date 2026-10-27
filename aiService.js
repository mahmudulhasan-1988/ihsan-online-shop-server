/**
 * Ihsan Online Shop - Smart AI Assistant Service
 * Supports Google Gemini API, OpenAI API, Groq, and an Advanced Built-in Bengali/English Organic Food Advisor.
 * Fully integrated with MongoDB products and orders.
 */

// Helper to sanitize text
function sanitizeText(str) {
  if (!str) return '';
  return String(str).trim();
}

// -------------------------------------------------------------------------
// 1. External AI Callers (Google Gemini / OpenAI / Groq)
// -------------------------------------------------------------------------

async function callGoogleGemini(prompt, systemInstruction, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Gemini API non-200 response:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Gemini API call failed:', err.message);
    return null;
  }
}

async function callOpenAI(prompt, systemInstruction, apiKey, baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o-mini') {
  const url = baseUrl + '/chat/completions';
  const payload = {
    model: model,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 800
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('OpenAI/LLM API non-200:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data?.choices?.[0]?.message?.content;
    return candidate ? candidate.trim() : null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('OpenAI API call failed:', err.message);
    return null;
  }
}

// -------------------------------------------------------------------------
// 2. Advanced Native Ihsan Smart AI Engine (Fall-back & Fast Offline Intelligence)
// -------------------------------------------------------------------------

function generateSmartFallbackReply(message, matchedProducts, allProducts, orderInfo, lang = 'bn') {
  const msg = message.toLowerCase().trim();

  // If order lookup matched real order in MongoDB
  if (orderInfo) {
    const rawStatus = (orderInfo.status || orderInfo.order_status || 'pending').toLowerCase();
    const statusBn = rawStatus === 'delivered' ? 'ডেলিভার্ড সম্পন্ন ✅' :
                     rawStatus === 'shipped' ? 'কুরিয়ারে পাঠানো হয়েছে (অন ট্রানজিট) 🚚' :
                     rawStatus === 'processing' ? 'প্যাকেজিং ও প্রসেসিং হচ্ছে 📦' : 'অর্ডার গ্রহণ করা হয়েছে (পেন্ডিং) ⏳';

    const orderId = orderInfo.orderId || orderInfo.order_id || orderInfo._id;
    const custName = orderInfo.customerName || orderInfo.shippingAddress?.fullName || orderInfo.customer_name || 'সম্মানিত গ্রাহক';
    const amount = orderInfo.totalAmount || orderInfo.total_amount || 0;
    const payMethod = (orderInfo.paymentMethod || orderInfo.payment_method || 'cod') === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'অনলাইন পরিশোধিত';
    const address = orderInfo.deliveryAddress || orderInfo.shippingAddress?.address || '';

    return {
      reply: '📦 **আপনার অর্ডারের লাইভ ট্র্যাকিং তথ্য:**\n\n' +
        '• **অর্ডার আইডি:** **' + orderId + '**\n' +
        '• **গ্রাহকের নাম:** ' + custName + '\n' +
        '• **অর্ডার স্ট্যাটাস:** **' + statusBn + '**\n' +
        '• **মোট মূল্য:** **৳ ' + amount + '** (' + payMethod + ')\n' +
        (address ? '• **ডেলিভারি ঠিকানা:** ' + address + '\n' : '') + '\n' +
        'আমাদের প্রতিনিধি আপনার অর্ডারটি দ্রুততম সময়ে পৌঁছে দেওয়ার জন্য কাজ করছে। যেকোনো জরুরি প্রয়োজনে কল করুন: **09611-562080**।',
      quickReplies: ['🚚 ডেলিভারি চার্জ কত?', '🍯 নতুন পণ্য দেখান', '📞 হটলাইনে কল দিন']
    };
  }

  // Intent patterns
  const isGreeting = /^(আসসালামু|সালাম|হ্যালো|হাই|hello|hi|hey|শুভ|good morning|kemon ach|কেমন আছ)/i.test(msg);
  const isPrice = /(দাম|প্রাইস|কত টাকা|মূল্য|খরচ|price|cost|rate|taka|কত)/i.test(msg);
  const isBenefits = /(উপকার|লাভ|কেন খাব|স্বাস্থ|ডায়াবেটিস|ঠান্ডা|কাশি|হার্ট|ত্বক|চুল|ক্যালসিয়াম|benefit|health|use|good for)/i.test(msg);
  const isDelivery = /(ডেলিভারি|শিপিং|পাঠাবেন|কত দিন|পৌঁছাবে|চার্জ|delivery|shipping|charge|পৌঁছাতে)/i.test(msg);
  const isPayment = /(পেমেন্ট|ক্যাশ অন|টাকা দিব|বিকাশ|payment|cod|cash on delivery|bkash)/i.test(msg);
  const isOrder = /(অর্ডার|কিনব|কিনতে|নেব|নিতে|বুক|order|buy|purchase)/i.test(msg);
  const isPurity = /(আসল|খাঁটি|ভেজাল|অর্গানিক|কেমিক্যাল|ল্যাব|টেস্ট|pure|organic|original|guarantee)/i.test(msg);
  const isContact = /(যোগাযোগ|ফোন|মোবাইল|নাম্বার|কল|হেল্পলাইন|হটলাইন|ঠিকানা|contact|phone|hotline|number|call)/i.test(msg);
  const isTracking = /(ট্র্যাক|অর্ডার কোথায়|পার্সেল|কবে পাব|track|tracking|status|where is my order)/i.test(msg);

  // Greeting
  if (isGreeting && matchedProducts.length === 0 && !isPrice && !isBenefits) {
    return {
      reply: 'আসসালামু আলাইকুম! 🌿 **ইহসান অনলাইন শপের** স্মার্ট AI শপিং অ্যাসিস্ট্যান্টে আপনাকে আন্তরিক স্বাগতম।\n\n' +
        'আমরা দিচ্ছি সুন্দরবনের ১০০% খাঁটি প্রাকৃতিক মধু, কাঠের ঘানি ভাঙা সরিষার তেল, দেশি গাওয়া ঘি, মদিনার আজওয়া খেজুর ও সুপারফুড।\n\n' +
        'কোন পণ্যটির দাম, উপকারিতা বা স্টক সম্পর্কে জানতে চান? নিচে লিখে জানান অথবা সাজেশনের যেকোনোটিতে ক্লিক করুন!',
      quickReplies: ['🍯 খাঁটি মধুর দাম কত?', '🧈 দেশি গাওয়া ঘি', '🌴 মদিনার আজওয়া খেজুর', '🚚 ডেলিভারি চার্জ ও নিয়ম']
    };
  }

  // Delivery details
  if (isDelivery) {
    return {
      reply: '🚚 **ইহসান অনলাইন শপের ডেলিভারি পলিসি ও চার্জ:**\n\n' +
        '• **ঢাকা সিটির ভেতরে:** ডেলিভারি চার্জ মাত্র **৬০ টাকা** (১০০০ টাকার অর্ডারে ডেলিভারি সম্পূর্ণ **ফ্রি**!)\n' +
        '• **ঢাকা সিটির বাইরে ও সারাদেশে:** ডেলিভারি চার্জ **১২০ টাকা** (২০০০ টাকার বেশি অর্ডারে ডেলিভারি **ফ্রি**!)\n' +
        '• **ডেলিভারি সময়:** ঢাকা সিটিতে ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ২-৩ কর্মদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়।\n\n' +
        'সারাদেশেই রয়েছে **ক্যাশ অন ডেলিভারি** (পণ্য হাতে পেয়ে মূল্য পরিশোধের সুবিধা)! 📦',
      quickReplies: ['📦 অর্ডার কিভাবে করব?', '🍯 খাঁটি মধু দেখান', '📞 কাস্টমার কেয়ারে কল দিন']
    };
  }

  // Payment methods
  if (isPayment) {
    return {
      reply: '💳 **নিরাপদ ও সহজ পেমেন্ট মাধ্যম:**\n\n' +
        '১. **ক্যাশ অন ডেলিভারি (Cash on Delivery):** পণ্য হাতে পেয়ে সম্পূর্ণ দেখে তারপর মূল্য পরিশোধ করতে পারবেন।\n' +
        '২. **বিকাশ / অনলাইন পেমেন্ট:** নিশ্চিন্তে বিকাশ বা অনলাইন কার্ডেও পেমেন্ট করতে পারেন।\n\n' +
        'আমাদের সকল পণ্যে ১০০% কোয়ালিটি নিশ্চয়তা ও সহজ রিটার্ন পলিসি রয়েছে।',
      quickReplies: ['📦 ১-ক্লিক অর্ডার করব', '🚚 ডেলিভারি চার্জ কত?', '🌿 খাঁটি সরিষার তেল']
    };
  }

  // How to order
  if (isOrder && matchedProducts.length === 0) {
    return {
      reply: '🛍️ **সহজ ৩টি নিয়মে অর্ডার করুন:**\n\n' +
        '১. পণ্যের নিচে থাকা **"১-ক্লিক ফাস্ট অর্ডার"** বাটনে ক্লিক করুন।\n' +
        '২. আপনার নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা লিখে **"অর্ডার কনফার্ম করুন"** বাটনে চাপ দিন।\n' +
        '৩. অথবা সরাসরি কল করে অর্ডার বুক করুন আমাদের হটলাইনে: **09611-562080** (সকাল ৯টা - রাত ১১টা)।',
      quickReplies: ['🍯 খাঁটি মধু অর্ডার করব', '🧈 গাওয়া ঘি এর দাম কত?', '🌴 আজওয়া খেজুর দেখান']
    };
  }

  // Contact / Hotline
  if (isContact) {
    return {
      reply: '📞 **ইহসান অনলাইন শপ কাস্টমার সাপোর্ট ও হটলাইন:**\n\n' +
        '• **হটলাইন নম্বর:** **09611-562080**\n' +
        '• **মোবাইল / কল:** 01971-562080\n' +
        '• **ইমেইল:** support@ihsan.com.bd\n' +
        '• **সেবার সময়:** প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১১:০০ টা পর্যন্ত।\n\n' +
        'যেকোনো প্রশ্ন বা দ্রুত অর্ডারের জন্য আমাদের কাস্টমার কেয়ার প্রতিনিধিরা সর্বদা প্রস্তুত!',
      quickReplies: ['📦 অর্ডার ট্র্যাক করব', '🍯 খাঁটি মধুর দাম', '🚚 ডেলিভারি চার্জ']
    };
  }

  // Purity Guarantee
  if (isPurity && matchedProducts.length === 0) {
    return {
      reply: '🛡️ **ইহসান অনলাইন শপের শতভাগ বিশুদ্ধতার অঙ্গীকার:**\n\n' +
        '• **খাঁটি মধু:** সুন্দরবন ও বিশ্বস্ত মৌয়ালদের থেকে সরাসরি চাক ভাঙা অপরিশোধিত প্রাকৃতিক মধু। কোনো প্রকার সুগার সিরাপ বা ভেজাল নেই।\n' +
        '• **ঘানি ভাঙা সরিষার তেল:** কাঠের ঘানিতে প্রথম চাপে ভাঙানো ঝাঁঝালো ও পুষ্টিকর সরিষার তেল।\n' +
        '• **গাওয়া ঘি:** গ্রামের নিজস্ব খামারের খাঁটি গরুর দুধের ননি থেকে সনাতন পদ্ধতিতে জ্বাল দেওয়া সুস্বাদু দানাদার ঘি।\n\n' +
        '✅ ল্যাব টেস্টে ভেজাল প্রমাণিত হলে শতভাগ মূল্য ফেরতের গ্যারান্টি!',
      quickReplies: ['🍯 সুন্দরবনের মধু দেখান', '🌿 সরিষার তেল', '🧈 দেশি গাওয়া ঘি']
    };
  }

  // Order Tracking Guidance
  if (isTracking) {
    return {
      reply: '🔎 **অর্ডার ট্র্যাক করার সহজ উপায়:**\n\n' +
        '১. আপনার অর্ডার আইডি (যেমন: GB-ORD-1870) বা মোবাইল নম্বরটি এখানে লিখে পাঠান, আমি সাথে সাথে স্ট্যাটাস জানিয়ে দিচ্ছি!\n' +
        '২. অথবা হেডারের **"অর্ডার ট্র্যাক করুন"** লিঙ্কে গিয়ে যেকোনো সময় লাইভ ট্র্যাকিং দেখতে পারেন।\n' +
        '৩. কোনো অসুবিধা হলে সরাসরি কল করুন: **09611-562080**।',
      quickReplies: ['📞 হেল্পলাইনে কল দিন', '🍯 জনপ্রিয় পণ্যসমূহ', '🚚 ডেলিভারি নিয়ম']
    };
  }

  // Health Benefits query for specific matched products
  if (isBenefits && matchedProducts.length > 0) {
    const top = matchedProducts[0];
    const pName = top.name || top.name_bn || 'এই পণ্যের';
    let benefitDetails = '';

    if (/মধু|honey/i.test(pName)) {
      benefitDetails = '• **রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি:** অ্যান্টিঅক্সিডেন্টে ভরপুর, প্রাকৃতিকভাবে এনার্জি বুস্ট করে।\n' +
                       '• **সর্দি ও কাশি নিরাময়:** গরম পানি বা তুলসি পাতার সাথে খেলে দ্রুত আরাম পাওয়া যায়।\n' +
                       '• **হজমরস বৃদ্ধি ও হৃদরোগের ঝুঁকি হ্রাস:** হজমশক্তি বাড়াতে এবং মেটাবলিজম ঠিক রাখতে দারুণ কার্যকর।';
    } else if (/ঘি|ghee/i.test(pName)) {
      benefitDetails = '• **স্মৃতিশক্তি ও ব্রেইন পাওয়ার বৃদ্ধি:** শিশুদের মানসিক বিকাশ ও বয়স্কদের মস্তিষ্কের কোষ সুরক্ষায় সাহায্য করে।\n' +
                       '• **হাড় ও জয়েন্টের সুস্থতা:** এতে থাকা ভিটামিন এ, ডি, ই এবং কে হাড় মজবুত রাখে।\n' +
                       '• **সুস্থ হজম ও ত্বকের লাবণ্য:** অন্ত্রের স্বাস্থ্য ভালো রাখে এবং ত্বককে উজ্জ্বল ও কোমল রাখে।';
    } else if (/তেল|oil|সরিষা/i.test(pName)) {
      benefitDetails = '• **হার্টের সুস্থতা:** ওমেগা-৩ ও ওমেগা-৬ ফ্যাটি অ্যাসিড সমৃদ্ধ যা কোলেস্টেরল নিয়ন্ত্রণে সহায়ক।\n' +
                       '• **শরীরে রক্ত সঞ্চালন বৃদ্ধি:** রান্নার পাশাপাশি মালিশেও জয়েন্টের ব্যথা দূর করতে অত্যন্ত উপকারী।\n' +
                       '• **প্রাকৃতিক অ্যান্টিব্যাকটেরিয়াল উপাদান:** ঠান্ডা-কাশি প্রতিরোধে ও হজম প্রক্রিয়া সতেজ রাখতে অতুলনীয়।';
    } else if (/খেজুর|date|আজওয়া/i.test(pName)) {
      benefitDetails = '• **হাদিস শরিফে বর্ণিত ফজিলত:** মদিনার আজওয়া খেজুর বিষ ও জাদু থেকে সুরক্ষা দেয় এবং অত্যন্ত বরকতময়।\n' +
                       '• **ইনস্ট্যান্ট এনার্জি ও রক্তস্বল্পতা দূর:** প্রচুর আয়রন, পটাশিয়াম ও ম্যাগনেশিয়াম সমৃদ্ধ।\n' +
                       '• **হার্ট ও স্নায়ুতন্ত্র সুস্থ রাখা:** রক্তচাপ নিয়ন্ত্রণে এবং হৃদযন্ত্র সুরক্ষিত রাখতে সাহায্য করে।';
    } else if (/চিয়া|chia/i.test(pName)) {
      benefitDetails = '• **ওজন নিয়ন্ত্রণে অতুলনীয়:** উচ্চমাত্রার ফাইবার ক্ষুধা নিয়ন্ত্রণ করে এবং পেট ভরা রাখে।\n' +
                       '• **ওমেগা-৩ ফ্যাটি অ্যাসিডের খনি:** হার্ট সুস্থ রাখতে এবং কোলেস্টেরল কমাতে সহায়ক।\n' +
                       '• **হাড়ের ঘনত্ব ও ত্বক:** ক্যালসিয়াম ও অ্যান্টিঅক্সিডেন্টে সমৃদ্ধ যা ত্বক সতেজ রাখে।';
    } else {
      benefitDetails = '• ১০০% প্রাকৃতিকভাবে সংগৃহীত, কোনো রাসায়নিক বা প্রিজারভেটিভ নেই।\n' +
                       '• শরীরের প্রয়োজনীয় ভিটামিন, খনিজ ও পুষ্টি উপাদানে ভরপুর।\n' +
                       '• নিয়মিত সেবনে শরীর সুস্থ, প্রাণবন্ত ও রোগমুক্ত থাকে।';
    }

    return {
      reply: '🌿 **' + pName + '-এর প্রধান স্বাস্থ্য উপকারিতা:**\n\n' +
        benefitDetails + '\n\n' +
        '• **বর্তমান মূল্য:** ৳ **' + top.price + '**' + (top.regularPrice > top.price ? ' (পূর্বমূল্য ৳ ' + top.regularPrice + ')' : '') + '\n' +
        '• **স্টক:** ' + (Number(top.stock_quantity ?? top.stock ?? 50) > 0 ? '✅ স্টকে এভেইলেবল আছে' : 'সাময়িক শেষ') + '\n\n' +
        'আপনি চাইলে এখনই নিচে থাকা বাটনে ক্লিক করে সহজেই অর্ডার করতে পারেন!',
      quickReplies: ['📦 ১-ক্লিক অর্ডার করব', '🚚 ডেলিভারি চার্জ কত?', '🍯 অন্য মধু দেখান']
    };
  }

  // Specific Product Matches
  if (matchedProducts.length > 0) {
    const top = matchedProducts[0];
    const regularPriceText = top.regularPrice > top.price ? ' (রেগুলার মূল্য: ৳' + top.regularPrice + ')' : '';
    const discountText = top.discountPercentage ? ' 🔥 ' + top.discountPercentage + '% ছাড়!' : '';

    if (matchedProducts.length === 1) {
      return {
        reply: '🌿 **' + (top.name || top.name_bn) + '**\n\n' +
          '• **বর্তমান মূল্য:** **৳ ' + top.price + '**' + regularPriceText + discountText + '\n' +
          '• **পরিমাণ/প্যাক:** ' + (top.unit || '১ কেজি / জার') + '\n' +
          '• **স্টক স্ট্যাটাস:** ' + (Number(top.stock_quantity ?? top.stock ?? 50) > 0 ? '✅ স্টকে আছে (সরাসরি অর্ডার করতে পারেন)' : '⚠️ সাময়িক স্টক আউট') + '\n' +
          '• **গুণমান নিশ্চয়তা:** ১০০% খাঁটি ও ফ্রেশ কোয়ালিটি গ্যারান্টি।\n\n' +
          'অর্ডার করতে নিচের **১-ক্লিক ফাস্ট অর্ডার** বাটনে ক্লিক করুন অথবা আপনার নাম-ঠিকানা লিখে জানান!',
        quickReplies: ['📦 এই পণ্যটি অর্ডার করব', '🚚 ডেলিভারি চার্জ কত?', '🌿 এর উপকারিতা কী?', '🍯 অন্যান্য পণ্য']
      };
    } else {
      const listSummary = matchedProducts.slice(0, 3).map((p, i) =>
        (i + 1) + '. **' + (p.name || p.name_bn) + '** — ৳ **' + p.price + '** ' + (p.unit ? '(' + p.unit + ')' : '')
      ).join('\n');

      return {
        reply: 'আমাদের কাছে আপনার পছন্দের বেশ কিছু খাঁটি পণ্য রয়েছে:\n\n' +
          listSummary + '\n\n' +
          'পণ্যগুলোর বিস্তারিত দেখতে বা অর্ডার করতে নিচের কার্ডগুলোতে ক্লিক করুন। কোনো নির্দিষ্ট পণ্যের উপকারিতা বা বিস্তারিত জানতে চান?',
        quickReplies: ['🍯 প্রথম পণ্যটি অর্ডার করব', '🚚 ডেলিভারি চার্জ কত?', '📞 সরাসরি কল করে অর্ডার']
      };
    }
  }

  // Fallback for general queries
  const sampleProducts = allProducts.slice(0, 3).map(p => p.name || p.name_bn).join(', ');
  return {
    reply: 'ধন্যবাদ আপনার প্রশ্নের জন্য! 🌿\n\n' +
      'ইহসান অনলাইন শপে আপনি পাবেন শতভাগ খাঁটি সুন্দরবনের মধু, কাঠের ঘানি ভাঙা সরিষার তেল, দেশি গাওয়া ঘি, মদিনার আজওয়া খেজুরসহ নানা স্বাস্থ্যকর খাবার (' + sampleProducts + ')।\n\n' +
      'কোনো নির্দিষ্ট পণ্যের নাম, দাম বা ডেলিভারি সম্পর্কে জানতে চাইলে নিচে লিখুন অথবা হটলাইনে যোগাযোগ করুন: **09611-562080**।',
    quickReplies: ['🍯 খাঁটি মধুর দাম কত?', '🧈 গাওয়া ঘি এর দাম', '🚚 ডেলিভারি চার্জ কত?', '📦 অর্ডার করার নিয়ম']
  };
}

// -------------------------------------------------------------------------
// 3. Main AI Orchestration Function
// -------------------------------------------------------------------------

async function processAiMessage({ message, sessionId, userId, userName, lang = 'bn', database, initialProducts = [] }) {
  const trimmed = sanitizeText(message);
  if (!trimmed) {
    return {
      success: false,
      message: 'মেসেজ খালি হতে পারে না।'
    };
  }

  // 1. Fetch real product catalog from MongoDB
  let allProducts = [];
  if (database) {
    try {
      allProducts = await database.collection('products').find({}).toArray();
    } catch (e) {
      console.warn('Could not fetch products from MongoDB:', e.message);
    }
  }
  if (!allProducts || allProducts.length === 0) {
    allProducts = initialProducts;
  }

  // 2. Check for order tracking intent / ID in query
  let matchedOrder = null;
  const orderIdMatch = trimmed.match(/(?:GB-ORD-\d+|GB-\d+|ORD-\d+|\b01[3-9]\d{8}\b)/i);
  if (orderIdMatch && database) {
    const candidate = orderIdMatch[0].trim();
    try {
      matchedOrder = await database.collection('orders').findOne({
        $or: [
          { orderId: candidate },
          { order_id: candidate },
          { orderId: candidate.toUpperCase() },
          { customerPhone: candidate },
          { 'shippingAddress.phone': candidate }
        ]
      });
    } catch (e) {
      // silent
    }
  }

  // 3. Find matched products using intelligent keyword & category matching
  const lowerQuery = trimmed.toLowerCase();
  const searchTokens = lowerQuery.split(/[\\s,।?!]+/).filter(t => t.length > 1);

  const scoredProducts = allProducts.map(p => {
    let score = 0;
    const nameBn = (p.name_bn || p.name || '').toLowerCase();
    const nameEn = (p.nameEn || p.name_en || p.name || '').toLowerCase();
    const category = (p.category || p.category_name || '').toLowerCase();
    const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
    const desc = (p.description || '').toLowerCase();

    // Exact word or name substring match
    if (nameBn.includes(lowerQuery) || nameEn.includes(lowerQuery)) score += 15;
    if (category.includes(lowerQuery)) score += 10;

    // Token matching
    searchTokens.forEach(token => {
      if (nameBn.includes(token)) score += 5;
      if (nameEn.includes(token)) score += 5;
      if (category.includes(token)) score += 3;
      if (tags.includes(token)) score += 2;
      if (desc.includes(token)) score += 1;
    });

    // Special category synonym matching
    if (/(মধু|honey|মৌ|চাকের মধু|খলিশা|সুন্দরবন)/i.test(lowerQuery) && /(মধু|honey)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(ঘি|ghee|গাওয়া ঘি|ঘী)/i.test(lowerQuery) && /(ঘি|ghee)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(তেল|oil|সরিষা|মাস্টার্ড|ঘানি)/i.test(lowerQuery) && /(তেল|oil|সরিষা)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(খেজুর|date|আজওয়া|মরিয়ম|মদিনা)/i.test(lowerQuery) && /(খেজুর|date|আজওয়া)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(চিয়া|chia|সিড)/i.test(lowerQuery) && /(চিয়া|chia)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(বাদাম|nut|কাজু|কাঠবাদাম|পেস্তা)/i.test(lowerQuery) && /(বাদাম|nut)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;
    if (/(কালোজিরা|কালিজিরা|kalijira)/i.test(lowerQuery) && /(কালোজিরা|কালিজিরা)/i.test(nameBn + ' ' + nameEn + ' ' + category)) score += 8;

    return { product: p, score };
  });

  const matchedProducts = scoredProducts
    .filter(sp => sp.score > 2)
    .sort((a, b) => b.score - a.score)
    .map(sp => sp.product);

  // Fallback to featured or best sellers if none matched
  const finalMatched = matchedProducts.length > 0
    ? matchedProducts
    : allProducts.filter(p => p.isFeatured || p.isBestSeller).slice(0, 3);

  // 4. Try External AI (Gemini / OpenAI / Groq) if API key exists in process.env
  let aiReply = null;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if ((geminiKey || openaiKey || groqKey) && !matchedOrder) {
    const catalogContext = allProducts.slice(0, 15).map(p =>
      "- " + (p.name || p.name_bn) + ": Price ৳" + p.price + " (Regular ৳" + (p.regularPrice || p.price) + "), Unit: " + (p.unit || '1 pack') + ", Stock: " + (p.stock_quantity ?? p.stock ?? 'Available')
    ).join('\n');

    const systemPrompt = "You are the official AI Shopping Assistant for 'ইহসান অনলাইন শপ' (Ihsan Online Shop - 100% Pure Organic Foods in Bangladesh).\n" +
"Store Info:\n" +
"- Products: Pure Sundarban Honey, Cold Pressed Mustard Oil, Desi Cow Ghee, Madinah Ajwa Dates, Chia Seeds, Nuts, Organic Superfoods.\n" +
"- Delivery: Inside Dhaka 60 TK (Free above 1000 TK), Outside Dhaka 120 TK (Free above 2000 TK). Cash on Delivery nationwide.\n" +
"- Hotline: 09611-562080 (9 AM - 11 PM).\n" +
"- 100% Purity Guarantee, easy 7-day return.\n\n" +
"Current MongoDB Live Products:\n" + catalogContext + "\n\n" +
"Instructions:\n" +
"1. Speak in friendly, polite, respectful Bengali (or English if the customer asks in English).\n" +
"2. Use markdown formatting with bullet points, bold pricing in ৳ (BDT), and relevant emojis.\n" +
"3. Be enthusiastic, explain health benefits when asked, and guide them to order via 1-Click Fast Order or call hotline 09611-562080.\n" +
"4. Keep answers concise (within 3-5 sentences unless detailed benefits are requested). Never invent fake products or prices.";

    if (geminiKey) {
      aiReply = await callGoogleGemini(trimmed, systemPrompt, geminiKey);
    } else if (openaiKey) {
      aiReply = await callOpenAI(trimmed, systemPrompt, openaiKey);
    } else if (groqKey) {
      aiReply = await callOpenAI(trimmed, systemPrompt, groqKey, 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile');
    }
  }

  // 5. If External AI was not configured or failed, use Ihsan Smart AI Engine
  let quickReplies = ['🍯 খাঁটি মধুর দাম কত?', '🧈 গাওয়া ঘি এর দাম', '🚚 ডেলিভারি চার্জ কত?', '📦 অর্ডার করার নিয়ম'];
  if (!aiReply) {
    const smartFallback = generateSmartFallbackReply(trimmed, matchedProducts, allProducts, matchedOrder, lang);
    aiReply = smartFallback.reply;
    if (smartFallback.quickReplies) {
      quickReplies = smartFallback.quickReplies;
    }
  }

  // Format suggested product cards for frontend UI
  const suggestedProducts = finalMatched.slice(0, 3).map(p => ({
    id: p.id || p._id,
    _id: p._id || p.id,
    name: p.name || p.name_bn,
    name_bn: p.name_bn || p.name,
    nameEn: p.nameEn || p.name_en || p.name,
    price: Number(p.price) || 0,
    regularPrice: Number(p.regularPrice || p.regular_price || p.price) || 0,
    discountPercentage: p.discountPercentage || (p.regularPrice > p.price ? Math.round(((p.regularPrice - p.price) / p.regularPrice) * 100) : 0),
    thumbnail: p.thumbnail || (Array.isArray(p.images) && p.images[0]) || '',
    images: p.images || (p.thumbnail ? [p.thumbnail] : []),
    slug: p.slug || p.id || p._id,
    stock: p.stock_quantity ?? p.stock ?? 50,
    unit: p.unit || '১ প্যাক'
  }));

  // 6. Log to MongoDB collection 'ai_chat_messages'
  const sId = sessionId || ('ai_sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
  if (database) {
    try {
      await database.collection('ai_chat_messages').insertOne({
        sessionId: sId,
        session_id: sId,
        userId: userId || null,
        userName: userName || 'Customer',
        userMessage: trimmed,
        aiReply: aiReply,
        suggestedProducts: suggestedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          thumbnail: p.thumbnail,
          slug: p.slug
        })),
        createdAt: new Date().toISOString()
      });
    } catch (logErr) {
      console.warn('Could not log AI message to MongoDB:', logErr.message);
    }
  }

  return {
    success: true,
    sessionId: sId,
    reply: aiReply,
    suggestedProducts,
    quickReplies
  };
}

module.exports = {
  processAiMessage
};
