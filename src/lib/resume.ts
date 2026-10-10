// ─── Resume parsing: PDF/DOCX/TXT → structured Resume ────────────────
import type { Resume } from '../types';
import { v4 as uuid } from './uuid';

const SKILL_LEXICON = [
  // languages & runtimes
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Dart', 'SQL',
  // frontend
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Redux', 'Tailwind CSS', 'HTML', 'CSS', 'Jetpack Compose', 'Flutter', 'React Native',
  // backend & APIs
  'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST API', 'gRPC', 'tRPC',
  // data & AI
  'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'LLM', 'LangChain', 'RAG', 'Prompt Engineering',
  // mobile
  'Android', 'iOS', 'Kotlin Multiplatform',
  // devops & cloud
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'GitHub Actions', 'Terraform', 'Linux', 'Nginx',
  // databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'SQLite', 'Elasticsearch',
  // tools
  'Git', 'Figma', 'Postman', 'Jira', 'Vite', 'Webpack',
  // concepts
  'System Design', 'Microservices', 'Agile', 'Testing', 'DSA', 'OOP',
];

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Use the bundled worker from the installed package
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return text;
}

async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return extractPdfText(buf);
  if (name.endsWith('.docx')) return extractDocxText(buf);
  return new TextDecoder().decode(buf);
}

function extractSkillsRegex(text: string): string[] {
  const found = new Set<string>();
  for (const skill of SKILL_LEXICON) {
    const re = new RegExp(`(?<![A-Za-z0-9+#])${skill.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9+#])`, 'i');
    if (re.test(text)) found.add(skill);
  }
  return [...found];
}

export function parseResumeText(text: string, filename: string): Resume {
  const email = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0];
  const phone = text.match(/(\+\d{1,3}[\s-]?)?\d{10}/)?.[0];
  const nameMatch = text.split('\n').map((l) => l.trim()).find((l) => /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(l) && l.length < 40);
  const yearsMatch = text.match(/(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/i);

  return {
    id: uuid(),
    filename,
    uploadedAt: Date.now(),
    name: nameMatch,
    email,
    phone,
    skills: extractSkillsRegex(text),
    yearsTotal: yearsMatch ? parseInt(yearsMatch[1], 10) : undefined,
  };
}
