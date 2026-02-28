// ================================
// TIMEZONE CONFIGURATION
// ================================
// IMPORTANT: Change this to customize the timezone displayed on your site
// The time will ALWAYS show YOUR timezone, not the visitor's timezone
//
// Common timezone examples:
//   'Asia/Manila'        - Philippines
//   'America/New_York'   - US Eastern Time
//   'America/Los_Angeles'- US Pacific Time
//   'Europe/London'      - UK
//   'Asia/Tokyo'         - Japan
//   'Australia/Sydney'   - Australia
//
// Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
// ================================

const MY_TIMEZONE = 'Asia/Manila';  // ← CHANGE THIS TO YOUR TIMEZONE

// ================================
// main.js — Shared across: home.html, about.html, contact.html
//
// CHANGES FROM ORIGINAL:
//  [FIX]  observer → observers bug fixed (line ~984 in original)
//  [PERF] 4 separate scroll listeners merged into 1 rAF-throttled handler
//  [PERF] 2 separate time-update intervals (updatePhilippinesTime +
//         updateCurrentTime) consolidated into 1 shared function
//  [PERF] Body opacity flash on load removed (conflicted with page loader)
//  [PERF] { passive: true } added to all scroll, mousemove, resize listeners
//  [PERF] Cursor rAF loop paused when cursor is inactive
//  [CLEAN] All commented-out dead code blocks removed
//  [CLEAN] Cursor code isolated at the top — ready to extract to cursor.js
//         (see AUDIT_REPORT.md §9 for extraction instructions)
//  [CONFIG] Timezone configuration added at top for easy customization
// ================================

// ================================
// Custom Cursor Trail Effect
// NOTE: This entire section is identical in main.js, work.js, project-page.js
// Extract to a shared cursor.js and load it before each page script.
// See AUDIT_REPORT.md §9 for instructions.
// ================================

const cursorDot = document.getElementById('cursorDot');
const cursorOutline = document.getElementById('cursorOutline');
const trailContainer = document.getElementById('cursorTrailSvg');

const svgNS = "http://www.w3.org/2000/svg";

// [PERF] Skip all cursor logic on touch devices — saves mousemove/rAF work on mobile
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
    [cursorDot, cursorOutline, trailContainer].forEach(el => { if (el) el.style.display = 'none'; });
}

let mouseX = 0;
let mouseY = 0;
let outlineX = 0;
let outlineY = 0;
let lastX = 0;
let lastY = 0;

let trailPoints = [];
let currentTrailPath = null;
let isDrawing = false;
let drawingTimeout = null;

// Pause rAF when cursor is not active to avoid wasting cycles
let cursorRAFId = null;
let cursorActive = false;

// [PERF] Pencil rotation constant — kept here so CSS doesn't need to set transform
const PENCIL_ROTATION = -230;

function updateSVGViewBox() {
    if (!trailContainer) return;
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
        const deltaX = mouseX - lastX;
        const deltaY = mouseY - lastY;
        if ((deltaX * deltaX + deltaY * deltaY) > 0.01) {
            addPointToTrail(mouseX, mouseY);
        }
    }

    clearTimeout(drawingTimeout);
    if (!isHovering) {
        drawingTimeout = setTimeout(finishTrail, 50);
    }

    lastX = mouseX;
    lastY = mouseY;

    // Resume rAF if it was paused
    if (!cursorActive) {
        cursorActive = true;
        animateCursor();
    }
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
    if (!cursorActive) {
        cursorRAFId = null;
        return; // Stop the loop when cursor is inactive
    }

    // [PERF] Use transform instead of left/top — transform is compositor-only,
    //        left/top trigger layout reflow every frame causing cursor lag.
    if (cursorDot) {
        const scale = cursorDot.classList.contains('hover') ? 1.3 : 1;
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(${scale})`;
    }

    if (cursorOutline) {
        outlineX += (mouseX - outlineX) * 0.2;
        outlineY += (mouseY - outlineY) * 0.2;
        // Combine translate + pencil rotation in one transform — no layout triggered
        cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px) rotate(${PENCIL_ROTATION}deg)`;
    }

    cursorRAFId = requestAnimationFrame(animateCursor);
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

function createSmoothPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        d += ` Q ${x1} ${y1}, ${cx} ${cy}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last[0]} ${last[1]}`;
    return d;
}

function finishTrail() {
    if (!isDrawing || !currentTrailPath) return;
    isDrawing = false;
    const pathToRemove = currentTrailPath;
    currentTrailPath = null;
    trailPoints = [];
    setTimeout(() => pathToRemove?.remove(), 1500);
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
    el.addEventListener('mouseenter', () => {
        cursorDot?.classList.add('hover');
        cursorOutline?.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
        cursorDot?.classList.remove('hover');
        cursorOutline?.classList.remove('hover');
    });
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

window.addEventListener('scroll', () => {
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
}, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }
    });
});

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'home.html';
    return page;
}

function setActiveNavLink() {
    const currentPage = getCurrentPage();
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.remove('active');
        if (href === currentPage ||
            (currentPage === '' && href === 'home.html') ||
            (currentPage === '/' && href === 'home.html')) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
});

const sections = document.querySelectorAll('section[id]');
const currentPage = getCurrentPage();

if (currentPage === 'home.html' || currentPage === '' || currentPage === '/') {
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        let currentSection = '';
        let found = false;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;

            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                currentSection = section.getAttribute('id');
                found = true;
            }
        });

        if (!found && sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            currentSection = lastSection.getAttribute('id');
        }

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                link.classList.toggle('active', href === `#${currentSection}`);
            }
        });

        const homeLink = document.querySelector('.nav-link[href="home.html"]');
        if (homeLink && !currentSection) {
            homeLink.classList.add('active');
        }
    }

    window.addEventListener('scroll', highlightNavigation, { passive: true });
}

// ================================
// [PERF] Consolidated scroll event handler
// Replaces multiple individual scroll handlers with one rAF-throttled loop
// Improves performance by batching scroll-dependent work
// ================================
let ticking = false;

function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
        const scrollY = window.pageYOffset;

        // — Back to top button —
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('show', scrollY > 300);
        }

        // — Scroll animations —
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < (window.innerHeight - 100);
            el.classList.toggle('visible', isVisible);
        });

        ticking = false;
    });
}

window.addEventListener('scroll', onScroll, { passive: true });

