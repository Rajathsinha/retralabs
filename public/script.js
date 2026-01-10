// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Global State
let isMenuOpen = false;

// 1. Initial Page Load Animation
window.addEventListener('load', () => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // Initial state setup for hero
    gsap.set(".hero-title, .hero-reveal, .hero-buttons", { opacity: 0, y: 100 });
    gsap.set("#navbar", { y: -100, opacity: 0 });

    tl.to("#navbar", { y: 0, opacity: 1, duration: 1.2 })
      .to(".hero-title", { 
          y: 0, 
          opacity: 1, 
          duration: 1.5, 
          stagger: 0.1
      }, "-=0.8")
      .to(".hero-reveal", { y: 0, opacity: 1, stagger: 0.15, duration: 1 }, "-=1")
      .to(".hero-buttons", { y: 0, opacity: 1, duration: 1, ease: "back.out(1.7)" }, "-=0.8");

    // Initialize Scroll Reveals AFTER load
    initScrollReveals();
});

// 2. Custom Cursor Logic
const cursor = document.getElementById('custom-cursor');
if (cursor) {
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX - 8,
            y: e.clientY - 8,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, .product-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(cursor, { scale: 3, opacity: 0.2, duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
        });
    });
}

// 3. Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled', 'shadow-sm');
        } else {
            nav.classList.remove('scrolled', 'shadow-sm');
        }
    }
});

// 4. Scroll Reveal Animations
function initScrollReveals() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 60 },
            {
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none none",
                },
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                clearProps: "all"
            }
        );
    });
}

// 5. Magnetic Hover Effect for Buttons
const magneticBtns = document.querySelectorAll('.bg-charcoal, .border-charcoal\\/10');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
            x: x * 0.2,
            y: y * 0.2,
            duration: 0.4,
            ease: "power2.out"
        });
    });
    
    btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.3)"
        });
    });
});

// 6. Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            gsap.to(window, {
                duration: 1.5,
                scrollTo: { y: target, offsetY: 80 }, // Adjusted offset
                ease: "power4.inOut"
            });
            // Close mobile menu if open
            if (isMenuOpen) {
                toggleMobileMenu();
            }
        }
    });
});

// 9. Mobile Menu Toggle
const menuBtn = document.querySelector('button.md\\:hidden');
const navLinksContainer = document.querySelector('.md\\:flex.gap-10');

function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        gsap.to(navLinksContainer, { 
            display: 'flex', 
            flexDirection: 'column',
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            backgroundColor: '#F5F5F7',
            padding: '2rem',
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });
        navLinksContainer.classList.remove('hidden');
    } else {
        gsap.to(navLinksContainer, { 
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: () => {
                navLinksContainer.classList.add('hidden');
                navLinksContainer.style.display = '';
            }
        });
    }
}

if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileMenu);
}

// 7. Parallax for Hero Background
gsap.to(".hero-title", {
    scrollTrigger: {
        trigger: "#home",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    y: 150,
    opacity: 0.2
});

// 8. Product Data & Population (Simplified for Premium Feel)
const productData = {
    retatrutide: {
        name: 'Retatrutide',
        price: '₹11,000',
        status: 'Available',
        details: 'Triple Agonist Peptide'
    }
};

// ... existing logic can be adapted if needed, but for the redesign 
// we focus on the visual hierarchy provided in index.html.
