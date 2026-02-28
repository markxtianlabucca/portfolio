// ================================
// Custom Cursor Trail Effect
// Continuous, Smooth, Reliable
// ================================

const cursorDot = document.getElementById('cursorDot');
const cursorOutline = document.getElementById('cursorOutline');
const trailContainer = document.getElementById('cursorTrailSvg');

const svgNS = "http://www.w3.org/2000/svg";

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

// --------------------------------
// SVG SAFETY SETUP (NO HTML EDIT)
// --------------------------------
function updateSVGViewBox() {
    if (!trailContainer) return;
    trailContainer.setAttribute(
        'viewBox',
        `0 0 ${window.innerWidth} ${window.innerHeight}`
    );
}

updateSVGViewBox();
window.addEventListener('resize', updateSVGViewBox);

// --------------------------------
// Mouse Tracking
// --------------------------------
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    cursorDot?.classList.add('active');
    cursorOutline?.classList.add('active');
    trailContainer?.classList.add('active');

    const isHovering = cursorDot?.classList.contains('hover');

    if (!isDrawing) startNewTrail();

    // ALWAYS add points when hovering
    if (isHovering) {
        addPointToTrail(mouseX, mouseY);
    } else {
        const deltaX = mouseX - lastX;
        const deltaY = mouseY - lastY;
        const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (speed > 0.1) {
            addPointToTrail(mouseX, mouseY);
        }
    }
    // Only end trail if NOT hovering
    clearTimeout(drawingTimeout);
    if (!isHovering) {
        drawingTimeout = setTimeout(finishTrail, 50);
    }

    lastX = mouseX;
    lastY = mouseY;
});


// --------------------------------
// Hide on Leave
// --------------------------------
document.addEventListener('mouseleave', () => {
    cursorDot?.classList.remove('active');
    cursorOutline?.classList.remove('active');
    trailContainer?.classList.remove('active');
    finishTrail();
});

// --------------------------------
// Smooth Cursor Follow
// --------------------------------
function animateCursor() {
    if (cursorDot) {
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    }

    if (cursorOutline) {
        outlineX += (mouseX - outlineX) * 0.2;
        outlineY += (mouseY - outlineY) * 0.2;
        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';
    }

    requestAnimationFrame(animateCursor);
}
animateCursor();

// --------------------------------
// Trail Logic
// --------------------------------
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

    // Keep recent points only
    if (trailPoints.length > 10) {
        trailPoints.shift();
    }

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

    setTimeout(() => {
        pathToRemove?.remove();
    }, 1500);
}

// --------------------------------
// Sketch Marks on Click (unchanged)
// --------------------------------
document.addEventListener('mousedown', () => {
    const markCount = 4;

    for (let i = 0; i < markCount; i++) {
        setTimeout(() => {
            const mark = document.createElement('div');
            mark.className = 'cursor-sketch';

            const offsetX = (Math.random() - 0.5) * 15;
            const offsetY = (Math.random() - 0.5) * 15;

            mark.style.left = (mouseX + offsetX) + 'px';
            mark.style.top = (mouseY + offsetY) + 'px';

            mark.style.setProperty('--rotation', Math.random() * 360 + 'deg');

            document.body.appendChild(mark);
            setTimeout(() => mark.remove(), 500);
        }, i * 25);
    }
});

// --------------------------------
// Hover Enhancements
// --------------------------------
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
// Navigation functionality
// ================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Close mobile menu when clicking on CTA button
const navCta = document.querySelector('.nav-cta');
if (navCta) {
    navCta.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
}

// Add shadow to navbar on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ================================
// Smooth scrolling for anchor links
// ================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Only prevent default if it's not just "#"
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ================================
// Active navigation link handling
// FIX: Properly handles both page-based and section-based navigation
// ================================

// Detect current page from URL
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'home.html';
    return page;
}

// Set active state based on current page
function setActiveNavLink() {
    const currentPage = getCurrentPage();

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // Remove active class from all links first
        link.classList.remove('active');

        // Check if this link matches the current page
        if (href === currentPage ||
            (currentPage === '' && href === 'home.html') ||
            (currentPage === '/' && href === 'home.html')) {
            link.classList.add('active');
        }
    });
}

// On page load, set the correct active link
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
});

// ================================
// Active navigation link on scroll (for home page only)
// ================================
const sections = document.querySelectorAll('section[id]');
const currentPage = getCurrentPage();