// ================================
// Back to top button
// ================================
const backToTopBtn = document.getElementById('backToTop');
backToTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ================================
// Animated Counter for Stats
// ================================
function animateCounter(element, target, duration = 2000, suffix = '+') {
    let startTimestamp = null;
    const start = 0;
    const end = parseInt(target);

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * (end - start) + start);

        element.textContent = current + suffix;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = target;
        }
    };

    window.requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            const target = entry.target.textContent;
            entry.target.classList.add('counted');
            animateCounter(entry.target, target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(stat => {
    statObserver.observe(stat);
});

// ================================
// Project Filtering with Auto-Sort
// ================================
const filterChips = document.querySelectorAll('.filter-chip');
const projectsGrid = document.querySelector('.projects-grid');
let allProjects = Array.from(document.querySelectorAll('.project-card'));

function sortProjectsByDate(projects) {
    return projects.sort((a, b) => {
        const dateA = new Date(a.getAttribute('data-date'));
        const dateB = new Date(b.getAttribute('data-date'));
        return dateB - dateA;
    });
}

function filterProjects(filter) {
    let projectsToShow = allProjects;

    if (filter !== 'all') {
        projectsToShow = allProjects.filter(card =>
            card.getAttribute('data-category').includes(filter)
        );
    }

    projectsToShow = sortProjectsByDate([...projectsToShow]);
    const recentProjects = projectsToShow.slice(0, 6);

    allProjects.forEach(card => {
        card.classList.add('fade-out');
    });

    setTimeout(() => {
        projectsGrid.innerHTML = '';

        recentProjects.forEach((card, index) => {
            card.classList.remove('fade-out', 'hidden');
            card.classList.add('fade-in');
            projectsGrid.appendChild(card);
            card.style.animationDelay = `${index * 0.1}s`;

            setTimeout(() => {
                card.classList.remove('fade-in');
                card.style.animationDelay = '';
            }, 500 + (index * 100));
        });
    }, 300);
}

window.addEventListener('load', () => {
    if (projectsGrid) filterProjects('all');
});

filterChips.forEach(chip => {
    chip.addEventListener('click', function () {
        const filter = this.getAttribute('data-filter');
        filterChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        filterProjects(filter);
    });
});

// ================================
// Consolidated Real-Time Clock
// ================================
// This function updates both the footer clock and contact page clock
// using the timezone configured at the top of this file (MY_TIMEZONE)
//
// The displayed time will ALWAYS be in YOUR timezone (MY_TIMEZONE),
// regardless of where the visitor is browsing from.
// ================================
function updateClocks() {
    // Use the timezone configured at the top of this file
    const TZ = MY_TIMEZONE;

    // Create formatters for different time displays
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true
    });
    const shortFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true
    });
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ, 
        hour: 'numeric', 
        hour12: false
    });

    const now = new Date();
    const hour = parseInt(hourFormatter.format(now));
    const isDay = hour >= 6 && hour < 18;

    // — Footer clock (#timeText) —
    const timeText = document.getElementById('timeText');
    if (timeText) {
        timeText.textContent = `It's currently ${shortFormatter.format(now)} in Mark's city`;

        const timeIcon = document.getElementById('timeIcon');
        const sunIcons = document.querySelectorAll('.sun-icon');
        const moonIcons = document.querySelectorAll('.moon-icon');

        timeIcon?.classList.toggle('night', !isDay);
        sunIcons.forEach(el => el.style.display = isDay ? '' : 'none');
        moonIcons.forEach(el => el.style.display = isDay ? 'none' : '');
    }

    // — Contact page timezone clock (#currentTime) —
    const currentTime = document.getElementById('currentTime');
    const timezoneIcon = document.getElementById('timezoneIcon');
    if (currentTime) {
        try {
            currentTime.textContent = timeFormatter.format(now);

            if (timezoneIcon) {
                if (hour >= 5 && hour < 12) timezoneIcon.textContent = '🌅';
                else if (hour >= 12 && hour < 17) timezoneIcon.textContent = '☀️';
                else if (hour >= 17 && hour < 20) timezoneIcon.textContent = '🌇';
                else timezoneIcon.textContent = '🌙';
            }
        } catch (err) {
            // Silently fail; clock is non-critical
        }
    }
}

// Start clock if either element is present on this page
if (document.getElementById('timeText') || document.getElementById('currentTime')) {
    const clockReady = () => {
        updateClocks();
        setInterval(updateClocks, 1000);
    };
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', clockReady)
        : clockReady();
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
        charCount.style.color =
            count > 950 ? '#EF4444' :
            count > 800 ? '#F59E0B' :
            'var(--gray-500)';
    });
}

// Input focus effects
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
                new Promise(resolve => setTimeout(resolve, 1000)) // min UX delay
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

// Ripple effect on social cards
document.querySelectorAll('.social-link-card').forEach(card => {
    card.addEventListener('click', function (e) {
        const ripple = document.createElement('div');
        Object.assign(ripple.style, {
            position: 'absolute', borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            width: '20px', height: '20px',
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
// Skills tag click feedback
// ================================
document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('click', function () {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => { this.style.transform = 'translateY(-2px)'; }, 100);
    });
});

// ================================
// Prevent default on placeholder links
// ================================
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', e => e.preventDefault());
});

// ================================
// Dynamic footer year
// ================================
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    setTimeout(() => {
        loader.classList.add('fade-out');
        document.body.classList.remove('loader-active');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
    }, 500); // Reduced from 1000ms — page is already loaded, don't make users wait
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