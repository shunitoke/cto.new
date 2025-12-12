import "server-only";

import type { Currency, ExperienceLevel, Job } from "@/features/jobs/types";

type RoleTemplate = {
  title: string;
  tags: string[];
  experience: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  currency: Currency;
  summary: string;
};

const roleTemplates: RoleTemplate[] = [
  {
    title: "Frontend Engineer (React)",
    tags: ["React", "TypeScript", "Tailwind"],
    experience: "between3And6",
    salaryMin: 200000,
    salaryMax: 320000,
    currency: "RUB",
    summary: "Build and maintain modern web UIs with a strong focus on performance and DX.",
  },
  {
    title: "Backend Engineer (Node.js)",
    tags: ["Node.js", "PostgreSQL", "REST"],
    experience: "between3And6",
    salaryMin: 220000,
    salaryMax: 350000,
    currency: "RUB",
    summary: "Design APIs, data models and background jobs with a pragmatic engineering mindset.",
  },
  {
    title: "Fullstack Engineer (Next.js)",
    tags: ["Next.js", "React", "TypeScript"],
    experience: "moreThan6",
    salaryMin: 300000,
    salaryMax: 450000,
    currency: "RUB",
    summary: "Own features end-to-end, from UI to API contracts, with a product-first mindset.",
  },
  {
    title: "Data Analyst (Product)",
    tags: ["SQL", "Amplitude", "A/B tests"],
    experience: "between1And3",
    salaryMin: 140000,
    salaryMax: 220000,
    currency: "RUB",
    summary: "Help teams make decisions with clear metrics, dashboards, and lightweight experimentation.",
  },
  {
    title: "DevOps Engineer", 
    tags: ["Kubernetes", "Terraform", "CI/CD"],
    experience: "moreThan6",
    salaryMin: 320000,
    salaryMax: 480000,
    currency: "RUB",
    summary: "Own infrastructure, developer tooling, and reliability for production services.",
  },
  {
    title: "QA Engineer (Automation)",
    tags: ["Playwright", "API tests", "CI"],
    experience: "between3And6",
    salaryMin: 180000,
    salaryMax: 260000,
    currency: "RUB",
    summary: "Build reliable end-to-end coverage and partner with teams to ship with confidence.",
  },
  {
    title: "Mobile Engineer (React Native)",
    tags: ["React Native", "iOS", "Android"],
    experience: "between3And6",
    salaryMin: 220000,
    salaryMax: 360000,
    currency: "RUB",
    summary: "Create polished mobile experiences and keep the release pipeline healthy.",
  },
  {
    title: "ML Engineer (NLP)",
    tags: ["Python", "LLMs", "MLOps"],
    experience: "moreThan6",
    salaryMin: 420000,
    salaryMax: 650000,
    currency: "RUB",
    summary: "Productionize language models, evaluate quality, and improve latency/cost trade-offs.",
  },
];

const companies = [
  "Acme Labs",
  "Northwind",
  "Contoso",
  "Stark Industries",
  "Umbrella",
  "Wayne Tech",
  "Initech",
  "Globex",
];

const locations = [
  { city: "Moscow", remote: false },
  { city: "Saint Petersburg", remote: false },
  { city: "Kazan", remote: false },
  { city: "Novosibirsk", remote: false },
  { city: "Yekaterinburg", remote: false },
  { city: "Remote", remote: true },
];

function buildDescription(role: RoleTemplate, city: string, remote: boolean): string {
  const locationLine = remote
    ? "This role is remote-first (with optional team meetups a few times per year)."
    : `This role is based in ${city} with a flexible hybrid schedule.`;

  return [
    role.summary,
    "",
    locationLine,
    "",
    "What you'll do:",
    "- Ship product features in short, predictable iterations",
    "- Collaborate with design/product and iterate quickly based on feedback",
    "- Keep code quality high with tests, reviews and pragmatic refactoring",
    "",
    "What we're looking for:",
    `- ${role.experience === "noExperience" ? "A strong interest" : "Hands-on experience"} with ${role.tags.join(", ")}`,
    "- Clear written communication and async collaboration",
    "- Ability to work with ambiguous requirements and propose solutions",
    "",
    "Why it might be a fit:",
    "- Reasonable scope, clear priorities, and a supportive team culture",
    "- Focus on sustainability: healthy on-call, documentation, and tooling",
  ].join("\n");
}

export const allJobs: Job[] = Array.from({ length: 72 }, (_v, i) => {
  const role = roleTemplates[i % roleTemplates.length]!;
  const company = companies[i % companies.length]!;
  const location = locations[i % locations.length]!;

  const id = String(i + 1);
  const salaryJitter = (i % 5) * 10000;
  const now = new Date();
  const publishedDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // Spread across days

  return {
    id,
    title: role.title,
    company,
    city: location.city,
    remote: location.remote,
    experience: role.experience,
    salaryMin: role.salaryMin + salaryJitter,
    salaryMax: role.salaryMax + salaryJitter,
    currency: role.currency,
    tags: role.tags,
    description: buildDescription(role, location.city, location.remote),
    publishedAt: publishedDate.toISOString(),
    url: `https://api.hh.ru/vacancies/${id}`,
    applyUrl: `https://hh.ru/applicant/vacancy_response?vacancyId=${id}`,
    employer: {
      id: `employer_${i % 8}`,
      name: company,
    },
  } satisfies Job;
});