// Only run section-based highlighting on the home page
if (currentPage === 'home.html' || currentPage === '' || currentPage === '/') {
    function highlightNavigation() {
        const scrollY = window.pageYOffset;

        // Find the current section
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

        // If we're past all sections (in footer), keep the last section active
        if (!found && sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            currentSection = lastSection.getAttribute('id');
        }

        // Update active state for section links
        navLinks.forEach(link => {
            const href = link.getAttribute('href');

            // Only handle section links (starting with #)
            if (href.startsWith('#')) {
                if (href === `#${currentSection}`) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        });

        // Keep Home link active on home page
        const homeLink = document.querySelector('.nav-link[href="home.html"]');
        if (homeLink && !homeLink.classList.contains('active')) {
            homeLink.classList.add('active');
        }
    }

    window.addEventListener('scroll', highlightNavigation);
}

// ================================
// Contact form handling
// ================================
// const contactForm = document.getElementById('contactForm');

// contactForm.addEventListener('submit', (e) => {
//     e.preventDefault();

// Get form data
// const formData = new FormData(contactForm);
// const data = Object.fromEntries(formData);

// console.log('Form submitted:', data);

// Show success message (you can customize this)
// alert('Thank you for your message! I will get back to you soon.');

// Reset form
// contactForm.reset();

// In a real application, you would send this data to a server
// Example:
// fetch('/api/contact', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
// });
// });

// ================================
// Scroll Indicator Click Handler COMMENTED 2102026
// ================================
// const scrollIndicator = document.querySelector('.scroll-indicator');

// if (scrollIndicator) {
//     scrollIndicator.addEventListener('click', () => {
//         window.scrollTo({
//             top: window.innerHeight,
//             behavior: 'smooth'
//         });
//     });
// }

// ================================
// Intersection Observer for animations
// ================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
const animatedElements = document.querySelectorAll('.project-card, .tech-item, .stat-item');
animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// Animate process steps
const processSteps = document.querySelectorAll('.process-step');
processSteps.forEach((step, index) => {
    step.style.opacity = '0';
    step.style.transform = 'translateX(-30px)';
    step.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
    observer.observe(step);
});

// ================================
// Animate Proficiency Bars
// ================================
const proficiencyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fill = entry.target;
            const proficiency = fill.getAttribute('data-proficiency');
            fill.style.setProperty('--proficiency-width', proficiency + '%');
            fill.classList.add('animate');
            proficiencyObserver.unobserve(fill);
        }
    });
}, { threshold: 0.5 });

const proficiencyBars = document.querySelectorAll('.proficiency-fill');
proficiencyBars.forEach(bar => {
    proficiencyObserver.observe(bar);
});

// ================================
// Parallax effect for hero section
// ================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');

    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = 1 - (scrolled / 500);
    }
});

// ================================
// Add loading animation
// ================================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// ================================
// Dynamic year in footer
// ================================
const currentYear = new Date().getFullYear();
const footerYear = document.querySelector('.footer-bottom p');
if (footerYear) {
    footerYear.textContent = `© ${currentYear} Mark Christian Labucca. All rights reserved.`;
}

// ================================
// Prevent default for placeholder links
// ================================
document.querySelectorAll('a[href="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
        }
    });
});

// ================================
// Add hover effect to project cards
// ================================
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

// ================================
// Skills tag interaction
// ================================
const skillTags = document.querySelectorAll('.skill-tag');
skillTags.forEach(tag => {
    tag.addEventListener('click', function () {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'translateY(-2px)';
        }, 100);
    });
});

// ================================
// Project Filtering with Auto-Sort
// ================================
const filterChips = document.querySelectorAll('.filter-chip');
const projectsGrid = document.querySelector('.projects-grid');
const noResults = document.getElementById('noResults');

// NEW (FIXED) - Initialize empty first
let allProjects = [];

// Populate AFTER DOM is fully ready
window.addEventListener('DOMContentLoaded', () => {
    allProjects = Array.from(document.querySelectorAll('.project-card'));
    filterProjects('all');
});

// Function to sort projects by date (newest first)
function sortProjectsByDate(projects) {
    return projects.sort((a, b) => {
        const dateA = new Date(a.getAttribute('data-date'));
        const dateB = new Date(b.getAttribute('data-date'));
        return dateB - dateA; // Descending order (newest first)
    });
}

