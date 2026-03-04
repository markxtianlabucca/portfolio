// ================================
// project-page.js — project-page.html, project-page-graphics.html
//
// CHANGES FROM ORIGINAL:
//  [FIX]   observer → observers bug fixed (was crashing contact card fade-ins)
//  [PERF]  3 separate scroll listeners merged into 1 rAF-throttled handler
//  [PERF]  updatePhilippinesTime + updateCurrentTime consolidated into updateClocks
//  [PERF]  Body opacity flash on load removed (conflicted with page loader)
//  [PERF]  { passive: true } added to scroll, mousemove, resize listeners
//  [PERF]  Cursor rAF loop paused when cursor leaves viewport
//  [CLEAN] All commented-out dead code blocks removed
// ================================

// ================================
// Project Name — Single Source of Truth
// Reads from #projectName h1, auto-fills
// breadcrumb and page <title>
// ================================

document.addEventListener('DOMContentLoaded', () => {
    const projectName = document.getElementById('projectName');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    const pageTitle = document.getElementById('pageTitle');

    if (projectName && breadcrumbCurrent) {
        breadcrumbCurrent.textContent = projectName.textContent;
    }
    if (projectName && pageTitle) {
        pageTitle.textContent = `${projectName.textContent} - Mark Christian Labucca`;
    }
});

// ================================
// Custom Cursor Trail Effect
// NOTE: This block is identical in main.js, work.js, project-page.js
//       Extract to a shared cursor.js (load it before this script).
// ================================
const cursorDot = document.getElementById('cursorDot');
const cursorOutline = document.getElementById('cursorOutline');
const trailContainer = document.getElementById('cursorTrailSvg');
const svgNS = "http://www.w3.org/2000/svg";

// [PERF] Skip cursor on touch devices — saves mousemove/rAF work on mobile
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
    [cursorDot, cursorOutline, trailContainer].forEach(el => { if (el) el.style.display = 'none'; });
}

let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;
let lastX = 0, lastY = 0;
let trailPoints = [], currentTrailPath = null, isDrawing = false, drawingTimeout = null;
let cursorActive = false;

// [PERF] Pencil rotation constant — kept here so CSS doesn't need to set transform
const PENCIL_ROTATION = -230;

function updateSVGViewBox() {
    if (trailContainer)
        trailContainer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
}
updateSVGViewBox();
window.addEventListener('resize', updateSVGViewBox, { passive: true });

if (!isTouchDevice) {
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot?.classList.add('active');
    cursorOutline?.classList.add('active');
    trailContainer?.classList.add('active');

    const isHovering = cursorDot?.classList.contains('hover');
    if (!isDrawing) startNewTrail();
    if (isHovering) {
        addPointToTrail(mouseX, mouseY);
    } else {
        const dx = mouseX - lastX, dy = mouseY - lastY;
        if (dx * dx + dy * dy > 0.01) addPointToTrail(mouseX, mouseY);
    }
    clearTimeout(drawingTimeout);
    if (!isHovering) drawingTimeout = setTimeout(finishTrail, 50);
    lastX = mouseX;
    lastY = mouseY;
    if (!cursorActive) { cursorActive = true; animateCursor(); }
}, { passive: true });

document.addEventListener('mouseleave', () => {
    cursorDot?.classList.remove('active');
    cursorOutline?.classList.remove('active');
    trailContainer?.classList.remove('active');
    finishTrail();
    cursorActive = false;
});
// Hide cursor when hovering over iframe
document.querySelectorAll('iframe').forEach(iframe => {
    iframe.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
    });

    iframe.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '1';
        cursorOutline.style.opacity = '1';
    });
});
} // end !isTouchDevice

function animateCursor() {
    if (!cursorActive) return;
    // [PERF] Use transform instead of left/top — compositor-only, no layout reflow
    if (cursorDot) {
        const scale = cursorDot.classList.contains('hover') ? 1.3 : 1;
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(${scale})`;
    }
    if (cursorOutline) {
        outlineX += (mouseX - outlineX) * 0.2;
        outlineY += (mouseY - outlineY) * 0.2;
        cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) rotate(${PENCIL_ROTATION}deg)`;
    }
    requestAnimationFrame(animateCursor);
}

