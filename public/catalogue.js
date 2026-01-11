/* RetraLabs Catalogue (LyzeLabs-style grid + modal)
 *
 * Renders #catalogue-grid and a simple product modal for variant selection.
 * Add-to-cart is delegated to public/cart.js via .btn-add-to-research.
 */

(() => {
  const PRODUCTS = [
    {
      key: "retatrutide",
      name: "Retatrutide",
      subtitle: "Triple agonist — premium research grade",
      badges: ["FLAGSHIP", "MOST POPULAR"],
      rating: 4.8,
      imageSrc: "/images/products/retatrutide.webp",
      variants: [
        { dosage: 5, price: 11000, status: "IN STOCK" },
        { dosage: 10, price: 18000, status: "LIMITED" },
      ],
    },
    {
      key: "ghk-cu",
      name: "GHK-Cu",
      subtitle: "Premium peptide — stability verified",
      badges: ["FLAGSHIP"],
      rating: 4.8,
      imageSrc: "/images/products/ghk-cu.webp",
      variants: [],
      comingSoon: true,
    },
    {
      key: "hgh-191aa",
      name: "HGH 191AA",
      subtitle: "Somatropin — standard growth hormone",
      badges: ["FLAGSHIP"],
      rating: 4.8,
      imageSrc: "/images/products/hgh-191aa.webp",
      variants: [],
      comingSoon: true,
    },
    {
      key: "igf-1-lr3",
      name: "IGF-1 LR3",
      subtitle: "Pharmaceutical-grade analogue",
      badges: ["FLAGSHIP"],
      rating: 4.8,
      imageSrc: "/images/products/igf-1-lr3.webp",
      variants: [],
      comingSoon: true,
    },
    {
      key: "tirzepatide",
      name: "Tirzepatide",
      subtitle: "Dual agonist — queue opening soon",
      badges: ["FLAGSHIP"],
      rating: 4.8,
      imageSrc: "/images/products/tirzepatide.webp",
      variants: [],
      comingSoon: true,
    },
  ];

  const fmtINR = (n) =>
    `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const byId = (id) => document.getElementById(id);

  function pill(text, kind = "accent") {
    const cls =
      kind === "accent"
        ? "bg-accent text-charcoal"
        : kind === "dark"
          ? "bg-charcoal text-white"
          : "bg-white/80 text-charcoal border border-charcoal/10";

    return `<span class="${cls} text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full">${text}</span>`;
  }

  function imageSvg(label = "RetraLabs") {
    return `
      <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
            <stop stop-color="#FFFFFF"/>
            <stop offset="1" stop-color="#F5F5F7"/>
          </linearGradient>
          <linearGradient id="glow" x1="60" y1="30" x2="180" y2="130" gradientUnits="userSpaceOnUse">
            <stop stop-color="#00D2D3" stop-opacity="0.18"/>
            <stop offset="1" stop-color="#00D2D3" stop-opacity="0.04"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="240" height="160" rx="24" fill="url(#bg)"/>
        <circle cx="120" cy="80" r="60" fill="url(#glow)"/>
        <rect x="104" y="40" width="32" height="80" rx="12" fill="#0A0A0A" fill-opacity="0.06" stroke="#0A0A0A" stroke-opacity="0.08"/>
        <path d="M104 82c0-6 32-6 32 0v22c0 6-32 6-32 0V82Z" fill="#00D2D3" fill-opacity="0.35"/>
        <rect x="108" y="34" width="24" height="8" rx="4" fill="#00D2D3"/>
        <text x="120" y="146" text-anchor="middle" fill="#0A0A0A" fill-opacity="0.35" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="800" letter-spacing="2">
          ${String(label).toUpperCase()}
        </text>
      </svg>
    `;
  }

  function renderImage(p) {
    // Always render a placeholder. If image exists, it sits above and hides itself on error.
    const placeholder = `
      <div class="absolute inset-0">
        ${imageSvg(p.name)}
      </div>
    `;

    if (!p.imageSrc) {
      return `<div class="relative w-full h-full">${placeholder}</div>`;
    }

    return `
      <div class="relative w-full h-full">
        ${placeholder}
        <img
          src="${p.imageSrc}"
          alt="${p.name}"
          class="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          onerror="this.style.display='none'"
        />
      </div>
    `;
  }

  function renderCard(p) {
    const variantsCount = p.variants?.length ?? 0;
    const hasVariants = variantsCount > 0;
    const isComingSoon = !!p.comingSoon || !hasVariants;

    const firstPrice = hasVariants ? p.variants[0].price : null;
    const perVial = hasVariants ? Math.round(firstPrice / 10) : null;

    const badgesHtml = (p.badges || [])
      .slice(0, 2)
      .map((b, idx) => pill(b, idx === 0 ? "dark" : "accent"))
      .join("");

    const ratingHtml = p.rating
      ? `<div class="absolute top-4 right-4 ${"bg-white/80 border border-charcoal/10"} rounded-full px-3 py-1 text-[10px] font-black tracking-widest flex items-center gap-2">
           <svg class="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.196-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
           <span>${p.rating}</span>
         </div>`
      : "";

    const variantsLabel = isComingSoon
      ? `<span class="text-xs text-gray-400 font-bold">${Math.max(variantsCount, 1)} variants</span>`
      : `<span class="text-xs text-gray-400 font-bold">${variantsCount} variants</span>`;

    const priceBox = isComingSoon
      ? `<div class="bg-premium rounded-2xl p-5 border border-charcoal/10">
           <div class="text-gray-400 font-black text-2xl">Coming soon</div>
           <div class="text-[11px] text-gray-400 mt-1">10 vials per kit • volume discounts</div>
         </div>`
      : `<div class="bg-premium rounded-2xl p-5 border border-charcoal/10">
           <div class="flex items-end gap-2">
             <div class="text-accent font-black text-3xl">${fmtINR(perVial)}</div>
             <div class="text-sm text-gray-500 font-bold pb-1">/ vial</div>
           </div>
           <div class="text-[11px] text-gray-400 mt-1">10 vials per kit • volume discounts</div>
         </div>`;

    return `
      <div class="product-card bg-white rounded-[2rem] border border-charcoal/10 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div class="relative aspect-[4/3] bg-white p-4">
          <div class="absolute top-4 left-4 right-16 flex flex-wrap gap-2 z-10">${badgesHtml}</div>
          ${ratingHtml}
          <div class="w-full h-full rounded-[1.5rem] overflow-hidden border border-charcoal/5">
            ${renderImage(p)}
          </div>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 7h14M5 17h14"/></svg>
            ${variantsLabel}
          </div>
          <div class="text-2xl font-black tracking-tight">${p.name}</div>
          <div class="text-sm text-gray-500 mt-1 line-clamp-2">${p.subtitle || ""}</div>

          <div class="mt-5">
            ${priceBox}
          </div>

          <button
            class="btn-product-details mt-5 w-full py-4 rounded-xl font-black tracking-wide ${isComingSoon ? "bg-charcoal/10 text-charcoal/40 cursor-not-allowed" : "bg-accent text-charcoal hover:brightness-95"} transition-all"
            data-product-key="${p.key}"
            ${isComingSoon ? "disabled" : ""}
          >
            View Product Details
          </button>
        </div>
      </div>
    `;
  }

  function setModalOpen(open) {
    const modal = byId("product-modal");
    if (!modal) return;
    if (open) modal.classList.remove("hidden");
    else modal.classList.add("hidden");
  }

  function openModal(productKey) {
    const product = PRODUCTS.find((p) => p.key === productKey);
    if (!product) return;

    const titleEl = byId("product-modal-title");
    const subtitleEl = byId("product-modal-subtitle");
    const badgesEl = byId("product-modal-badges");
    const variantsEl = byId("product-modal-variants");

    if (titleEl) titleEl.textContent = product.name;
    if (subtitleEl) subtitleEl.textContent = product.subtitle || "";

    if (badgesEl) {
      badgesEl.innerHTML = (product.badges || [])
        .map((b, idx) => pill(b, idx === 0 ? "dark" : "accent"))
        .join("");
    }

    if (variantsEl) {
      if (!product.variants?.length) {
        variantsEl.innerHTML = `
          <div class="bg-premium rounded-2xl border border-charcoal/10 p-6">
            <div class="font-black text-xl">Coming soon</div>
            <div class="text-sm text-gray-500 mt-1">This protocol is currently not open for ordering.</div>
          </div>
        `;
      } else {
        variantsEl.innerHTML = product.variants
          .map((v) => {
            const statusKind = v.status === "IN STOCK" ? "accent" : "dark";
            return `
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-premium rounded-2xl border border-charcoal/10 p-6">
                <div class="flex items-center justify-between md:justify-start gap-6">
                  <div class="font-black text-xl">${v.dosage}mg</div>
                  ${pill(v.status, statusKind)}
                </div>
                <div class="flex items-center justify-between gap-6">
                  <div class="text-xl font-black">${fmtINR(v.price)}</div>
                  <button
                    class="btn-add-to-research px-6 py-3 rounded-xl font-black bg-charcoal text-white hover:bg-accent hover:text-charcoal transition-all"
                    data-product-key="${product.key}"
                    data-product-name="${product.name}"
                    data-dosage="${v.dosage}"
                    data-price="${v.price}"
                  >
                    Add to Research
                  </button>
                </div>
              </div>
            `;
          })
          .join("");
      }
    }

    setModalOpen(true);
  }

  function wireModal() {
    const closeBtn = byId("product-modal-close");
    const backdrop = byId("product-modal-backdrop");

    closeBtn?.addEventListener("click", () => setModalOpen(false));
    backdrop?.addEventListener("click", () => setModalOpen(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setModalOpen(false);
    });

    document.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".btn-product-details");
      if (!btn) return;
      if (btn.disabled) return;
      const key = btn.getAttribute("data-product-key");
      if (key) openModal(key);
    });
  }

  function renderGrid() {
    const grid = byId("catalogue-grid");
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(renderCard).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderGrid();
    wireModal();
  });
})();


