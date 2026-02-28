// ================================
// work.js — work.html
//
// CHANGES FROM ORIGINAL:
//  [FIX]   observer → observers bug fixed (was crashing card fade-in animations)
//  [PERF]  3 separate scroll listeners merged into 1 rAF-throttled handler
//  [PERF]  updatePhilippinesTime + updateCurrentTime consolidated into updateClocks
//  [PERF]  Body opacity flash on load removed (conflicted with page loader)
//  [PERF]  { passive: true } added to scroll, mousemove, resize listeners
//  [PERF]  Cursor rAF loop paused when cursor leaves viewport
//  [CLEAN] All commented-out dead code blocks removed
// ================================


// ================================
// Custom Cursor Trail Effect
// NOTE: This block is identical in main.js, work.js, project-page.js
//       Extract to a shared cursor.js (load it before this script).
// ================================
const cursorDot     = document.getElementById('cursorDot');
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
            mark.style.top  = (mouseY + (Math.random() - 0.5) * 15) + 'px';
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
const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');
const navLinks  = document.querySelectorAll('.nav-link');

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
// Active nav link — page-based detection
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
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card, .tech-item, .stat-item').forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});
document.querySelectorAll('.process-step').forEach((step, i) => {
    step.style.opacity   = '0';
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
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observersOptions);

document.querySelectorAll('.availability-card, .contact-methods-card, .social-card, .form-card').forEach(card => {
    card.style.opacity   = '0';
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
// Skills tag click feedback
// ================================
document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('click', function () {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => { this.style.transform = 'translateY(-2px)'; }, 100);
    });
});


// ================================
// Project Filtering, Search & Pagination
// ================================
const filterChips  = document.querySelectorAll('.filter-chip');
const projectsGrid = document.querySelector('.projects-grid');
const noResults    = document.getElementById('noResults');
let allProjects    = Array.from(document.querySelectorAll('.project-card'));

function sortProjectsByDate(projects) {
    return [...projects].sort((a, b) =>
        new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'))
    );
}

// ── Pagination ──────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 6;
let currentPage      = 1;
let totalPages       = 1;
let filteredProjects = [];
let currentFilter    = 'all';
let currentSearchTerm = '';

const pagination       = document.getElementById('pagination');
const paginationNumbers = document.getElementById('paginationNumbers');
const prevPageBtn      = document.getElementById('prevPage');
const nextPageBtn      = document.getElementById('nextPage');

