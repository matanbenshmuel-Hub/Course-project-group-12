/* =========================================================================
   treatments.js — shared data + treatments overview carousel.
   The TREATMENTS array is the single source of truth used by:
     • the carousel on treatments.html
     • the dropdown in the navbar (common.js)
     • the per-treatment detail page (treatment-detail.js)
   Each entry has: slug (URL key), name, icon, desc, method, sources[].
   ========================================================================= */

const TREATMENTS = [
    {
        slug: 'mental-therapy',
        name: 'טיפול נפשי',
        icon: '💭',
        desc: 'טיפול פסיכולוגי מקיף המותאם לצרכים האישיים של כל מטופל, לשיפור האיכות הנפשית והרגשית',
        method: 'הטיפול הנפשי במכון משלב גישות אינטגרטיביות — בעיקר CBT, סכמה תרפיה ופסיכודינמיקה — בתדירות של פגישה שבועית כשעה. בשלב הראשון מתבצעת הערכה והגדרת יעדים יחד עם המטפל, ובהמשך נעשית עבודה מעמיקה על דפוסי חשיבה ורגש לצד פיתוח כלים מעשיים להתמודדות יומיומית.',
        sources: [
            'American Psychological Association (2017). Clinical Practice Guideline for the Treatment of Depression Across Three Age Cohorts.',
            'Wampold, B. E. (2015). How important are the common factors in psychotherapy? An update. World Psychiatry, 14(3), 270–277.',
            'NICE Guideline NG222 (2022). Depression in adults: treatment and management.'
        ]
    },
    {
        slug: 'test-anxiety',
        name: 'חרדת בחינות',
        icon: '📝',
        desc: 'התמודדות עם לחץ וחרדה הקשורים למבחנים ולהערכות, פיתוח כלים להתמודדות אפקטיבית',
        method: 'הטיפול בחרדת בחינות מבוסס על פרוטוקול CBT קצר-מועד (8–12 פגישות) הכולל פסיכו-חינוך על חרדה, חשיפה מדורגת לסיטואציות מבחן, תרגול טכניקות הרפיה ונשימה, ובנייה מחדש של מחשבות אוטומטיות שליליות סביב כישלון. במקביל המטופל לומד אסטרטגיות למידה ושינה התומכות בביצוע אופטימלי.',
        sources: [
            'Cassady, J. C., & Johnson, R. E. (2002). Cognitive Test Anxiety and Academic Performance. Contemporary Educational Psychology, 27(2), 270–295.',
            'Putwain, D. W., & Pescod, M. (2018). Is reducing uncertain control the key to managing test anxiety? Journal of Educational Psychology, 110(3), 419–433.',
            'Beck, J. S. (2020). Cognitive Behavior Therapy: Basics and Beyond (3rd ed.). Guilford Press.'
        ]
    },
    {
        slug: 'ptsd',
        name: 'פוסט טראומה',
        icon: '🛡️',
        desc: 'טיפול מבוסס מחקר בתסמיני פוסט טראומה, עיבוד חוויות קשות והחזרת תחושת הביטחון',
        method: 'הטיפול מתבסס על פרוטוקולים מבוססי ראיות — Prolonged Exposure (PE) ו-Cognitive Processing Therapy (CPT) — לאורך 12–16 פגישות. הטיפול כולל חשיפה מבוקרת ובטוחה לזיכרון הטראומטי, עיבוד מחשבות תקועות סביב אשמה ובושה, ובניית נרטיב חדש המאפשר חזרה הדרגתית לתפקוד.',
        sources: [
            'Foa, E. B., Hembree, E. A., & Rothbaum, B. O. (2019). Prolonged Exposure Therapy for PTSD (2nd ed.). Oxford University Press.',
            'Resick, P. A., Monson, C. M., & Chard, K. M. (2017). Cognitive Processing Therapy for PTSD: A Comprehensive Manual. Guilford Press.',
            'APA (2017). Clinical Practice Guideline for the Treatment of Posttraumatic Stress Disorder in Adults.'
        ]
    },
    {
        slug: 'ocd',
        name: 'טיפול ב-OCD',
        icon: '🔄',
        desc: 'טיפול ממוקד בהפרעה טורדנית-כפייתית באמצעות שיטות מוכחות כמו ERP ו-CBT',
        method: 'הטיפול ב-OCD מבוסס על Exposure and Response Prevention (ERP) — חשיפה מדורגת לטריגרים המעוררים חרדה תוך מניעה הדרגתית של ביצוע הטקסים. הפרוטוקול נמשך כ-16–20 פגישות, ומלווה בעבודה קוגניטיבית על האמונות העומדות בבסיס המחשבות הטורדניות.',
        sources: [
            'Foa, E. B., Yadin, E., & Lichner, T. K. (2012). Exposure and Response Prevention for Obsessive-Compulsive Disorder: Therapist Guide (2nd ed.). Oxford University Press.',
            'NICE Guideline CG31 (2005, updated 2019). Obsessive-compulsive disorder and body dysmorphic disorder: treatment.',
            'Abramowitz, J. S. (2018). Getting Over OCD: A 10-Step Workbook. Guilford Press.'
        ]
    },
    {
        slug: 'social-anxiety',
        name: 'חרדה חברתית',
        icon: '👥',
        desc: 'התגברות על פחד מסיטואציות חברתיות, בניית ביטחון עצמי ושיפור מיומנויות בין-אישיות',
        method: 'הטיפול משלב פרוטוקול CBT לחרדה חברתית (Clark & Wells) הכולל זיהוי הטיות קשב כלפי הסביבה, חשיפה התנהגותית לסיטואציות חברתיות מאתגרות, וניסויים התנהגותיים לבחינת תחזיות שליליות. אורך הטיפול הממוצע 14–16 פגישות.',
        sources: [
            'Clark, D. M., & Wells, A. (1995). A cognitive model of social phobia. In Heimberg et al. (Eds.), Social Phobia: Diagnosis, Assessment, and Treatment. Guilford Press.',
            'Heimberg, R. G. (2002). Cognitive-behavioral therapy for social anxiety disorder. Clinical Psychology Review, 22(4), 525–544.',
            'NICE Guideline CG159 (2013). Social anxiety disorder: recognition, assessment and treatment.'
        ]
    },
    {
        slug: 'schema-therapy',
        name: 'סכמה תרפיה',
        icon: '🧩',
        desc: 'זיהוי דפוסים רגשיים עמוקים שנוצרו בילדות ועבודה על שינויים משמעותיים ובני-קיימא',
        method: 'סכמה תרפיה היא טיפול ממושך (לרוב 12–24 חודשים) שמטרתו לזהות סכמות מוקדמות לא-מסתגלות שנוצרו בילדות ולעבוד על שינויין באמצעות טכניקות חוויתיות (כיסא ריק, דמיון מודרך) לצד עבודה קוגניטיבית והתנהגותית. הטיפול מתאים במיוחד להפרעות אישיות וקשיים כרוניים.',
        sources: [
            'Young, J. E., Klosko, J. S., & Weishaar, M. E. (2003). Schema Therapy: A Practitioner\'s Guide. Guilford Press.',
            'Arntz, A., & Jacob, G. (2017). Schema Therapy in Practice: An Introductory Guide. Wiley-Blackwell.',
            'Bamelis, L. L. M., et al. (2014). Results of a multicenter randomized controlled trial of the clinical effectiveness of schema therapy for personality disorders. American Journal of Psychiatry, 171(3), 305–322.'
        ]
    },
    {
        slug: 'anxiety',
        name: 'חרדה',
        icon: '🌀',
        desc: 'טיפול בחרדה כללית, התקפי חרדה ודאגנות מוגזמת באמצעות כלים קוגניטיביים והתנהגותיים',
        method: 'הטיפול בהפרעת חרדה מוכללת (GAD) משלב CBT ממוקד דאגה, אימון בהרפיה ונשימה דיאפרגמטית, וטכניקות מיינדפולנס. בטיפול בהתקפי חרדה (Panic) מתבצעת חשיפה פנימית (Interoceptive Exposure) לתחושות הגוף המעוררות פאניקה. הפרוטוקול נמשך 10–14 פגישות.',
        sources: [
            'Barlow, D. H., Farchione, T. J., et al. (2017). Unified Protocol for Transdiagnostic Treatment of Emotional Disorders. Oxford University Press.',
            'Craske, M. G., & Barlow, D. H. (2014). Mastery of Your Anxiety and Worry (2nd ed.). Oxford University Press.',
            'NICE Guideline CG113 (2011, updated 2020). Generalised anxiety disorder and panic disorder in adults: management.'
        ]
    },
    {
        slug: 'cbt',
        name: 'CBT',
        icon: '🧠',
        desc: 'טיפול קוגניטיבי-התנהגותי - גישה מובנית וממוקדת מטרה לשינוי דפוסי חשיבה והתנהגות',
        method: 'CBT היא גישה מובנית, ממוקדת מטרה ומוגבלת בזמן (לרוב 12–20 פגישות), המבוססת על הקשר ההדדי בין מחשבות, רגשות והתנהגות. כל פגישה כוללת אג\'נדה ברורה, סקירת מטלות בית, עבודה על מטרות שבועיות, ותרגול מיומנויות חדשות בין הפגישות.',
        sources: [
            'Beck, A. T. (1979). Cognitive Therapy and the Emotional Disorders. Penguin.',
            'Beck, J. S. (2020). Cognitive Behavior Therapy: Basics and Beyond (3rd ed.). Guilford Press.',
            'Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427–440.'
        ]
    },
    {
        slug: 'depression',
        name: 'דיכאון',
        icon: '🌧️',
        desc: 'טיפול מקצועי בדיכאון, החזרת המוטיבציה ושיפור מצב הרוח באמצעות גישות מוכחות',
        method: 'הטיפול בדיכאון משלב הפעלה התנהגותית (Behavioral Activation) — תכנון פעילויות מהנות ומספקות — יחד עם רה-סטרוקטורציה קוגניטיבית של מחשבות שליליות אוטומטיות. בהתאם לחומרה ניתן לשלב טיפול תרופתי בליווי פסיכיאטר. אורך הטיפול הטיפוסי 12–20 פגישות.',
        sources: [
            'Beck, A. T., Rush, A. J., Shaw, B. F., & Emery, G. (1979). Cognitive Therapy of Depression. Guilford Press.',
            'Martell, C. R., Dimidjian, S., & Herman-Dunn, R. (2010). Behavioral Activation for Depression: A Clinician\'s Guide. Guilford Press.',
            'NICE Guideline NG222 (2022). Depression in adults: treatment and management.'
        ]
    },
    {
        slug: 'empowerment',
        name: 'העצמה אישית',
        icon: '💪',
        desc: 'חיזוק הביטחון העצמי, פיתוח חוסן נפשי וכלים להתמודדות עם אתגרי החיים',
        method: 'תהליך ההעצמה האישית משלב פסיכולוגיה חיובית, זיהוי נקודות חוזק ועבודה על תחושת המסוגלות העצמית (Self-efficacy). הטיפול ממוקד-פתרון, בן 8–12 פגישות, ובמרכזו הצבת יעדים מדידים, תרגול מיומנויות אסרטיביות ובנייה הדרגתית של דימוי עצמי חיובי.',
        sources: [
            'Bandura, A. (1997). Self-Efficacy: The Exercise of Control. W. H. Freeman.',
            'Seligman, M. E. P. (2011). Flourish: A Visionary New Understanding of Happiness and Well-being. Free Press.',
            'Peterson, C., & Seligman, M. E. P. (2004). Character Strengths and Virtues: A Handbook and Classification. APA Press.'
        ]
    },
    {
        slug: 'guided-imagery',
        name: 'דמיון מודרך',
        icon: '🌈',
        desc: 'שימוש בטכניקות דמיון והרפיה להפחתת מתח, עיבוד רגשי ושינוי דפוסים פנימיים',
        method: 'הטיפול בדמיון מודרך משתמש בהדרכה ורבלית להובלת המטופל למצב הרפיה עמוקה ולעבודה דמיונית עם תכנים רגשיים. הטכניקה מתאימה לטיפול בכאב כרוני, חרדה, טראומה ולתהליכי שינוי. כל פגישה אורכת כ-50 דקות ומסתיימת בתרגול שהמטופל לוקח איתו הביתה.',
        sources: [
            'Achterberg, J. (2002). Imagery in Healing: Shamanism and Modern Medicine. Shambhala.',
            'Naparstek, B. (2004). Invisible Heroes: Survivors of Trauma and How They Heal. Bantam.',
            'Trakhtenberg, E. C. (2008). The effects of guided imagery on the immune system: A critical review. International Journal of Neuroscience, 118(6), 839–855.'
        ]
    },
    {
        slug: 'psychological-assessment',
        name: 'אבחון פסיכולוגי',
        icon: '📋',
        desc: 'הערכה פסיכולוגית מקיפה לזיהוי קשיים, חוזקות והתאמת תוכנית טיפול מדויקת',
        method: 'תהליך האבחון נמשך 2–4 פגישות וכולל ראיון קליני מובנה, מילוי שאלונים סטנדרטיים (כגון BDI, BAI, MMPI), ולעיתים מבחנים השלכתיים. בסיומו ניתנת חוות דעת כתובה ופגישת משוב המסבירה את הממצאים וההמלצות לתוכנית טיפול מותאמת אישית.',
        sources: [
            'American Psychiatric Association (2022). DSM-5-TR: Diagnostic and Statistical Manual of Mental Disorders (5th ed., text rev.).',
            'Groth-Marnat, G., & Wright, A. J. (2016). Handbook of Psychological Assessment (6th ed.). Wiley.',
            'Beck, A. T., Steer, R. A., & Brown, G. K. (1996). Manual for the Beck Depression Inventory-II. Psychological Corporation.'
        ]
    },
    {
        slug: 'couples',
        name: 'זוגיות',
        icon: '💑',
        desc: 'טיפול זוגי לשיפור התקשורת, חיזוק הקשר הזוגי והתמודדות עם משברים ביחסים',
        method: 'הטיפול הזוגי מבוסס על גישת EFT (Emotionally Focused Therapy) של סו ג\'ונסון, המתמקדת בזיהוי מעגלים שליליים של אינטראקציה והבנת הצרכים הרגשיים המרכזיים של כל בן/בת זוג. הטיפול נמשך 12–20 פגישות ומתקיים בנוכחות שני בני הזוג.',
        sources: [
            'Johnson, S. M. (2019). Attachment Theory in Practice: Emotionally Focused Therapy with Individuals, Couples, and Families. Guilford Press.',
            'Gottman, J. M., & Silver, N. (2015). The Seven Principles for Making Marriage Work. Harmony Books.',
            'Greenberg, L. S., & Goldman, R. N. (2008). Emotion-Focused Couples Therapy: The Dynamics of Emotion, Love, and Power. APA Press.'
        ]
    },
    {
        slug: 'mindfulness',
        name: 'מיינדפולנס',
        icon: '🧘',
        desc: 'פיתוח מודעות רגעית, הפחתת לחץ ושיפור הויסות הרגשי באמצעות תרגול קשיבות',
        method: 'הטיפול מבוסס על תוכנית MBSR בת 8 שבועות הכוללת מפגשים שבועיים של שעתיים ותרגול יומי בבית של 30–45 דקות. הפרוטוקול משלב תרגולי נשימה, סריקת גוף (Body Scan), מדיטציה ויוגה עדינה, ופיתוח התבוננות לא-שיפוטית במחשבות וברגשות.',
        sources: [
            'Kabat-Zinn, J. (2013). Full Catastrophe Living: Using the Wisdom of Your Body and Mind to Face Stress, Pain, and Illness (Rev. ed.). Bantam.',
            'Segal, Z. V., Williams, J. M. G., & Teasdale, J. D. (2018). Mindfulness-Based Cognitive Therapy for Depression (2nd ed.). Guilford Press.',
            'Khoury, B., et al. (2015). Mindfulness-based stress reduction for healthy individuals: A meta-analysis. Journal of Psychosomatic Research, 78(6), 519–528.'
        ]
    },
    {
        slug: 'short-term-therapy',
        name: 'טיפול קצר מועד',
        icon: '⏱️',
        desc: 'טיפול ממוקד ויעיל עם מטרות מוגדרות, מתאים למי שמחפש תוצאות בטווח קצר',
        method: 'טיפול קצר מועד (Brief Therapy) נמשך 6–12 פגישות, מתחיל בהגדרה ברורה של בעיה ממוקדת ויעדים מדידים. הגישה משלבת מרכיבים מתוך SFBT (Solution-Focused Brief Therapy) ו-CBT, ועוסקת בהווה ובעתיד יותר מאשר בעבר.',
        sources: [
            'de Shazer, S., & Dolan, Y. (2007). More Than Miracles: The State of the Art of Solution-Focused Brief Therapy. Routledge.',
            'Cooper, J. F. (1995). A Primer of Brief Psychotherapy. W. W. Norton.',
            'Iveson, C. (2002). Solution-focused brief therapy. Advances in Psychiatric Treatment, 8(2), 149–156.'
        ]
    },
    {
        slug: 'psychotherapy',
        name: 'פסיכותרפיה',
        icon: '🪑',
        desc: 'תהליך טיפולי מעמיק לחקירה עצמית, הבנת דפוסים רגשיים וצמיחה אישית',
        method: 'פסיכותרפיה דינמית היא תהליך עומק ארוך-טווח (12–24 חודשים ומעלה) הבוחן את הקשר בין החוויה המוקדמת לדפוסים בהווה. דרך הקשר הטיפולי, הטרנספרנס וההקשבה לחומרים לא-מודעים, מתאפשרת עבודה על שינוי מהותי באישיות וביחסים.',
        sources: [
            'McWilliams, N. (2011). Psychoanalytic Diagnosis: Understanding Personality Structure in the Clinical Process (2nd ed.). Guilford Press.',
            'Shedler, J. (2010). The efficacy of psychodynamic psychotherapy. American Psychologist, 65(2), 98–109.',
            'Yalom, I. D. (2002). The Gift of Therapy: An Open Letter to a New Generation of Therapists and Their Patients. HarperCollins.'
        ]
    },
    {
        slug: 'psychological-therapy',
        name: 'טיפול פסיכולוגי',
        icon: '🌿',
        desc: 'מרחב טיפולי מקצועי ומכיל להתמודדות עם מגוון רחב של קשיים נפשיים ורגשיים',
        method: 'טיפול פסיכולוגי כללי במכון מותאם אישית לכל מטופל ולקשייו. לאחר שלב הערכה ראשוני בן 2–3 פגישות נבחרת הגישה המתאימה ביותר — דינמית, קוגניטיבית-התנהגותית או אינטגרטיבית — ונקבעת תדירות הפגישות (שבועית עד חודשית).',
        sources: [
            'Norcross, J. C., & Lambert, M. J. (2018). Psychotherapy relationships that work III. Psychotherapy, 55(4), 303–315.',
            'APA (2013). Recognition of Psychotherapy Effectiveness. American Psychological Association resolution.',
            'Wampold, B. E., & Imel, Z. E. (2015). The Great Psychotherapy Debate: The Evidence for What Makes Psychotherapy Work (2nd ed.). Routledge.'
        ]
    },
    {
        slug: 'executive-coaching',
        name: 'פיתוח מנהלים',
        icon: '📊',
        desc: 'ליווי וקואצ\'ינג למנהלים לפיתוח מנהיגות, ניהול לחצים וקבלת החלטות אפקטיבית',
        method: 'תהליך פיתוח מנהלים נמשך 4–8 חודשים בתדירות של פגישה דו-שבועית. הוא משלב הערכה של סגנון מנהיגות, עבודה על מיומנויות תקשורת, ניהול קונפליקטים, האצלת סמכויות וניהול עצמי תחת לחץ. נעשה שימוש בכלי הערכה כגון 360-degree feedback.',
        sources: [
            'Goleman, D. (2000). Leadership that gets results. Harvard Business Review, 78(2), 78–90.',
            'Kilburg, R. R. (2000). Executive Coaching: Developing Managerial Wisdom in a World of Chaos. APA Press.',
            'Theeboom, T., Beersma, B., & van Vianen, A. E. M. (2014). Does coaching work? A meta-analysis. Journal of Positive Psychology, 9(1), 1–18.'
        ]
    },
    {
        slug: 'crisis-intervention',
        name: 'טיפול במצבי משבר',
        icon: '🆘',
        desc: 'התערבות מהירה ומקצועית במצבי חירום רגשיים, ייצוב והחזרת תפקוד',
        method: 'התערבות במצבי משבר מתבצעת בפגישות צפופות (2–3 בשבוע) למשך 2–4 שבועות, על פי מודל ABC: השגת קשר (Achieve), זיהוי הבעיה (Boil down) והתמודדות (Cope). המטרה המיידית היא ייצוב, מניעת סיכון עצמי והחזרת המטופל לתפקוד בסיסי, ולאחר מכן מעבר לטיפול קצר או ממושך.',
        sources: [
            'Roberts, A. R. (2005). Crisis Intervention Handbook: Assessment, Treatment, and Research (3rd ed.). Oxford University Press.',
            'James, R. K., & Gilliland, B. E. (2017). Crisis Intervention Strategies (8th ed.). Cengage Learning.',
            'WHO (2018). Mental Health in Emergencies: Mental Health and Psychosocial Support.'
        ]
    },
    {
        slug: 'grief-therapy',
        name: 'טיפול במצבי אבל ושכול',
        icon: '🕊️',
        desc: 'ליווי בתהליך האבל, עיבוד הכאב והאובדן ומציאת דרכים להמשיך הלאה',
        method: 'הטיפול באבל מבוסס על מודל המשימות של Worden — קבלת מציאות האובדן, עיבוד הכאב, התאמה לחיים בהיעדר, ומציאת קשר מתמשך תוך המשך החיים. הטיפול נע בין 6 חודשים לשנתיים בתדירות שבועית או דו-שבועית, ובאבל מורכב (Complicated Grief) נעשה שימוש בפרוטוקול CGT.',
        sources: [
            'Worden, J. W. (2018). Grief Counseling and Grief Therapy: A Handbook for the Mental Health Practitioner (5th ed.). Springer.',
            'Shear, M. K., et al. (2016). Treatment of complicated grief in elderly persons: A randomized clinical trial. JAMA Psychiatry, 71(11), 1287–1295.',
            'Neimeyer, R. A. (2012). Techniques of Grief Therapy: Creative Practices for Counseling the Bereaved. Routledge.'
        ]
    }
];

