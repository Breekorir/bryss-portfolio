// ==============================================================================
// BRYSS PORTFOLIO - MAIN SCRIPT
// ==============================================================================

const SITE_CONFIG = {
  artistName: "Bryss",
  email: "artist@bryss.studio", // Replace with your real contact email
  location: "Kenya"
};

// 1. Initialize Site Identity
document.title = `${SITE_CONFIG.artistName} — Multidisciplinary Creative`;
document.querySelectorAll(".brand-name").forEach(el => {
  el.innerHTML = `${SITE_CONFIG.artistName.toUpperCase()}<br><small>CREATIVE PORTFOLIO</small>`;
});
const copyrightYear = document.getElementById("year");
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

const heroBottomSpan = document.querySelector(".hero-bottom span");
if (heroBottomSpan) {
  heroBottomSpan.textContent = `BASED IN ${SITE_CONFIG.location.toUpperCase()} · AVAILABLE FOR PROJECTS`;
}

// 2. Mobile Navigation Toggle
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// 3. Category Filtering Function
function applyFilter(category) {
  document.querySelectorAll(".filter").forEach(item => {
    item.classList.toggle("active", item.dataset.filter === category);
  });
  document.querySelectorAll(".project-card").forEach(card => {
    const cardCat = (card.dataset.category || "").toLowerCase();
    card.hidden = category !== "all" && cardCat !== category;
  });
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    applyFilter(button.dataset.filter);
  });
});

// 4. Enhanced Lightbox Modal
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxMediaWrap = document.getElementById("lightbox-media-wrap");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxCategory = document.getElementById("lightbox-category");
const lightboxDescription = document.getElementById("lightbox-description");
const lightboxVideoContainer = document.getElementById("lightbox-video-container");

function openLightbox({ title, category, image, description, video }) {
  if (!lightbox) return;
  lightboxTitle.textContent = title || "Untitled Work";
  lightboxCategory.textContent = (category || "PORTFOLIO").toUpperCase();
  lightboxDescription.textContent = description || "";

  if (image) {
    lightboxImage.src = image;
    lightboxImage.alt = title || "Artwork preview";
    lightboxMediaWrap.style.display = "flex";
  } else {
    lightboxMediaWrap.style.display = "none";
  }

  lightboxVideoContainer.innerHTML = "";
  if (video) {
    const videoBtn = document.createElement("a");
    videoBtn.className = "lightbox-video-action";
    videoBtn.href = video;
    videoBtn.target = "_blank";
    videoBtn.rel = "noopener noreferrer";
    videoBtn.innerHTML = `Watch Project Video <span>▶</span>`;
    lightboxVideoContainer.appendChild(videoBtn);
  }

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const closeBtn = document.getElementById("lightbox-close");
if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeLightbox();
});

// Attach lightbox trigger to existing static buttons
function bindStaticProjectCards() {
  document.querySelectorAll(".project-image").forEach(button => {
    button.addEventListener("click", () => {
      openLightbox({
        title: button.dataset.title,
        category: button.dataset.category,
        image: button.dataset.image,
        description: button.dataset.description,
        video: button.dataset.video
      });
    });
  });
}
bindStaticProjectCards();

// 5. Contact Enquiry Form
const enquiryForm = document.getElementById("enquiry-form");
if (enquiryForm) {
  enquiryForm.addEventListener("submit", e => {
    e.preventDefault();
    const note = document.getElementById("form-note");
    const data = new FormData(enquiryForm);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const project = data.get("project") || "";
    const message = data.get("message") || "";

    if (!SITE_CONFIG.email || SITE_CONFIG.email.includes("example.com")) {
      note.textContent = "Please set a valid artist email in script.js to receive inquiries directly.";
      note.style.color = "#e5a18b";
      return;
    }

    const subject = encodeURIComponent(`New Project Enquiry: ${project} - from ${name}`);
    const body = encodeURIComponent(
      `Hello Bryss,\n\nI would like to discuss a project with you.\n\n` +
      `Client Name: ${name}\n` +
      `Client Email: ${email}\n` +
      `Service: ${project}\n\n` +
      `Project Brief:\n${message}\n\n` +
      `Sent via BRYSS Portfolio`
    );

    window.location.href = `mailto:${SITE_CONFIG.email}?subject=${subject}&body=${body}`;
    note.textContent = "Your email client has been opened with your enquiry ready to send!";
    note.style.color = "#b9c98a";
  });
}