function renderPagination() {
    if (!pagination || !paginationNumbers || !prevPageBtn || !nextPageBtn) return;
    if (totalPages <= 1) { pagination.style.display = 'none'; return; }

    pagination.style.display = 'flex';
    paginationNumbers.innerHTML = '';

    let pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage <= 3) {
            pages.push(2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push('...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }

    pages.forEach(p => {
        if (p === '...') {
            const el = document.createElement('span');
            el.className = 'pagination-ellipsis';
            el.textContent = '...';
            paginationNumbers.appendChild(el);
        } else {
            const btn = document.createElement('button');
            btn.className = 'pagination-number';
            btn.textContent = p;
            btn.setAttribute('aria-label', `Go to page ${p}`);
            if (p === currentPage) { btn.classList.add('active'); btn.setAttribute('aria-current', 'page'); }
            btn.addEventListener('click', () => goToPage(p));
            paginationNumbers.appendChild(btn);
        }
    });

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayCurrentPage();
    renderPagination();
    const sec = document.getElementById('projects');
    if (sec) window.scrollTo({ top: sec.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' });
}

function displayCurrentPage() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const show  = filteredProjects.slice(start, start + ITEMS_PER_PAGE);

    // Reset all cards cleanly
    allProjects.forEach(c => {
        c.classList.remove('fade-in', 'fade-out', 'hidden');
        c.style.animationDelay = c.style.opacity = c.style.transform = '';
    });

    allProjects.forEach(c => c.classList.add('fade-out'));

    setTimeout(() => {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = '';
        show.forEach((card, i) => {
            card.classList.remove('fade-out', 'hidden');
            void card.offsetHeight;
            card.classList.add('fade-in');
            card.style.animationDelay = `${i * 0.1}s`;
            projectsGrid.appendChild(card);
        });

        const cleanup = ((show.length - 1) * 0.1 + 0.5) * 1000;
        setTimeout(() => {
            show.forEach(c => { c.classList.remove('fade-in'); c.style.animationDelay = ''; });
        }, cleanup);
    }, 300);
}

function filterAndSearchProjects(filter, searchTerm = '') {
    currentFilter     = filter;
    currentSearchTerm = searchTerm.toLowerCase().trim();
    currentPage       = 1;

    let projects = allProjects;
    if (filter === 'featured') {
        projects = allProjects.filter(c => c.getAttribute('data-featured') === 'true');
    } else if (filter !== 'all') {
        projects = allProjects.filter(c => c.getAttribute('data-category')?.includes(filter));
    }

    if (currentSearchTerm) {
        projects = projects.filter(c => {
            const title = c.querySelector('.project-title')?.textContent.toLowerCase() || '';
            const desc  = c.querySelector('.project-description')?.textContent.toLowerCase() || '';
            const tags  = Array.from(c.querySelectorAll('.project-tag')).map(t => t.textContent.toLowerCase()).join(' ');
            return `${title} ${desc} ${tags}`.includes(currentSearchTerm);
        });
    }

    filteredProjects = sortProjectsByDate(projects);
    totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

    if (filteredProjects.length === 0) {
        if (noResults)  noResults.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        if (projectsGrid) projectsGrid.innerHTML = '';
    } else {
        if (noResults) noResults.style.display = 'none';
        displayCurrentPage();
        renderPagination();
    }
}

// Filter chips
filterChips.forEach(chip => {
    chip.addEventListener('click', function () {
        filterChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        filterAndSearchProjects(this.getAttribute('data-filter'), projectSearch?.value || '');
    });
});

// Search
const projectSearch = document.getElementById('projectSearch');
const searchClear   = document.getElementById('searchClear');

if (projectSearch) {
    projectSearch.addEventListener('input', e => {
        searchClear.style.display = e.target.value ? 'flex' : 'none';
        filterAndSearchProjects(currentFilter, e.target.value);
    });
}
if (searchClear) {
    searchClear.addEventListener('click', () => {
        projectSearch.value = '';
        searchClear.style.display = 'none';
        filterAndSearchProjects(currentFilter, '');
        projectSearch.focus();
    });
}

// Pagination buttons
prevPageBtn?.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
nextPageBtn?.addEventListener('click', () => { if (currentPage < totalPages) goToPage(currentPage + 1); });

// Initial load
window.addEventListener('load', () => filterAndSearchProjects('all'));


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
const techToggleBtn   = document.getElementById('techToggleBtn');
const techToggleText  = document.getElementById('techToggleText');
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
    const TZ   = 'Asia/Manila';
    const now  = new Date();
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now));
    const isDay = hour >= 6 && hour < 18;

    // Footer clock
    const timeText = document.getElementById('timeText');
    if (timeText) {
        const shortTime = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true }).format(now);
        timeText.textContent = `It's currently ${shortTime} in Mark's city`;
        const timeIcon  = document.getElementById('timeIcon');
        const sunIcons  = document.querySelectorAll('.sun-icon');
        const moonIcons = document.querySelectorAll('.moon-icon');
        timeIcon?.classList.toggle('night', !isDay);
        sunIcons.forEach(el  => el.style.display = isDay ? '' : 'none');
        moonIcons.forEach(el => el.style.display = isDay ? 'none' : '');
    }

    // Contact page clock
    const currentTime  = document.getElementById('currentTime');
    const tzIcon       = document.getElementById('timezoneIcon');
    if (currentTime) {
        try {
            currentTime.textContent = new Intl.DateTimeFormat('en-US', {
                timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            }).format(now);
            if (tzIcon) {
                if      (hour >= 5  && hour < 12) tzIcon.textContent = '🌅';
                else if (hour >= 12 && hour < 17) tzIcon.textContent = '☀️';
                else if (hour >= 17 && hour < 20) tzIcon.textContent = '🌇';
                else                              tzIcon.textContent = '🌙';
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
const contactForm  = document.getElementById('contactForm');
const submitBtn    = document.getElementById('submitBtn');
const formMessage  = document.getElementById('formMessage');
const messageText  = document.getElementById('messageText');
const charCount    = document.getElementById('charCount');
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
        input.addEventListener('blur',  () => container.classList.remove('focused'));
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
        ripple.style.top  = (e.clientY - rect.top  - 10) + 'px';
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