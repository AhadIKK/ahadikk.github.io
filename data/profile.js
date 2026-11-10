/* ==========================================================================
   data/profile.js — the single source of personal data
   --------------------------------------------------------------------------
   EDIT THIS FILE FIRST. Every page reads from this object at runtime.
   Values wrapped in double square brackets are treated as fill-in
   placeholders by profile-render.js. After editing contact details,
   re-print the resume PDF (see README.md).
   ========================================================================== */

window.PROFILE = {
  /* ---- Identity ---------------------------------------------------------- */
  name: "Abdul Ahad Ikkeri",
  firstName: "Abdul Ahad",
  shortName: "Ahad",
  monogram: "AA",
  roles: ["Full Stack Developer", "AI Prompt Engineer", "CSE Student"],
  headline: "I build things that ship.",
  positioning: "Full Stack Developer & AI Prompt Engineer",
  summary:
    "Third-year Computer Science Engineering student at PA College of Engineering. I build clean, useful software — from CommitIt, a Git notifier that messages you, to the front end of Syncura, an AI-automated ICU system.",
  availability: "Open to internship opportunities",

  /* ---- Personal / Bio-data placeholders ---------------------------------- */
  email: "abdulahadikkeri@gmail.com",
  phone: "+91 741-111-3608",
  dob: "04-10-2006",
  nationality: "Indian",
  address: "Mangalore, Karnataka, India",
  languages: "English, Hindi, Kannada, Urdu, Arabic",
  hobbies: "Coding, AI, Gaming, Music, Reading, Travelling",
  photo: "", // add e.g. "assets/img/profile.jpg" to replace the AA monogram with a portrait

  /* ---- Links (these are the real, supplied URLs) -------------------------- */
  links: {
    github: "https://github.com/AhadIKK",
    linkedin: "https://www.linkedin.com/in/abdul-ahad-ikkeri-938421385/",
    commitit: "https://github.com/AhadIKK/CommitIt",
    syncura: "https://github.com/Fizan-Feroz/SynCura"
  },

  /* ---- Site / deployment -------------------------------------------------- */
  // Canonical + OG tags in the HTML use the GitHub Pages root URL. If you
  // deploy to a project path (username.github.io/portfolio/) or Netlify,
  // update those tags and sitemap.xml too (see README).
  siteUrl: "https://ahadikk.github.io/",
  resumePdf: "assets/resume/Abdul-Ahad-Ikkeri-Resume.pdf",

  /* ---- Contact form ------------------------------------------------------- */
  // Optional: create a free form at https://formspree.io/f/YOUR_FORM_ID and
  // paste the endpoint here. Empty = the contact form uses the mailto fallback
  // with the email above. See README.md → Contact form setup.
  formspreeEndpoint: "",

  /* ---- Declaration -------------------------------------------------------- */
  declaration:
    "I hereby declare that the information provided above is true to the best of my knowledge.",

  /* ---- True counts used in the animated stat band ------------------------- */
  stats: [
    {
      value: 3,
      label: "Projects built",
      note: "CommitIt · Syncura · Drone"
    },
    {
      value: 2,
      label: "Certifications",
      note: "1 completed · 1 in progress"
    },
    {
      value: 4,
      label: "Events & initiatives",
      note: "Led or coordinated"
    }
  ],

  /* ---- Education (used in copy only; markup stays in HTML) ---------------- */
  education: {
    college: "PA College of Engineering",
    degree: "B.E. Computer Science Engineering",
    year: "Third year",
    school: "IIS Jubail, Saudi Arabia",
    class10: "Class 10 — CGPA 8.2",
    class12: "Class 12 (PCMCS) — CGPA 8.0"
  }
};
