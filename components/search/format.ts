import type { ExperienceLevel, Job } from "@/components/search/types";

export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax" | "currency">): string {
  if (job.salaryMin === null && job.salaryMax === null) return "Salary not specified";

  const fmt = new Intl.NumberFormat("ru-RU");

  const currency = job.currency;
  const min = job.salaryMin;
  const max = job.salaryMax;

  if (min !== null && max !== null) return `${fmt.format(min)}–${fmt.format(max)} ${currency}`;
  if (min !== null) return `from ${fmt.format(min)} ${currency}`;
  if (max !== null) return `up to ${fmt.format(max)} ${currency}`;

  return "Salary not specified";
}

export function formatExperience(level: ExperienceLevel | undefined): string {
  switch (level) {
    case "noExperience":
      return "No experience";
    case "between1And3":
      return "1-3 years";
    case "between3And6":
      return "3-6 years";
    case "moreThan6":
      return "6+ years";
    default:
      return "Experience not specified";
  }
}
