// Landing page — smooth scroll, parallax, and auth-aware CTAs

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Auth-aware CTA buttons
    const user = getCurrentUser();
    const heroCta = document.getElementById('heroCta');
    const aboutCta = document.getElementById('aboutCta');
    const bottomCta = document.getElementById('bottomCta');

    if (user) {
        // Logged in — point CTAs to booking / dashboard
        if (heroCta) {
            heroCta.textContent = 'לקביעת תור';
            heroCta.href = '/appointments.html';
        }
        if (aboutCta) {
            aboutCta.textContent = 'לקביעת תור';
            aboutCta.href = '/appointments.html';
        }
        if (bottomCta) {
            bottomCta.textContent = 'התורים שלי';
            bottomCta.href = '/dashboard.html';
        }
    }

    // Subtle parallax on hero content
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
