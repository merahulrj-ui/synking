/**
 * ==============================================================================
 * SYNKIN WEB APP CONTROLLER (Swipe Deck, Radar Search & Verified Venues)
 * ==============================================================================
 * Realtime Dating Platform - Web Client
 * Features:
 *   1. Tinder-Style Card Stack (Fetch live from /api/profiles)
 *   2. Smooth Swipe Left (Pass) / Swipe Right (Like) with animations
 *   3. 360° Radar Search & Filter by Interests / Distance
 *   4. Verified Safe 1st Date Venues (Explore Spots & Perks)
 * ==============================================================================
 */

(function(root) {
  'use strict';

  // Fallback Verified Venues Data (Matches mobile src/constants/mockData.ts)
  const VERIFIED_VENUES = [
    {
      id: 'v1',
      name: 'Blue Tokai Coffee Roasters',
      area: 'Connaught Place & Cyber Hub',
      city: 'Delhi NCR',
      vibe: 'Artisan Coffee & Calm Vibes',
      price: '₹₹',
      perk: 'Free Dessert On 1st Date 🍰',
      safetyBadge: '100% Verified Safe · Scam-Proof 🛡️',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    },
    {
      id: 'v2',
      name: 'Diggin Cafe',
      area: 'Chanakyapuri & Anand Lok',
      city: 'Delhi NCR',
      vibe: 'Fairy Lights & Romantic Italian',
      price: '₹₹₹',
      perk: 'Priority Table Reservation 🍷',
      safetyBadge: 'Verified Couple Friendly 🛡️',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    },
    {
      id: 'v3',
      name: 'Cyber Hub Social',
      area: 'DLF Cyber City',
      city: 'Gurgaon',
      vibe: 'High-Energy Music & Cocktails',
      price: '₹₹',
      perk: 'Complimentary Welcome Drink 🍸',
      safetyBadge: 'Verified Safe Nightspot 🛡️',
      image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
    },
    {
      id: 'v4',
      name: 'The Piano Man Jazz Club',
      area: 'Safdarjung Enclave',
      city: 'Delhi',
      vibe: 'Live Jazz & Candlelight Dinner',
      price: '₹₹₹',
      perk: '15% Off Total Bill for Synkin Members 🎷',
      safetyBadge: 'Verified Safe Atmosphere 🛡️',
      image: 'https://images.unsplash.com/photo-1485686531765-ba63b07845a7?w=800',
    },
  ];

  class SynkinWebAppClass {
    constructor() {
      this.profiles = [];
      this.currentCardIndex = 0;
      this.activeTab = 'swipe'; // 'swipe' | 'radar' | 'venues'
      this.searchQuery = '';
      this.selectedTag = 'all';
      this.likedProfiles = [];
      this.passedProfiles = [];
      this.isDragging = false;
      this.startX = 0;
      this.currentX = 0;
    }

    // Initialize Web App Data
    async init() {
      await this.fetchProfiles();
      this.renderCurrentCard();
      this.renderRadarGrid();
      this.renderVenuesList();
    }

    // Fetch Live Profiles from Server
    async fetchProfiles() {
      try {
        const res = await fetch('/api/profiles');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            this.profiles = data;
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch profiles from server, using local pool:', err);
      }

      // Default high-converting profiles pool
      this.profiles = [
        {
          id: 'p1',
          name: 'Ananya',
          age: 23,
          location: 'Roorkee · 1.2 km away',
          occupation: 'Architecture Student',
          bio: 'Cold brews, spontaneous indie gigs & aesthetic cafe hopping. Let’s skip small talk and see if our vibe matches! ☕✨',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
          interests: ['Coffee', 'Architecture', 'Indie Music', 'Art'],
          isVerified: true,
        },
        {
          id: 'p2',
          name: 'Priya',
          age: 24,
          location: 'Roorkee · 2.5 km away',
          occupation: 'UI/UX Designer',
          bio: 'Looking for electric attraction & someone who actually shows up. Big fan of late-night drives & Italian pizza 🍕💫',
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
          interests: ['Design', 'Travel', 'Late Drives', 'Foodie'],
          isVerified: true,
        },
        {
          id: 'p3',
          name: 'Riya',
          age: 22,
          location: 'Haridwar · 12 km away',
          occupation: 'Digital Marketer',
          bio: 'Can talk about philosophy or memes for hours. 3-min video vibe check is my favorite feature here! 📹🔥',
          photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
          interests: ['Memes', 'Psychology', 'Photography', 'Pilates'],
          isVerified: true,
        },
        {
          id: 'p4',
          name: 'Sneha',
          age: 25,
          location: 'Dehradun · 25 km away',
          occupation: 'Content Creator',
          bio: 'Chai over coffee always. If you can make me laugh in the first 2 minutes, dessert is on me! 🍰✨',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
          interests: ['Chai', 'Standup Comedy', 'Mountains', 'Reading'],
          isVerified: true,
        }
      ];
    }

    // Switch Web App Sub-Tabs
    switchTab(tabName) {
      this.activeTab = tabName;
      const tabs = ['swipe', 'radar', 'venues'];
      tabs.forEach(t => {
        const viewEl = document.getElementById('webapp-view-' + t);
        const btnEl = document.getElementById('webapp-nav-' + t);
        if (viewEl && btnEl) {
          if (t === tabName) {
            viewEl.classList.remove('hidden');
            btnEl.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30';
          } else {
            viewEl.classList.add('hidden');
            btnEl.className = 'px-4 py-2 rounded-xl text-xs font-bold transition text-gray-400 hover:text-white bg-white/5 hover:bg-white/10';
          }
        }
      });

      if (tabName === 'radar') {
        this.renderRadarGrid();
      }
    }

    // Render Current Card in Swipe Deck
    renderCurrentCard() {
      const container = document.getElementById('swipe-card-container');
      if (!container) return;

      if (this.currentCardIndex >= this.profiles.length) {
        container.innerHTML = `
          <div class="h-[480px] w-full flex flex-col items-center justify-center text-center p-8 bg-[#180F33] rounded-3xl border border-white/10">
            <div class="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-3xl mb-4">
              ✨
            </div>
            <h3 class="text-xl font-bold text-white mb-2">You've Explored All Nearby Sparks!</h3>
            <p class="text-xs text-gray-400 max-w-xs mb-6">Expand your radius or switch to 360° Radar to discover more singles nearby.</p>
            <button onclick="SynkinWebApp.resetSwipeDeck()" class="gradient-glow-btn px-6 py-3 rounded-full text-xs font-bold text-white flex items-center gap-2">
              <span>🔄 Reset Swipe Deck</span>
            </button>
          </div>
        `;
        return;
      }

      const p = this.profiles[this.currentCardIndex];
      const photoUrl = p.photo || (p.photos && p.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';
      const locStr = typeof p.location === 'object' ? (p.location.city || 'Roorkee') : (p.location || 'Roorkee');
      const distStr = p.distance ? ` · ${p.distance}` : ' · Nearby';

      const tagsHtml = (p.interests || ['Coffee', 'Music', 'Travel']).map(t => 
        `<span class="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-semibold text-pink-200 border border-white/10">#${t}</span>`
      ).join('');

      container.innerHTML = `
        <div id="active-swipe-card" class="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-300 select-none cursor-grab">
          <!-- Background Photo -->
          <img src="${photoUrl}" alt="${p.name}" class="w-full h-full object-cover pointer-events-none" />

          <!-- Gradient Overlays -->
          <div class="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-[#0A0714]/40 to-transparent"></div>
          <div class="absolute top-0 left-0 right-0 p-5 flex items-center justify-between">
            <span class="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-bold text-green-400 border border-green-500/30 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Online Nearby
            </span>
            <span class="px-3 py-1 rounded-full bg-pink-500/20 backdrop-blur-md text-[11px] font-bold text-pink-300 border border-pink-500/30">
              🛡️ Verified Spark
            </span>
          </div>

          <!-- Bottom Profile Details -->
          <div class="absolute bottom-0 left-0 right-0 p-6 space-y-3">
            <div class="flex items-baseline gap-2">
              <h2 class="text-2xl font-extrabold text-white font-display">${p.name}</h2>
              <span class="text-xl font-bold text-pink-400">${p.age}</span>
            </div>

            <div class="flex items-center gap-2 text-xs text-gray-300 font-medium">
              <span>📍 ${locStr}${distStr}</span>
              ${p.occupation ? `<span>• 💼 ${p.occupation}</span>` : ''}
            </div>

            <p class="text-xs text-gray-300 leading-relaxed line-clamp-3">
              ${p.bio || 'Looking for real connections and spontaneous coffee dates! ☕'}
            </p>

            <div class="flex flex-wrap gap-1.5 pt-1">
              ${tagsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // Action: Swipe Right (Like / Synk)
    swipeRight() {
      if (this.currentCardIndex >= this.profiles.length) return;
      const card = document.getElementById('active-swipe-card');
      const p = this.profiles[this.currentCardIndex];

      if (card) {
        card.style.transform = 'translateX(600px) rotate(30deg)';
        card.style.opacity = '0';
      }

      this.likedProfiles.push(p);

      // Trigger backend like request
      try {
        fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: p.id, action: 'like' }),
        }).catch(() => {});
      } catch (e) {}

      // Show match nudge toast
      this.showToast(`💖 You liked ${p.name}! Request sent.`);

      setTimeout(() => {
        this.currentCardIndex++;
        this.renderCurrentCard();
      }, 250);
    }

    // Action: Swipe Left (Pass / Nope)
    swipeLeft() {
      if (this.currentCardIndex >= this.profiles.length) return;
      const card = document.getElementById('active-swipe-card');
      const p = this.profiles[this.currentCardIndex];

      if (card) {
        card.style.transform = 'translateX(-600px) rotate(-30deg)';
        card.style.opacity = '0';
      }

      this.passedProfiles.push(p);

      setTimeout(() => {
        this.currentCardIndex++;
        this.renderCurrentCard();
      }, 250);
    }

    // Action: Rewind Last Card
    rewind() {
      if (this.currentCardIndex > 0) {
        this.currentCardIndex--;
        this.renderCurrentCard();
        this.showToast('🔄 Rewound to previous profile');
      }
    }

    // Action: 3-Min Vibe Check (Instant Video Call Trigger)
    triggerVibeCheck() {
      if (this.currentCardIndex >= this.profiles.length) return;
      const p = this.profiles[this.currentCardIndex];
      alert(`📹 3-Min Private Video Vibe Check initiated with ${p.name}!\n\nConnecting end-to-end encrypted WebRTC channel... (Demo Active)`);
    }

    resetSwipeDeck() {
      this.currentCardIndex = 0;
      this.renderCurrentCard();
    }

    // Render Radar Search Grid
    renderRadarGrid() {
      const grid = document.getElementById('radar-grid-container');
      if (!grid) return;

      const filtered = this.profiles.filter(p => {
        const matchesQuery = !this.searchQuery || 
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (p.bio && p.bio.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (typeof p.location === 'string' && p.location.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (p.interests && p.interests.some(i => i.toLowerCase().includes(this.searchQuery.toLowerCase())));

        const matchesTag = this.selectedTag === 'all' ||
          (p.interests && p.interests.some(i => i.toLowerCase() === this.selectedTag.toLowerCase()));

        return matchesQuery && matchesTag;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-12 text-center text-gray-400">
            <p class="text-sm">No profiles found matching "${this.searchQuery}". Try different keywords!</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(p => {
        const photoUrl = p.photo || (p.photos && p.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800';
        const loc = typeof p.location === 'object' ? (p.location.city || 'Roorkee') : (p.location || 'Roorkee');
        return `
          <div class="glass-card rounded-2xl overflow-hidden group hover:scale-[1.02] transition border border-white/10">
            <div class="relative h-48 w-full overflow-hidden">
              <img src="${photoUrl}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div>
                  <h4 class="font-bold text-base">${p.name}, <span class="text-pink-400">${p.age}</span></h4>
                  <p class="text-[11px] text-gray-300">📍 ${loc}</p>
                </div>
                <span class="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" title="Online"></span>
              </div>
            </div>
            <div class="p-4 space-y-2.5">
              <p class="text-xs text-gray-300 line-clamp-2">${p.bio || 'Exploring new vibes & coffee dates.'}</p>
              <div class="flex items-center justify-between pt-2 border-t border-white/5">
                <button onclick="SynkinWebApp.likeFromRadar('${p.id}', '${p.name}')" class="px-4 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 font-bold text-xs border border-pink-500/30 transition flex items-center gap-1.5">
                  <span>💖 Connect</span>
                </button>
                <button onclick="alert('Starting 3-min private video call with ${p.name}...') " class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-semibold transition flex items-center gap-1">
                  <span>📹 Call</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    likeFromRadar(id, name) {
      this.showToast(`💖 You connected with ${name}!`);
      try {
        fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: id, action: 'like' }),
        }).catch(() => {});
      } catch (e) {}
    }

    setFilterTag(tag) {
      this.selectedTag = tag;
      const pills = ['all', 'coffee', 'music', 'travel', 'foodie'];
      pills.forEach(p => {
        const el = document.getElementById('filter-pill-' + p);
        if (el) {
          if (p === tag) {
            el.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition bg-pink-600 text-white';
          } else {
            el.className = 'px-3 py-1.5 rounded-xl text-xs font-bold transition text-gray-400 bg-white/5 hover:text-white';
          }
        }
      });
      this.renderRadarGrid();
    }

    handleSearchInput(val) {
      this.searchQuery = val;
      this.renderRadarGrid();
    }

    // Render Curated Date Spots
    renderVenuesList() {
      const container = document.getElementById('venues-list-container');
      if (!container) return;

      container.innerHTML = VERIFIED_VENUES.map(v => `
        <div class="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/40 transition">
          <div class="relative h-44 w-full">
            <img src="${v.image}" alt="${v.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-transparent to-transparent"></div>
            <span class="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-green-400 border border-green-500/30">
              ${v.safetyBadge}
            </span>
          </div>
          <div class="p-5 space-y-2">
            <div class="flex items-start justify-between">
              <div>
                <h4 class="font-bold text-white text-base">${v.name}</h4>
                <p class="text-xs text-gray-400">${v.area} · ${v.city}</p>
              </div>
              <span class="text-xs font-bold text-pink-400 font-mono">${v.price}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-xs text-pink-300 font-medium">
              🎁 ${v.perk}
            </div>
            <div class="flex items-center justify-between pt-2">
              <span class="text-xs text-gray-400">Atmosphere: <strong class="text-gray-200">${v.vibe}</strong></span>
              <button onclick="alert('Date spot selected! You can invite your match to meet at ${v.name}.')" class="px-4 py-2 rounded-xl gradient-glow-btn text-xs font-bold text-white">
                Invite to Date ☕
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Toast Notification
    showToast(msg) {
      let toast = document.getElementById('webapp-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'webapp-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full bg-[#180F33] border border-pink-500/40 text-white font-bold text-xs shadow-2xl backdrop-blur-lg transition-all duration-300 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
      }
      toast.innerText = msg;
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
      }, 2500);
    }
  }

  root.SynkinWebApp = new SynkinWebAppClass();

})(typeof window !== 'undefined' ? window : this);
