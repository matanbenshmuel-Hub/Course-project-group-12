/* =========================================================================
   treatment-detail.js — controls treatment-detail.html.

   The page is a generic template. The treatment to display is chosen by
   the URL query string, for example:

       treatment-detail.html?type=anxiety

   We read the "type" parameter, find the matching entry in the shared
   TREATMENTS array (loaded earlier from js/treatments.js), and inject:
     - the icon, name and short description into the hero
     - the long description and clinical method into the body
     - each bibliography item into the sources <ul>

   If the slug is missing or doesn't match anything (e.g. someone typed
   ?type=foo by hand), the "not found" panel is shown instead.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const slug = new URLSearchParams(window.location.search).get('type');
    const treatment = TREATMENTS.find(t => t.slug === slug);

    if (!treatment) {
        document.getElementById('treatmentHero').classList.add('d-none');
        document.getElementById('treatmentBody').classList.add('d-none');
        document.getElementById('notFound').classList.remove('d-none');
        document.title = 'תחום לא נמצא | מכון אינטגרציה';
        return;
    }

    document.title = `${treatment.name} | מכון אינטגרציה`;
    document.getElementById('treatmentIcon').textContent    = treatment.icon;
    document.getElementById('treatmentName').textContent    = treatment.name;
    document.getElementById('treatmentTagline').textContent = treatment.desc;
    document.getElementById('treatmentDesc').textContent    = treatment.desc;
    document.getElementById('treatmentMethod').textContent  = treatment.method;

    const list = document.getElementById('treatmentSources');
    treatment.sources.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        list.appendChild(li);
    });

    /* Auth-aware "Book Appointment" CTA — skip the auth gate if already signed in. */
    if (getCurrentUser()) {
        document.getElementById('bookCta').href = '/appointments.html';
    }
});
