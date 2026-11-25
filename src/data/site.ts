// All site content lives here. Edit this file to update the page.

export const profile = {
  name: 'Mohammed Al-Naser',
  firstLine: 'Mohammed',
  secondLine: 'Al-Naser',
  role: 'AI Engineer',
  tagline: 'I build models and LLM apps, and measure how well they actually work.',
  email: 'mohammed.alnaser.dev@gmail.com',
  links: {
    github: 'https://github.com/NagaseKoken',
    linkedin: 'https://www.linkedin.com/in/mohammedalnaser',
  },
  progress: { label: 'First Honors · KFUPM', value: 3.78, max: 4.0 },
};

export const about = {
  lead: 'I like making models that work outside the notebook.',
  body: 'Software engineering graduate from KFUPM with a focus on AI and machine learning. Most of my work is computer vision, generative models and retrieval. Off hours: games and anime.',
  stats: [
    { value: 3.78, decimals: 2, suffix: '', label: 'GPA · First Honors' },
  ],
  toolbox: [
    { group: 'Languages', items: ['Python', 'TypeScript', 'SQL', 'Java'] },
    { group: 'Machine learning', items: ['PyTorch', 'scikit-learn', 'OpenCV', 'YOLOv8'] },
    { group: 'Build & ship', items: ['FastAPI', 'Next.js', 'Docker', 'PostgreSQL'] },
  ],
};

export type Epoch = {
  dates: string;
  role: string;
  org: string;
  short: string; // label shown on the loss graph
  text: string;
};

// Oldest first: the page reads like a training run.
export const epochs: Epoch[] = [
  {
    dates: '2021 — 2026',
    role: 'B.E. Software Engineering',
    org: 'KFUPM',
    short: 'KFUPM',
    text: 'AI and machine learning concentration. Graduated with First Honors.',
  },
  {
    dates: 'Fall 2024',
    role: 'Exchange semester',
    org: 'Arizona State University',
    short: 'ASU',
    text: 'Full merit scholarship, awarded to top-ranked students.',
  },
  {
    dates: 'Summer 2025',
    role: 'Software Engineering Intern',
    org: 'FlxCode',
    short: 'FlxCode',
    text: 'Built the REST API and Next.js storefront for Eco3D, including a 3D viewer that runs in the browser.',
  },
  {
    dates: '2026 →',
    role: 'AI Engineer',
    org: 'open to roles',
    short: 'Now',
    text: 'Thesis paper out on arXiv. Looking for my next team.',
  },
];

export type Experiment = {
  id: string;
  title: string;
  status: string;
  shipped: boolean;
  hypothesis: string;
  method: string[];
  result: string;
  note?: string;
  visual: 'restore' | 'cheque' | 'sign';
  codeSoon?: boolean;
  // Add links here when ready, e.g. { label: 'Code', href: 'https://github.com/...' }
  links: { label: string; href: string }[];
};

export const experiments: Experiment[] = [
  {
    id: 'EXP-01',
    title: 'WaveFlow-UIE',
    status: 'Preprint · arXiv',
    shipped: true,
    hypothesis: 'A flow-matching model can restore underwater photos better than diffusion, and much faster.',
    method: ['Python', 'PyTorch', 'Flow matching'],
    result: 'PSNR 24.98 · ~17 ms per image',
    note: 'B.Sc. thesis',
    visual: 'restore',
    links: [
      { label: 'Paper', href: 'https://arxiv.org/abs/2611.15457' },
      { label: 'Code', href: 'https://github.com/BRAIN-Lab-AI/WaveLift-Fast-Frequency-Guided-Underwater-Restoration' },
    ],
  },
  {
    id: 'EXP-02',
    title: 'Arabic cheque reader',
    status: 'Done',
    shipped: true,
    hypothesis: 'Four small models in a chain can read a handwritten cheque and check that the amounts agree.',
    method: ['PyTorch', 'YOLOv8', 'OCR'],
    result: '97.6% digit accuracy',
    note: 'Tested on 600 cheques',
    visual: 'cheque',
    links: [{ label: 'Code', href: 'https://github.com/Hassanxsa/NLP-Project' }],
  },
  {
    id: 'EXP-03',
    title: 'Saudi Sign Language reader',
    status: 'In progress',
    shipped: false,
    hypothesis: 'A transformer over body and hand keypoints can turn continuous signing video into a sentence, sign by sign.',
    method: ['PyTorch', 'Transformers', 'Pose keypoints'],
    result: 'Continuous signs → glosses',
    note: 'Isharah dataset · 30,000+ videos',
    visual: 'sign',
    codeSoon: true,
    links: [{ label: 'Dataset', href: 'https://snalyami.github.io/Isharah_CSLR/' }],
  },
];