// Function to filter and display projects
function filterProjects(filter) {
    // Get all projects from DOM if not already loaded
    if (allProjects.length === 0) {
        allProjects = Array.from(document.querySelectorAll('.project-card'));
    }

    // Get all projects
    let projectsToShow = allProjects;

    // Filter by featured status
    if (filter === 'featured') {
        projectsToShow = allProjects.filter(card =>
            card.getAttribute('data-featured') === 'true'
        );
    }
    // Filter by category if not "all" or "featured"
    else if (filter !== 'all') {
        projectsToShow = allProjects.filter(card =>
            card.getAttribute('data-category').includes(filter)
        );
    }

    // Sort by date
    projectsToShow = sortProjectsByDate([...projectsToShow]);

    // Limit to 6 most recent
    const recentProjects = projectsToShow.slice(0, 6);

    // Hide all projects first with fade out
    allProjects.forEach(card => {
        card.classList.add('fade-out');
    });

    // After fade out animation, update visibility
    setTimeout(() => {
        // Clear the grid
        projectsGrid.innerHTML = '';

        // Show / hide "No Results"
        if (recentProjects.length === 0) {
            noResults.style.display = 'block';
            return;
        } else {
            noResults.style.display = 'none';
        }

        // Add the filtered projects back
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

// Initialize: Sort and show 6 most recent on page load
window.addEventListener('load', () => {
    filterProjects('featured');
});

// Add click event to filter chips
filterChips.forEach(chip => {
    chip.addEventListener('click', function () {
        const filter = this.getAttribute('data-filter');

        // Update active state
        filterChips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        // Filter and sort projects
        filterProjects(filter);
    });
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

        // Easing function for smooth animation
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

// Observe stat numbers for counter animation
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            const target = entry.target.textContent;
            entry.target.classList.add('counted');
            animateCounter(entry.target, target);
        }
    });
}, { threshold: 0.5 });

// Apply observer to all stat numbers
const statNumbers = document.querySelectorAll('.stat-number');
statNumbers.forEach(stat => {
    statObserver.observe(stat);
});
// ================================
// Technology Toggle (See More / See Less)
// ================================
const techToggleBtn = document.getElementById('techToggleBtn');
const techToggleText = document.getElementById('techToggleText');
const techToggleIcon = document.getElementById('techToggleIcon');
const techHiddenItems = document.querySelectorAll('.tech-hidden');

if (techToggleBtn) {
    techToggleBtn.addEventListener('click', () => {
        const isExpanded = techToggleBtn.classList.contains('expanded');

        if (isExpanded) {
            // Collapse - hide items
            techHiddenItems.forEach(item => {
                item.style.display = 'none';
            });
            techToggleText.textContent = 'See More';
            techToggleBtn.classList.remove('expanded');
        } else {
            // Expand - show items
            techHiddenItems.forEach(item => {
                item.style.display = 'block';
            });
            techToggleText.textContent = 'See Less';
            techToggleBtn.classList.add('expanded');
        }
    });
}
// ================================
// Real-Time Clock in Footer (Philippines Time)
// ================================
function updatePhilippinesTime() {
    const timeText = document.getElementById('timeText');
    const timeIcon = document.getElementById('timeIcon');
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');

    if (!timeText || !timeIcon) return;

    // Get current time in Philippines timezone (Asia/Manila)
    const options = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const philippinesTime = formatter.format(new Date());

    // Get hour to determine day/night (for icon)
    const hourOptions = {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        hour12: false
    };
    const hourFormatter = new Intl.DateTimeFormat('en-US', hourOptions);
    const currentHour = parseInt(hourFormatter.format(new Date()));

    // Determine if it's day (6 AM - 6 PM) or night
    const isDay = currentHour >= 6 && currentHour < 18;

    // Update the icon
    if (isDay) {
        timeIcon.classList.remove('night');
        sunIcons.forEach(icon => icon.style.display = '');
        moonIcons.forEach(icon => icon.style.display = 'none');
    } else {
        timeIcon.classList.add('night');
        sunIcons.forEach(icon => icon.style.display = 'none');
        moonIcons.forEach(icon => icon.style.display = '');
    }

    // Update the text
    timeText.textContent = `It's currently ${philippinesTime} in Mark's city`;
}

// Update time immediately and then every second
if (document.getElementById('timeText')) {
    updatePhilippinesTime();
    setInterval(updatePhilippinesTime, 1000);
}

// ================================
// Enhanced Contact Page JavaScript
// ================================