/* Four cards per carousel slide → 20 treatments / 4 = 5 slides total. */
const CARDS_PER_SLIDE = 4;

/* ── Carousel build (only runs on treatments.html) ──────────────────────── */
/* treatments.js is loaded on every page (because common.js needs the
   TREATMENTS array for the navbar dropdown). The buildCarousel function
   below early-returns when the carousel container isn't on the page,
   so it's harmless to include this file everywhere. */
document.addEventListener('DOMContentLoaded', buildCarousel);

function buildCarousel() {
    const inner = document.getElementById('carouselInner');
    if (!inner) return;                  // not on treatments.html — nothing to do

    const indicators = document.getElementById('carouselIndicators');
    const totalSlides = Math.ceil(TREATMENTS.length / CARDS_PER_SLIDE);

    /* For each slide: create the indicator dot at the bottom, then build
       the slide content (a Bootstrap row of up to 4 cards). */
    for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
        /* Indicator dot at the bottom — Bootstrap wires it up via the
           data-bs-* attributes (no extra JS needed). */
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.setAttribute('data-bs-target', '#treatmentsCarousel');
        indicator.setAttribute('data-bs-slide-to', slideIndex);
        indicator.setAttribute('aria-label', `שקופית ${slideIndex + 1}`);
        if (slideIndex === 0) indicator.classList.add('active');
        indicators.appendChild(indicator);

        /* The slide itself — first slide is "active" so it shows initially. */
        const slide = document.createElement('div');
        slide.className = `carousel-item ${slideIndex === 0 ? 'active' : ''}`;

        /* Bootstrap row holding up to 4 cards. */
        const row = document.createElement('div');
        row.className = 'row g-4 px-3';

        const startIdx = slideIndex * CARDS_PER_SLIDE;
        const endIdx = Math.min(startIdx + CARDS_PER_SLIDE, TREATMENTS.length);

        /* Build a clickable card for every treatment in this slide. */
        for (let i = startIdx; i < endIdx; i++) {
            const t = TREATMENTS[i];
            const col = document.createElement('div');
            col.className = 'col-lg-3 col-md-6 col-12';
            /* The whole card is wrapped in an <a> so clicking anywhere on it
               navigates to the matching detail page (?type=<slug>). */
            col.innerHTML = `
                <a href="treatment-detail.html?type=${t.slug}" class="treatment-card-link">
                    <div class="card treatment-card text-center">
                        <div class="card-body">
                            <span class="treatment-icon">${t.icon}</span>
                            <h5>${t.name}</h5>
                            <p>${t.desc}</p>
                        </div>
                    </div>
                </a>`;
            row.appendChild(col);
        }

        slide.appendChild(row);
        inner.appendChild(slide);
    }
}