// 6. Dynamic Gallery Loader (Local Server API -> Supabase -> LocalStorage)
async function loadPublishedPortfolio() {
  let artworks = [];
  let source = '';

  // 1. Try Local Node Server API
  try {
    const res = await fetch('/api/artworks');
    if (res.ok) {
      const all = await res.json();
      artworks = all.filter(a => a.published);
      source = 'LOCAL SERVER';
    }
  } catch (e) {
    // Local server not running, continue to Supabase check
  }

  // 2. Try Supabase if server API was not available
  if (!artworks.length) {
    const cfg = window.BRYSS_SUPABASE || {};
    const isSupabaseReady = window.supabase && cfg.url && cfg.anonKey && 
      !cfg.url.includes("YOUR-PROJECT") && !cfg.anonKey.includes("YOUR_SUPABASE");

    if (isSupabaseReady) {
      try {
        const db = window.supabase.createClient(cfg.url, cfg.anonKey);
        const { data, error } = await db
          .from("artworks")
          .select("id, title, category, description, image_url, video_url")
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          artworks = data;
          source = 'SUPABASE CLOUD';
        }
      } catch (err) {
        console.warn("Could not fetch Supabase artworks:", err);
      }
    }
  }

  // 3. Fallback: Browser LocalStorage (Demo Mode) or Built-in Projects
  if (!artworks.length) {
    try {
      const localArtworks = JSON.parse(localStorage.getItem("bryss_demo_artworks") || "[]");
      const publishedLocal = localArtworks.filter(item => item.published);
      if (publishedLocal.length > 0) {
        artworks = publishedLocal;
        source = 'LOCAL DEMO';
      }
    } catch (e) {}
  }

  // 4. Fallback if offline/file protocol: Default embedded catalog
  if (!artworks.length) {
    artworks = [
      { id: "art-1", title: "The Commander", category: "murals", description: "Expressive mixed-media portrait with newspaper collage & distressing.", image_url: "assets/portrait-general-mixed-media.jpg", video_url: null, published: true },
      { id: "art-2", title: "The Shepherd (Lion & Lamb)", category: "murals", description: "Allegorical canvas painting depicting a protective lion shielding a young lamb.", image_url: "assets/the-shepherd-lion-lamb.jpg", video_url: null, published: true },
      { id: "art-3", title: "Character in Denim — One Piece", category: "sculpture", description: "Hand-crafted custom painted denim artwork featuring Luffy, Zoro and Brook.", image_url: "assets/one-piece-denim-art.jpeg", video_url: null, published: true },
      { id: "art-4", title: "Nairobidanie / Boondocks Denim", category: "sculpture", description: "Original hand-painted custom denim jeans featuring Riley Freeman.", image_url: "assets/boondocks-custom-denim.jpg", video_url: null, published: true },
      { id: "art-5", title: "Extraterrestrial Anatomy Set", category: "sculpture", description: "Hand-painted workwear 2-piece set with alien and anatomical skeleton ribcages.", image_url: "assets/alien-skeleton-wearable-set.jpg", video_url: null, published: true },
      { id: "art-6", title: "The Wanderer (Wood Relief Sculpture)", category: "sculpture", description: "Framed natural branch and twig assemblage relief sculpture.", image_url: "assets/the-wanderer-wood-sculpture.jpg", video_url: null, published: true },
      { id: "art-7", title: "One Love — Bob Marley Tribute", category: "murals", description: "High-contrast graphic portrait of Bob Marley in Pan-African colors.", image_url: "assets/bob-marley-rasta-portrait.jpg", video_url: null, published: true },
      { id: "art-8", title: "Dance in Motion", category: "murals", description: "Fluid figurative airbrush painting capturing two dancers.", image_url: "assets/dance-in-motion-airbrush.jpg", video_url: null, published: true },
      { id: "art-9", title: "BBS Creamy & Tasty (Commercial Mural)", category: "murals", description: "Custom restaurant wall mural with pop food art.", image_url: "assets/mural-cafe-creamy-tasty.jpg", video_url: null, published: true },
      { id: "art-10", title: "Studio Practice — Behind the Canvas", category: "photography", description: "Bryss captured in the studio during the initial sketching phase.", image_url: "assets/bryss-in-studio-sketching.jpg", video_url: null, published: true },
      { id: "art-12", title: "CHUNGAA — Music Video", category: "film", description: "Music video direction and editing for Mr Dope's 'Chungaa' - by SHOTSBYBRYSS.", image_url: "assets/chungaa-video.png", video_url: "https://www.youtube.com/results?search_query=Mr+Dope+Chungaa+Bryss", published: true },
      { id: "art-13", title: "COOGIE420 — SHINE", category: "film", description: "Official music video creative direction and video editing ('BRYSS COOKED THIS').", image_url: "assets/video-coogie-shine.jpg", video_url: "https://www.youtube.com/results?search_query=COOGIE420+SHINE+Bryss", published: true },
      { id: "art-14", title: "COOGIE420 — DOPAMINE", category: "film", description: "Cinematic visual storytelling and stylized editing ('Bryss... it').", image_url: "assets/video-coogie-dopamine.jpg", video_url: "https://www.youtube.com/results?search_query=COOGIE420+DOPAMINE+Bryss", published: true },
      { id: "art-15", title: "COOGIE420 — PUSH", category: "film", description: "High-energy editing and visual cuts ('BRYSS CHOPPED IT').", image_url: "assets/video-coogie-push.jpg", video_url: "https://www.youtube.com/results?search_query=COOGIE420+PUSH+Bryss", published: true },
      { id: "art-16", title: "COOGIE420 — FEELINGS", category: "film", description: "Night street cinematography and editing for 'FEELINGS'.", image_url: "assets/video-coogie-feelings.jpg", video_url: "https://www.youtube.com/results?search_query=FEELINGS+Coogie420+Bryss", published: true },
      { id: "art-17", title: "Redox Ether — 5:00 AM", category: "film", description: "Visual direction and music video styling ('WEAR_BRYSS IT').", image_url: "assets/video-redox-5am.jpg", video_url: "https://www.youtube.com/results?search_query=Redox+Ether+500+AM+Bryss", published: true }
    ];
    source = 'PORTFOLIO COLLECTION';
  }

  // If dynamic artworks found, populate the project grid
  if (artworks.length > 0) {
    const grid = document.querySelector(".project-grid");
    if (!grid) return;
    grid.innerHTML = "";

    artworks.forEach((art, index) => {
      const card = document.createElement("article");
      card.className = index === 0 ? "project-card project-large" : (art.category === 'film' ? "project-card project-wide" : "project-card");
      card.dataset.category = (art.category || "murals").toLowerCase();

      const imageBtn = document.createElement("button");
      imageBtn.className = "project-image";
      imageBtn.type = "button";
      imageBtn.style.backgroundImage = `linear-gradient(0deg, rgba(0,0,0,.42), transparent 55%), url("${art.image_url}")`;
      imageBtn.setAttribute("aria-label", `View ${art.title}`);

      const numSpan = document.createElement("span");
      numSpan.className = "project-number";
      numSpan.textContent = String(index + 1).padStart(2, "0");

      if (art.video_url || art.category === 'film') {
        const playSpan = document.createElement("span");
        playSpan.className = "play-symbol";
        playSpan.textContent = "▶";
        imageBtn.appendChild(playSpan);
      }

      const viewSpan = document.createElement("span");
      viewSpan.className = "view-project";
      viewSpan.textContent = "VIEW PROJECT ↗";

      imageBtn.append(numSpan, viewSpan);

      // Lightbox click
      imageBtn.addEventListener("click", () => {
        openLightbox({
          title: art.title,
          category: art.category,
          image: art.image_url,
          description: art.description,
          video: art.video_url
        });
      });

      const meta = document.createElement("div");
      meta.className = "project-meta";
      const info = document.createElement("div");
      const catP = document.createElement("p");
      catP.textContent = (art.category || "").toUpperCase();
      const titleH3 = document.createElement("h3");
      titleH3.textContent = art.title;
      info.append(catP, titleH3);

      const arrow = document.createElement("span");
      arrow.textContent = "↗";
      meta.append(info, arrow);

      card.append(imageBtn, meta);
      grid.appendChild(card);
    });

    // Update filter counts
    const allFilter = document.querySelector('.filter[data-filter="all"]');
    if (allFilter) {
      allFilter.innerHTML = `All work <span>${String(artworks.length).padStart(2, "0")}</span>`;
    }
    const galleryHint = document.querySelector(".gallery-hint");
    if (galleryHint) {
      galleryHint.textContent = `PUBLISHED WORK · MANAGED VIA ARTIST DASHBOARD (${source})`;
    }
  }
}

// Run loader on load
loadPublishedPortfolio();