// Real-time timezone display
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    const iconElement = document.getElementById('timezoneIcon');

    if (!timeElement || !iconElement) {
        console.log('Elements not found yet');
        return;
    }

    try {
        const options = {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const time = formatter.format(new Date());

        // Get hour to determine emoji
        const hourOptions = {
            timeZone: 'Asia/Manila',
            hour: 'numeric',
            hour12: false
        };
        const hourFormatter = new Intl.DateTimeFormat('en-US', hourOptions);
        const currentHour = parseInt(hourFormatter.format(new Date()));

        // Update emoji based on time
        if (currentHour >= 5 && currentHour < 12) {
            iconElement.textContent = '🌅';
        } else if (currentHour >= 12 && currentHour < 17) {
            iconElement.textContent = '☀️';
        } else if (currentHour >= 17 && currentHour < 20) {
            iconElement.textContent = '🌇';
        } else {
            iconElement.textContent = '🌙';
        }

        timeElement.textContent = time;
    } catch (error) {
        console.error('Error updating time:', error);
    }
}

// Wait for DOM to load before running time updates
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
    });
} else {
    // DOM already loaded
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

// Character counter for textarea
const messageInput = document.getElementById('message');
const charCount = document.getElementById('charCount');

if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
        const count = messageInput.value.length;
        charCount.textContent = count;

        if (count > 950) {
            charCount.style.color = '#EF4444';
        } else if (count > 800) {
            charCount.style.color = '#F59E0B';
        } else {
            charCount.style.color = 'var(--gray-500)';
        }
    });
}

// Input focus effects
const inputIcons = document.querySelectorAll('.input-icon');

inputIcons.forEach(container => {
    const input = container.querySelector('input, textarea');

    if (input) {
        input.addEventListener('focus', () => {
            container.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            container.classList.remove('focused');
        });
    }
});

// Enhanced form submission with animation
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');
const messageText = document.getElementById('messageText');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        formMessage.classList.remove('show');

        try {
            // Submit form to Formspree
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Simulate minimum loading time for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (response.ok) {
                // Success
                formMessage.classList.remove('error');
                formMessage.classList.add('success', 'show');
                messageText.textContent = '✨ Message sent successfully! I\'ll get back to you soon.';
                contactForm.reset();
                charCount.textContent = '0';

                // Hide success message after 5 seconds
                setTimeout(() => {
                    formMessage.classList.remove('show');
                }, 5000);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            // Error
            formMessage.classList.remove('success');
            formMessage.classList.add('error', 'show');
            messageText.textContent = '❌ Oops! Something went wrong. Please try again.';
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

// Animate elements on scroll
const observersOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observers = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observersOptions);

// Observe all cards
document.querySelectorAll('.availability-card, .contact-methods-card, .social-card, .form-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(card);
});

// Add ripple effect to social cards
const socialCards = document.querySelectorAll('.social-link-card');

socialCards.forEach(card => {
    card.addEventListener('click', function (e) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';

        const rect = card.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left - 10) + 'px';
        ripple.style.top = (e.clientY - rect.top - 10) + 'px';

        card.style.position = 'relative';
        card.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// ================================
// Back to Top Button
// ================================
const backToTopBtn = document.getElementById('backToTop');

// Show/hide button based on scroll position
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

// Scroll to top when button is clicked
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ================================
// Page Loader - Universal
// ================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // Prevent body scroll while loader is active
    document.body.classList.add('loader-active');

    // Setup internal link listeners
    setupInternalLinks();
}

// Hide loader when page is fully loaded
window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');

    if (!loader) return;

    // Add a minimum display time for better UX (500ms)
    setTimeout(() => {
        loader.classList.add('fade-out');
        document.body.classList.remove('loader-active');

        // Remove from DOM after fade out
        setTimeout(() => {
            loader.style.display = 'none';
        }, 1000);
    }, 1000);
});

// Show loader when navigating between pages
function setupInternalLinks() {
    const internalLinks = document.querySelectorAll('a[href^="home.html"], a[href^="work.html"], a[href^="about.html"], a[href^="contact.html"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const loader = document.getElementById('pageLoader');
            if (loader && !e.ctrlKey && !e.metaKey && !e.shiftKey) { // Don't show if opening in new tab
                loader.classList.remove('fade-out');
                loader.style.display = 'flex';
                document.body.classList.add('loader-active');
            }
        });
    });
}