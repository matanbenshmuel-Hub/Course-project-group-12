/* =========================================================================
   index.js — landing-page-specific interactions.

   Three small things happen on the home page beyond what common.js provides:
     1. Smooth scroll for anchor links (the "#about" CTA, etc.)
     2. Auth-aware CTA buttons — the hero/about/bottom call-to-action
        buttons change their text + destination depending on whether
        the visitor is signed in.
     3. A subtle parallax effect: as the user scrolls, the hero text
        moves a little slower than the rest of the page.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. Smooth scroll for in-page anchor links.
       Bootstrap's default anchor jump is instant; we intercept clicks on
       any <a href="#..."> and use scrollIntoView with smooth behavior. */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* 2. Auth-aware CTA buttons.
       When the visitor is signed in, "הרשמה לקביעת תור" makes no sense —
       we change the buttons to point straight to the booking calendar
       (or to "התורים שלי" for the bottom CTA). */
    const user = getCurrentUser();
    const heroCta   = document.getElementById('heroCta');
    const aboutCta  = document.getElementById('aboutCta');
    const bottomCta = document.getElementById('bottomCta');

    if (user) {
        if (heroCta) {
            heroCta.textContent = 'לקביעת תור';
            heroCta.href = 'appointments.html';
        }
        if (aboutCta) {
            aboutCta.textContent = 'לקביעת תור';
            aboutCta.href = 'appointments.html';
        }
        if (bottomCta) {
            bottomCta.textContent = 'התורים שלי';
            bottomCta.href = 'dashboard.html';
        }
    }

    /* 3. Subtle hero-content parallax.
       As the user scrolls down, the hero text moves down at 15% of the
       scroll speed — creating a soft "depth" effect against the blurred
       background image. We only do this while the hero is still partially
       on screen (scrolled < window height) to save work afterwards.
       passive:true tells the browser this listener won't preventDefault,
       which lets it scroll the page without waiting for our handler. */
    const hero = document.querySelector('.hero-section');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight) {
                const heroContent = hero.querySelector('.hero-content');
                if (heroContent) {
                    heroContent.style.transform = `translateY(${scrolled * 0.15}px)`;
                }
            }
        }, { passive: true });
    }
});