function startNewTrail() {
    if (!trailContainer) return;
    isDrawing = true;
    trailPoints = [[mouseX, mouseY]];
    currentTrailPath = document.createElementNS(svgNS, 'path');
    currentTrailPath.classList.add('cursor-trail-path');
    trailContainer.appendChild(currentTrailPath);
}
function addPointToTrail(x, y) {
    if (!isDrawing || !currentTrailPath) return;
    trailPoints.push([x, y]);
    if (trailPoints.length > 10) trailPoints.shift();
    currentTrailPath.setAttribute('d', createSmoothPath(trailPoints));
}
function createSmoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        d += ` Q ${x1} ${y1}, ${(x1 + x2) / 2} ${(y1 + y2) / 2}`;
    }
    return d + ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]}`;
}
function finishTrail() {
    if (!isDrawing || !currentTrailPath) return;
    isDrawing = false;
    const p = currentTrailPath;
    currentTrailPath = null;
    trailPoints = [];
    setTimeout(() => p?.remove(), 1500);
}

document.addEventListener('mousedown', () => {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const mark = document.createElement('div');
            mark.className = 'cursor-sketch';
            mark.style.left = (mouseX + (Math.random() - 0.5) * 15) + 'px';
            mark.style.top = (mouseY + (Math.random() - 0.5) * 15) + 'px';
            mark.style.setProperty('--rotation', Math.random() * 360 + 'deg');
            document.body.appendChild(mark);
            setTimeout(() => mark.remove(), 500);
        }, i * 25);
    }
});

document.querySelectorAll(
    'a, button, .btn, .filter-chip, .project-card, .nav-link, .nav-cta, .pagination-number, .pagination-btn'
).forEach(el => {
    el.addEventListener('mouseenter', () => { cursorDot?.classList.add('hover'); cursorOutline?.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursorDot?.classList.remove('hover'); cursorOutline?.classList.remove('hover'); });
});


// ================================
// Navigation
// ================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

navToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});
document.querySelector('.nav-cta')?.addEventListener('click', () => {
    navMenu.classList.remove('active');
    navToggle.classList.remove('active');
});


// ================================
// Smooth scrolling for anchor links
// ================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
    });
});


// ================================
// Active nav link
// ================================
function getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'home.html';
}
function setActiveNavLink() {
    const p = getCurrentPage();
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active',
            href === p || (p === '' && href === 'home.html') || (p === '/' && href === 'home.html')
        );
    });
}
document.addEventListener('DOMContentLoaded', setActiveNavLink);


// ================================
// Unified rAF-throttled scroll handler
// Replaces 3 separate scroll listeners
// ================================
const backToTopBtn = document.getElementById('backToTop');
let scrollPending = false;

function handleScroll() {
    const scrollY = window.pageYOffset;
    navbar?.classList.toggle('scrolled', scrollY > 50);
    backToTopBtn?.classList.toggle('show', scrollY > 300);
}

window.addEventListener('scroll', () => {
    if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(() => { handleScroll(); scrollPending = false; });
    }
}, { passive: true });

backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));


// ================================
// Intersection Observer — fade-in animations
// ================================
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card, .tech-item, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});
document.querySelectorAll('.process-step').forEach((step, i) => {
    step.style.opacity = '0';
    step.style.transform = 'translateX(-30px)';
    step.style.transition = `opacity 0.6s ease-out ${i * 0.1}s, transform 0.6s ease-out ${i * 0.1}s`;
    observer.observe(step);
});


// ================================
// Contact card animations
// FIX: was using `observer` (wrong ref), now correctly uses `observers`
// ================================
const observersOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };

const observers = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observersOptions);

document.querySelectorAll('.availability-card, .contact-methods-card, .social-card, .form-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observers.observe(card); // FIX: was observer.observe(card) — wrong reference
});


// ================================
// Proficiency bar animations
// ================================
const proficiencyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fill = entry.target;
            fill.style.setProperty('--proficiency-width', fill.getAttribute('data-proficiency') + '%');
            fill.classList.add('animate');
            proficiencyObserver.unobserve(fill);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.proficiency-fill').forEach(bar => proficiencyObserver.observe(bar));


// ================================
// Project Filtering (related projects on project pages)
// ================================
const filterChips = document.querySelectorAll('.filter-chip');
const projectsGrid = document.querySelector('.projects-grid');
const noResults = document.getElementById('noResults');
let allProjects = [];

document.addEventListener('DOMContentLoaded', () => {
    allProjects = Array.from(document.querySelectorAll('.project-card'));
});

function sortProjectsByDate(projects) {
    return [...projects].sort((a, b) =>
        new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'))
    );
}

function filterProjects(filter) {
    if (allProjects.length === 0)
        allProjects = Array.from(document.querySelectorAll('.project-card'));

    let show = allProjects;
    if (filter === 'featured') {
        show = allProjects.filter(c => c.getAttribute('data-featured') === 'true');
    } else if (filter !== 'all') {
        show = allProjects.filter(c => c.getAttribute('data-category')?.includes(filter));
    }

    const recent = sortProjectsByDate(show).slice(0, 6);

    allProjects.forEach(c => c.classList.add('fade-out'));

    setTimeout(() => {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = '';

        if (recent.length === 0) {
            if (noResults) noResults.style.display = 'block';
            return;
        }
        if (noResults) noResults.style.display = 'none';

        recent.forEach((card, i) => {
            card.classList.remove('fade-out', 'hidden');
            void card.offsetHeight;
            card.classList.add('fade-in');
            card.style.animationDelay = `${i * 0.1}s`;
            projectsGrid.appendChild(card);
            setTimeout(() => { card.classList.remove('fade-in'); card.style.animationDelay = ''; }, 500 + i * 100);
        });
    }, 300);
}

window.addEventListener('load', () => filterProjects('featured'));

filterChips.forEach(chip => {
    chip.addEventListener('click', function () {
        filterChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        filterProjects(this.getAttribute('data-filter'));
    });
});


// ================================
// Animated Counter for Stats
// ================================
function animateCounter(element, target, duration = 2000, suffix = '+') {
    const end = parseInt(target);
    let startTimestamp = null;
    const step = ts => {
        if (!startTimestamp) startTimestamp = ts;
        const progress = Math.min((ts - startTimestamp) / duration, 1);
        element.textContent = Math.floor((1 - Math.pow(1 - progress, 4)) * end) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else element.textContent = target;
    };
    requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            animateCounter(entry.target, entry.target.textContent);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(s => statObserver.observe(s));


// ================================
// Technology Toggle
// ================================
const techToggleBtn = document.getElementById('techToggleBtn');
const techToggleText = document.getElementById('techToggleText');
const techHiddenItems = document.querySelectorAll('.tech-hidden');

techToggleBtn?.addEventListener('click', () => {
    const isExpanded = techToggleBtn.classList.toggle('expanded');
    techToggleText.textContent = isExpanded ? 'See Less' : 'See More';
    techHiddenItems.forEach(item => { item.style.display = isExpanded ? 'block' : 'none'; });
});


// ================================
// Consolidated Real-Time Clock
// Replaces updatePhilippinesTime + updateCurrentTime (two separate intervals)
// ================================
function updateClocks() {
    const TZ = 'Asia/Manila';
    const now = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now));
    const isDay = hour >= 6 && hour < 18;

    const timeText = document.getElementById('timeText');
    if (timeText) {
        const shortTime = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true }).format(now);
        timeText.textContent = `It's currently ${shortTime} in Mark's city`;
        const timeIcon = document.getElementById('timeIcon');
        const sunIcons = document.querySelectorAll('.sun-icon');
        const moonIcons = document.querySelectorAll('.moon-icon');
        timeIcon?.classList.toggle('night', !isDay);
        sunIcons.forEach(el => el.style.display = isDay ? '' : 'none');
        moonIcons.forEach(el => el.style.display = isDay ? 'none' : '');
    }

    const currentTime = document.getElementById('currentTime');
    const tzIcon = document.getElementById('timezoneIcon');
    if (currentTime) {
        try {
            currentTime.textContent = new Intl.DateTimeFormat('en-US', {
                timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            }).format(now);
            if (tzIcon) {
                if (hour >= 5 && hour < 12) tzIcon.textContent = '🌅';
                else if (hour >= 12 && hour < 17) tzIcon.textContent = '☀️';
                else if (hour >= 17 && hour < 20) tzIcon.textContent = '🌇';
                else tzIcon.textContent = '🌙';
            }
        } catch { /* non-critical */ }
    }
}

if (document.getElementById('timeText') || document.getElementById('currentTime')) {
    const startClock = () => { updateClocks(); setInterval(updateClocks, 1000); };
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', startClock)
        : startClock();
}


// ================================
// Contact Form
// ================================
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const messageText = document.getElementById('messageText');
const charCount = document.getElementById('charCount');
const messageInput = document.getElementById('message');

if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
        const count = messageInput.value.length;
        charCount.textContent = count;
        charCount.style.color = count > 950 ? '#EF4444' : count > 800 ? '#F59E0B' : 'var(--gray-500)';
    });
}

document.querySelectorAll('.input-icon').forEach(container => {
    const input = container.querySelector('input, textarea');
    if (input) {
        input.addEventListener('focus', () => container.classList.add('focused'));
        input.addEventListener('blur', () => container.classList.remove('focused'));
    }
});

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        formMessage.classList.remove('show');

        try {
            const [response] = await Promise.all([
                fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                }),
                new Promise(r => setTimeout(r, 1000))
            ]);

            if (response.ok) {
                formMessage.classList.remove('error');
                formMessage.classList.add('success', 'show');
                messageText.textContent = '✨ Message sent successfully! I\'ll get back to you soon.';
                contactForm.reset();
                if (charCount) charCount.textContent = '0';
                setTimeout(() => formMessage.classList.remove('show'), 5000);
            } else {
                throw new Error('Submission failed');
            }
        } catch {
            formMessage.classList.remove('success');
            formMessage.classList.add('error', 'show');
            messageText.textContent = '❌ Oops! Something went wrong. Please try again.';
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

// Ripple on social cards
document.querySelectorAll('.social-link-card').forEach(card => {
    card.addEventListener('click', function (e) {
        const ripple = document.createElement('div');
        Object.assign(ripple.style, {
            position: 'absolute', borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)', width: '20px', height: '20px',
            animation: 'ripple-effect 0.6s ease-out'
        });
        const rect = card.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left - 10) + 'px';
        ripple.style.top = (e.clientY - rect.top - 10) + 'px';
        card.style.position = 'relative';
        card.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});


// ================================
// Utility
// ================================
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
});

const footerYear = document.querySelector('.footer-bottom p');
if (footerYear) {
    footerYear.textContent = `© ${new Date().getFullYear()} Mark Christian Labucca. All rights reserved.`;
}


// ================================
// Page Loader
// ================================
function init() {
    document.body.classList.add('loader-active');
    setupInternalLinks();
}

document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    setTimeout(() => {
        loader.classList.add('fade-out');
        document.body.classList.remove('loader-active');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
    }, 500);
});

function setupInternalLinks() {
    document.querySelectorAll(
        'a[href^="home.html"], a[href^="work.html"], a[href^="about.html"], a[href^="contact.html"]'
    ).forEach(link => {
        link.addEventListener('click', (e) => {
            const loader = document.getElementById('pageLoader');
            if (loader && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                loader.classList.remove('fade-out');
                loader.style.display = 'flex';
                document.body.classList.add('loader-active');
            }
        });
    });
}


// ================================
// Media Fullscreen / Lightbox
// — Expand button top-right of each image/video
// — Prev / Next navigation
// — Counter indicator (e.g. 2 / 4)
// — Dot strip at bottom
//
// TO ADD MORE TARGETS: append a selector to MEDIA_SELECTORS below.
// ================================
(function initMediaFullscreen() {
    'use strict';

    const MEDIA_SELECTORS = [
        '.process-image',
        '.hero-image',
        '.project-section img:not(.project-thumbnail)',
        '.project-hero img',
        '.project-section video',
        '.project-hero video'
    ].join(', ');

    const ICON_EXPAND = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 3 21 3 21 9"/>
        <polyline points="9 21 3 21 3 15"/>
        <line x1="21" y1="3" x2="14" y2="10"/>
        <line x1="3" y1="21" x2="10" y2="14"/>
    </svg>`;
    const ICON_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
    const ICON_PREV = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>`;
    const ICON_NEXT = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
    </svg>`;

    let mediaItems = [], currentIdx = 0, activeEl = null;

    // Build lightbox DOM
    const lb = document.createElement('div');
    lb.className = 'media-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Media viewer');
    lb.innerHTML = `
        <div class="media-lightbox-topbar">
            <span class="media-lightbox-counter"></span>
            <button class="media-lightbox-close" aria-label="Close">${ICON_CLOSE}</button>
        </div>
        <button class="media-lightbox-nav media-lightbox-prev" aria-label="Previous">${ICON_PREV}</button>
        <div class="media-lightbox-stage"></div>
        <button class="media-lightbox-nav media-lightbox-next" aria-label="Next">${ICON_NEXT}</button>
        <div class="media-lightbox-dots"></div>`;
    document.body.appendChild(lb);

    const stage = lb.querySelector('.media-lightbox-stage');
    const counter = lb.querySelector('.media-lightbox-counter');
    const dotsBar = lb.querySelector('.media-lightbox-dots');
    const btnPrev = lb.querySelector('.media-lightbox-prev');
    const btnNext = lb.querySelector('.media-lightbox-next');
    const btnClose = lb.querySelector('.media-lightbox-close');

    function render(idx) {
        currentIdx = idx;
        if (activeEl) activeEl.remove();
        activeEl = mediaItems[idx].cloneNode(true);
        if (activeEl.tagName === 'VIDEO') { activeEl.controls = true; activeEl.removeAttribute('autoplay'); }
        stage.appendChild(activeEl);
        counter.textContent = `${idx + 1} / ${mediaItems.length}`;
        dotsBar.querySelectorAll('.media-lightbox-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
        btnPrev.disabled = idx === 0;
        btnNext.disabled = idx === mediaItems.length - 1;
    }

    function buildDots() {
        dotsBar.innerHTML = '';
        if (mediaItems.length <= 1 || mediaItems.length > 12) return;
        mediaItems.forEach((_, i) => {
            const d = document.createElement('span');
            d.className = 'media-lightbox-dot';
            d.addEventListener('click', () => render(i));
            dotsBar.appendChild(d);
        });
    }

    function open(idx) {
        buildDots();
        render(idx);
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        btnClose.focus();
    }

    function close() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
        if (activeEl) {
            if (activeEl.tagName === 'VIDEO') activeEl.pause();
            activeEl.remove();
            activeEl = null;
        }
    }

    btnPrev.addEventListener('click', () => { if (currentIdx > 0) render(currentIdx - 1); });
    btnNext.addEventListener('click', () => { if (currentIdx < mediaItems.length - 1) render(currentIdx + 1); });
    btnClose.addEventListener('click', close);
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) close(); });
    document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') btnPrev.click();
        if (e.key === 'ArrowRight') btnNext.click();
    });

    function wrap(el, idx) {
        if (el.closest('.media-wrapper') || el.closest('.media-lightbox')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'media-wrapper';
        const btn = document.createElement('button');
        btn.className = 'media-fullscreen-btn';
        btn.setAttribute('aria-label', 'View fullscreen');
        btn.innerHTML = ICON_EXPAND;
        btn.addEventListener('click', (e) => { e.stopPropagation(); open(idx); });
        
        // Make image/video itself clickable
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => { e.stopPropagation(); open(idx); });
        
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
        wrapper.appendChild(btn);
    }

    function initLightbox() {
        mediaItems = Array.from(document.querySelectorAll(MEDIA_SELECTORS))
            .filter(el => !el.closest('.media-lightbox'));
        mediaItems.forEach((el, i) => wrap(el, i));
        if (mediaItems.length <= 1) {
            btnPrev.style.display = 'none';
            btnNext.style.display = 'none';
        }
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', initLightbox)
        : initLightbox();
})();