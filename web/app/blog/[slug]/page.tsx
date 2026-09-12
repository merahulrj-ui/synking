import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Shield,
  Sparkles,
  Lock,
  Zap,
  Coffee,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

interface ArticleData {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  image: string;
  keyTakeaways: string[];
  sections: {
    heading: string;
    content: string[];
  }[];
}

const ARTICLES: Record<string, ArticleData> = {
  'why-sharing-phone-numbers-on-dating-apps-is-dangerous': {
    slug: 'why-sharing-phone-numbers-on-dating-apps-is-dangerous',
    title: 'Why Sharing Your Phone Number on Dating Apps is a Major Security Risk',
    subtitle: 'From Truecaller identity lookups to persistent WhatsApp harassment, why zero-knowledge in-app calling is the new gold standard.',
    excerpt:
      'From Truecaller identity lookups to unsolicited WhatsApp spam, discover why zero-knowledge WebRTC in-app calling is the new gold standard for modern romance.',
    category: 'Privacy & Safety',
    readTime: '4 min read',
    date: 'Sept 2026',
    author: 'Synkin Security Research Team',
    authorRole: 'Applied Cryptography & User Safety',
    image:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
    keyTakeaways: [
      'A 10-digit mobile number reveals full names, home addresses, social profiles, and bank-linked UPI IDs via public databases.',
      'Blocking on WhatsApp or telecom networks does not erase your number from an aggressive stranger’s phonebook.',
      'Synkin uses peer-to-peer WebRTC with DTLS 1.2 and SRTP encryption, keeping your SIM card identity completely hidden.',
      'Two-Way Consent ensures no call or media stream can connect without mutual approval from both participants.',
    ],
    sections: [
      {
        heading: 'The Digital Footprint of a 10-Digit Mobile Number',
        content: [
          'In the modern Indian digital ecosystem, your phone number is no longer just a communication pipe—it is your master national identity key. Through caller identification apps like Truecaller, social graph aggregators, and UPI payment lookups, sharing your number with a stranger exposes your full legal name, social handles, approximate neighborhood, and banking handles in less than 30 seconds.',
          'For female singles in particular, handing over a phone number before meeting in person often leads to unwanted WhatsApp calls, late-night voice notes, and profile stalkers that persist even after unmatching on traditional dating platforms.',
        ],
      },
      {
        heading: 'The Flaw in Traditional "Block & Unmatch" Systems',
        content: [
          'When you unmatch someone on Tinder or Bumble after exchanging numbers, the dating app loses all jurisdiction over your safety. The other person retains your contact permanently in their personal device contacts, leaving you vulnerable to cross-platform tracking and spam from secondary VoIP numbers.',
          'True safety requires a zero-knowledge architecture where neither party ever learns the other’s phone number, email address, or permanent identifiers. All voice, video, and text communication must stay ephemeral and enclosed within encrypted sandbox boundaries.',
        ],
      },
      {
        heading: 'How Synkin Implements Zero-Exposure Calling',
        content: [
          'Synkin was engineered from the ground up to eradicate phone number disclosure entirely. When two sparks match on Synkin, all media flows over encrypted WebRTC channels with SRTP (Secure Real-Time Transport Protocol). No media server records your conversation, and no user interface ever renders a phone number.',
          'Furthermore, our Two-Way Consent Approval Window guarantees that unsolicited calls are impossible. If a match taps the call button, an explicit incoming approval request appears. The call only initiates if both users actively choose to connect within a 30-second window.',
        ],
      },
    ],
  },
  'how-the-3-minute-video-vibe-check-eliminates-catfishing': {
    slug: 'how-the-3-minute-video-vibe-check-eliminates-catfishing',
    title: 'The Death of Catfishing: How a 3-Minute Video Call Replaces Two Weeks of Texting',
    subtitle: 'Swiping fatigue is real. Learn how real-time micro-expressions, genuine laughter, and timed consent windows save singles from ghosting.',
    excerpt:
      'Swiping fatigue is real. Learn how real-time micro-expressions, genuine laughter, and timed consent windows save singles from ghosting and dry texting.',
    category: 'Dating Culture',
    readTime: '5 min read',
    date: 'Sept 2026',
    author: 'Tara Roy',
    authorRole: 'Dating Culture & Behavioral Insights',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80',
    keyTakeaways: [
      'Over 68% of dating app users report swiping fatigue and burnout from endless, repetitive text conversations.',
      'Static photos and heavy AI beautification filters create unrealistic expectations that result in disappointing first dates.',
      'A timed 3-minute video vibe check reveals voice timbre, facial micro-expressions, and authentic chemistry instantly.',
      'Timed calls eliminate the awkwardness of prolonged calls while completely disarming catfishing and bots.',
    ],
    sections: [
      {
        heading: 'The Modern Curse of Endless Texting',
        content: [
          'Modern dating has devolved into an administrative chore. Matches spend 10 to 14 days trading monotonous messages—"Hey, how was your Monday?", "Did you have lunch?", "Any weekend plans?"—only to discover in the first five seconds of an in-person meeting that zero romantic or conversational chemistry exists.',
          'This dynamic produces "textual intimacy illusion", where people fall in love with an idealized version of a persona created through curated text messages, rather than the living, breathing person behind the screen.',
        ],
      },
      {
        heading: 'Chemistry Cannot Be Felt Through Text Alone',
        content: [
          'Romantic attraction is governed by subtle biological and psychological cues: the sound of someone’s natural laugh, the tempo of their speech, how their eyes crinkle when amused, and whether conversation flows with unforced ease. None of these cues can be accurately transmitted through emojis or polished text.',
          'By introducing a structured 3-minute video check-in, matches bypass weeks of dry text exchanges. In just 180 seconds, both individuals immediately know whether they want to plan a coffee date or gracefully move forward.',
        ],
      },
      {
        heading: 'Zero Pressure: The Power of a Timed Window',
        content: [
          'One of the greatest deterrents to video calling on dating apps has always been social anxiety: "What if it gets awkward and I don’t know how to hang up?"',
          'Synkin solves this psychological barrier by hard-coding a strict 3-minute timer directly into the call interface. Both participants know that the call will automatically conclude when the timer expires. If the spark is real, both can choose to extend or head out to a verified daylight date spot.',
        ],
      },
    ],
  },
  'best-first-date-coffee-spots-in-delhi-ncr-and-bengaluru': {
    slug: 'best-first-date-coffee-spots-in-delhi-ncr-and-bengaluru',
    title: 'Top 10 Daylight First Date Cafes in Delhi NCR & Bengaluru (2026 Guide)',
    subtitle: 'Curated cafes offering vibrant daylight ambiance, artisanal pour-overs, relaxed seating, and low-pressure first encounters.',
    excerpt:
      'Explore curated partner cafes from Blue Tokai to Third Wave Coffee offering vibrant daylight ambiance, artisanal pour-overs, and low-pressure first encounters.',
    category: 'City Guides',
    readTime: '6 min read',
    date: 'Sept 2026',
    author: 'Synkin Editorial Bureau',
    authorRole: 'Urban Lifestyle & Hospitality',
    image:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    keyTakeaways: [
      'Daylight first dates in public cafes drastically improve safety, comfort, and conversation quality for both partners.',
      'Low-stakes coffee encounters (45–60 minutes) prevent the emotional burden and financial stress of expensive dinner dates.',
      'Delhi NCR highlights include Blue Tokai Champa Gali, Diggin Anand Lok, and Colocal Dhan Mill.',
      'Bengaluru top picks include Third Wave Indiranagar, Maverick & Farmer Ulsoor, and Araku Coffee 12th Main.',
    ],
    sections: [
      {
        heading: 'Why Daylight Coffee Beats Dinner & Drinks Every Time',
        content: [
          'Committing to an elaborate multi-course dinner or noisy pub on a first date is high-stakes, expensive, and difficult to escape if there is no mutual spark. If the conversation flags, sitting across from each other for two hours over appetizers becomes an agonizing trial.',
          'Daylight cafe dates, conversely, are inherently casual and low-pressure. Grabbing an artisanal flat white or cold brew allows for an effortless 45-minute chat. If sparks fly, the date can naturally transition to an afternoon walk or lunch; if not, either person can finish their cup and depart amicably.',
        ],
      },
      {
        heading: 'Top Curated Spots in Delhi NCR',
        content: [
          '1. Blue Tokai Coffee Roasters (Champa Gali, Saket): Lush rustic greenery, fairy lights, and spacious outdoor seating make it an intimate yet open setting for effortless banter.',
          '2. Diggin (Opposite Gargi College, Anand Lok): Beautiful brickwork, potted plants, and warm daylight ambiance make it a timeless Delhi favorite for romantic afternoon dates.',
          '3. Colocal "The Cacao Post" (The Dhan Mill, Chhatarpur): For chocolate and specialty coffee enthusiasts, this sprawling European-style courtyard offers world-class hot chocolate and relaxed seating.',
        ],
      },
      {
        heading: 'Top Curated Spots in Bengaluru',
        content: [
          '1. Maverick & Farmer Coffee (Gangadhar Chetty Rd, Ulsoor): Overlooking the serene lake with generous breeze and experimental brews, it is one of Bengaluru’s best outdoor date sanctuaries.',
          '2. Araku Coffee (12th Main Rd, Indiranagar): An architectural masterpiece designed by Jorge Najera, featuring organic tribal coffee, sunlight-flooded atriums, and gourmet bakery items.',
          '3. Third Wave Coffee (Koramangala 4th Block): Energetic, welcoming, and perfect for young tech and creative professionals meeting between work hours.',
        ],
      },
    ],
  },
  'nearest-first-dating-solving-the-metropolitan-traffic-problem': {
    slug: 'nearest-first-dating-solving-the-metropolitan-traffic-problem',
    title: 'Nearest-First Dating: Why Meeting Singles in Walking Distance Changes Everything',
    subtitle: 'Matching with someone 35km away across city traffic rarely turns into a date. How proximity radar prioritizes your street, local hub, and metro corridor.',
    excerpt:
      'Matching with someone 35km away across city traffic rarely turns into a date. How proximity radar prioritizes your street, local hub, and metro corridor.',
    category: 'Tech & Proximity',
    readTime: '4 min read',
    date: 'Sept 2026',
    author: 'Vikram Sethi',
    authorRole: 'Geospatial Engineering Lead',
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    keyTakeaways: [
      'The average urban commute in Delhi NCR or Bengaluru turns a 25km date into a 90-minute traffic battle, causing high cancellation rates.',
      'Over 74% of dating matches located beyond 15km never progress past text messages.',
      'Synkin’s Nearest-First Waterfall Radar prioritizes walking-distance sparks (500m–2km) before expanding outward.',
      'Spontaneous dating eliminates scheduling friction: meet for a 20-minute coffee right around your corner tonight.',
    ],
    sections: [
      {
        heading: 'The Geography of Modern Loneliness',
        content: [
          'Traditional swipe algorithms are geographically lazy. They match users across arbitrary 50km radius circles without considering urban infrastructure, metro lines, or peak-hour commute times. A match between Gurgaon and Noida or Whitefield and Malleshwaram sounds fine on a map, but in reality, it represents a 3-hour round-trip ordeal that few busy professionals are willing to undertake on a weekday.',
          'The result is a graveyard of abandoned chats where both parties like each other in theory, but the logistical hurdle of meeting prevents real-world romance from ever taking place.',
        ],
      },
      {
        heading: 'The 15-Minute City Applied to Romance',
        content: [
          'Urban planners have long championed the "15-Minute City"—the idea that everything a human needs for a fulfilling life should be reachable within a 15-minute walk or bike ride. Synkin applies this identical spatial logic to romantic discovery.',
          'By calculating true walking distance and metro transit corridors, Synkin surfaces people who are actually in your immediate sphere: your neighborhood market, your office tech park, or your local favorite cafe. When a date is only a 5-minute stroll away, the barrier to saying "Let’s grab a cup of coffee right now" drops to zero.',
        ],
      },
      {
        heading: 'Waterfall Density: Never An Empty Screen',
        content: [
          'A common failure of proximity apps in smaller suburbs is the "empty radar" problem. Synkin solves this with its proprietary Waterfall Radar algorithm.',
          'The radar begins by querying the tightest proximity radius (500m–2km). If local density is high, you see immediate neighbors. If you are in a quieter area, the algorithm smoothly expands in concentric rings (5km → 15km → Pan-India), ensuring you always discover verified, high-compatibility sparks no matter where you travel.',
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = ARTICLES[slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#07050d] text-white selection:bg-[#FD3A73] selection:text-white font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#FD3A73]/15 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[-10%] h-[600px] w-[600px] rounded-full bg-purple-700/15 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07050d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-lg shadow-[#FD3A73]/30">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0A0714] p-1.5 overflow-hidden">
                <img
                  src="/images/logo_emblem.png"
                  alt="Synkin Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white">
                Synkin<span className="text-[#FD3A73]">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#FD3A73] -mt-1">
                Insights & Guides
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Articles</span>
            </Link>
            <Link
              href="/app"
              className="rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              Launch Web App →
            </Link>
          </div>
        </div>
      </header>

      {/* Article Container */}
      <main className="max-w-4xl mx-auto px-6 pt-10 pb-28">
        {/* Breadcrumb / Back */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#FD3A73] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to The Synkin Journal</span>
          </Link>
        </div>

        {/* Category & Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
          <span className="rounded-full bg-[#FD3A73]/15 border border-[#FD3A73]/30 px-3 py-1 font-bold text-[#FD3A73]">
            {article.category}
          </span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {article.date}
          </span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readTime}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
          {article.title}
        </h1>
        <p className="text-base sm:text-lg text-zinc-300 font-medium leading-relaxed mb-8">
          {article.subtitle}
        </p>

        {/* Author Card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-md mb-10">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#FD3A73] to-[#8E2DE2] p-0.5 shadow-md shadow-[#FD3A73]/20 shrink-0">
            <div className="h-full w-full rounded-[14px] bg-[#0A0714] p-1.5 flex items-center justify-center overflow-hidden">
              <img
                src="/images/logo_emblem.png"
                alt="Synkin Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-white">{article.author}</div>
            <div className="text-[11px] text-zinc-400">{article.authorRole}</div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 mb-12 shadow-2xl">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Key Takeaways Callout */}
        <div className="rounded-3xl border border-[#FD3A73]/30 bg-[#FD3A73]/5 p-6 sm:p-8 backdrop-blur-xl mb-14">
          <div className="flex items-center gap-2 text-[#FD3A73] font-bold text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="uppercase tracking-wider text-xs">Key Insights & Takeaways</span>
          </div>
          <ul className="space-y-3">
            {article.keyTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-200">
                <CheckCircle2 className="h-4 w-4 text-[#FD3A73] shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Article Body Sections */}
        <div className="space-y-12">
          {article.sections.map((section, sIdx) => (
            <section key={sIdx} className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight border-b border-white/5 pb-3">
                {section.heading}
              </h2>
              {section.content.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal"
                >
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* CTA Box */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-[#0A0714] p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#FD3A73]/20 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Stop Collecting Pen-Pals. Catch A Real Spark Tonight.
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-6">
            Join thousands of singles discovering walking-distance connections with zero phone number exposure and two-way consent calling.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#FD3A73] to-[#8E2DE2] px-7 py-3 text-xs font-bold text-white shadow-lg shadow-[#FD3A73]/30 hover:brightness-110 active:scale-95 transition-all"
            >
              Launch Web App Now →
            </Link>
            <Link
              href="/download/apk"
              className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-xs font-bold text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone className="h-4 w-4 text-[#FD3A73]" />
              <span>Download Android APK</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050308] py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo_emblem.png" alt="Logo" className="w-4 h-4 object-contain" />
            <span>© 2026 Synkin · Jayanti Cybernetics (SMD Group). All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/blog" className="text-[#FD3A73] hover:underline font-semibold">Blogs</Link>
            <Link href="/app" className="hover:text-white">Web App</Link>
            <Link href="/safety" className="hover:text-white">Safety</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
