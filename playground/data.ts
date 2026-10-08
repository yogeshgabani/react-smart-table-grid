/** Deterministic mock data — same output every run, so demos are stable. */

let seed = 42;
function random(): number {
  // Mulberry32: tiny, fast, and repeatable without a dependency.
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function resetSeed(value = 42): void {
  seed = value;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(random() * list.length)];
}

function int(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

const FIRST = ['Ada', 'Grace', 'Alan', 'Linus', 'Barbara', 'Ken', 'Margaret', 'Dennis', 'Radia', 'Guido', 'Anita', 'Tim', 'Katherine', 'James', 'Shafi', 'Vint', 'Hedy', 'Donald'];
const LAST = ['Lovelace', 'Hopper', 'Turing', 'Torvalds', 'Liskov', 'Thompson', 'Hamilton', 'Ritchie', 'Perlman', 'van Rossum', 'Borg', 'Berners-Lee', 'Johnson', 'Gosling', 'Goldwasser', 'Cerf', 'Lamarr', 'Knuth'];
const DEPARTMENTS = ['Engineering', 'Design', 'Sales', 'Marketing', 'Support', 'Finance', 'Operations', 'People'];
const ROLES = ['Engineer', 'Senior Engineer', 'Lead', 'Manager', 'Director', 'Analyst', 'Specialist', 'Coordinator'];
const STATUSES = ['active', 'pending', 'inactive', 'archived'];
const COUNTRIES = ['United States', 'India', 'Germany', 'Japan', 'Brazil', 'Canada', 'France', 'Australia', 'Kenya', 'Spain'];
const TAGS = ['remote', 'contract', 'full-time', 'part-time', 'senior', 'onsite', 'hybrid', 'new'];
const COMPANIES = ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Hooli', 'Vandelay', 'Soylent'];

/**
 * Avatars are drawn locally as SVG data URIs — the playground makes no
 * third-party requests, and works offline. Cached per name, so a million
 * benchmark rows share a few hundred strings.
 */
const avatarCache = new Map<string, string>();

function avatarFor(name: string): string {
  const cached = avatarCache.get(name);
  if (cached) return cached;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 72% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 70% 48%)"/>` +
    `</linearGradient></defs><rect width="64" height="64" fill="url(#g)"/>` +
    `<text x="32" y="41" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="24" font-weight="600" fill="#fff">${initials}</text></svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  avatarCache.set(name, uri);
  return uri;
}

export interface User extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  status: string;
  salary: number;
  performance: number;
  rating: number;
  verified: boolean;
  joinedAt: string;
  lastActive: string;
  country: string;
  tags: string[];
  profile: { phone: string; city: string; manager: string };
  revenue: number;
  growth: number;
}

export function makeUsers(count: number, startAt = 0): User[] {
  const rows: User[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const index = startAt + i;
    const name = `${first} ${last}`;
    rows.push({
      id: `u-${index + 1}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}${index}@example.com`,
      avatar: avatarFor(name),
      role: pick(ROLES),
      department: pick(DEPARTMENTS),
      status: pick(STATUSES),
      salary: int(48, 220) * 1000,
      performance: int(20, 100),
      rating: int(1, 5),
      verified: random() > 0.35,
      joinedAt: new Date(2019 + int(0, 5), int(0, 11), int(1, 28)).toISOString(),
      lastActive: new Date(Date.now() - int(0, 60) * 86_400_000).toISOString(),
      country: pick(COUNTRIES),
      tags: Array.from({ length: int(1, 3) }, () => pick(TAGS)).filter(
        (tag, tagIndex, list) => list.indexOf(tag) === tagIndex,
      ),
      profile: {
        phone: `+1 555 0${int(100, 999)}`,
        city: pick(['Austin', 'Berlin', 'Tokyo', 'Bengaluru', 'Toronto', 'Paris', 'Nairobi']),
        manager: `${pick(FIRST)} ${pick(LAST)}`,
      },
      revenue: int(5, 900) * 1000,
      growth: (int(-40, 90) / 100) * 1,
    });
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 * Domain-specific datasets
 * ------------------------------------------------------------------ */

export interface Order extends Record<string, unknown> {
  id: string;
  orderNo: string;
  customer: string;
  company: string;
  items: number;
  total: number;
  paid: number;
  status: string;
  placedAt: string;
  channel: string;
  progress: number;
}

export function makeOrders(count: number): Order[] {
  const rows: Order[] = [];
  for (let i = 0; i < count; i += 1) {
    const total = int(40, 9000);
    rows.push({
      id: `o-${i + 1}`,
      orderNo: `#SO-${10_000 + i}`,
      customer: `${pick(FIRST)} ${pick(LAST)}`,
      company: pick(COMPANIES),
      items: int(1, 24),
      total,
      paid: random() > 0.3 ? total : Math.round(total * (int(10, 90) / 100)),
      status: pick(['completed', 'pending', 'processing', 'cancelled', 'overdue']),
      placedAt: new Date(Date.now() - int(0, 180) * 86_400_000).toISOString(),
      channel: pick(['Web', 'Mobile', 'Partner', 'Retail']),
      progress: int(0, 100),
    });
  }
  return rows;
}

export interface TreeNodeRow extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  headcount: number;
  budget: number;
  children?: TreeNodeRow[];
}

export function makeOrgTree(): TreeNodeRow[] {
  let counter = 0;
  const person = (department: string): TreeNodeRow => {
    counter += 1;
    return {
      id: `p-${counter}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      type: 'Employee',
      headcount: 1,
      budget: int(60, 200) * 1000,
      children: undefined,
    };
  };

  return COMPANIES.slice(0, 3).map((company, companyIndex) => {
    const departments: TreeNodeRow[] = DEPARTMENTS.slice(0, 4).map((department, departmentIndex) => {
      const people = Array.from({ length: int(2, 5) }, () => person(department));
      return {
        id: `d-${companyIndex}-${departmentIndex}`,
        name: department,
        type: 'Department',
        headcount: people.length,
        budget: people.reduce((sum, entry) => sum + entry.budget, 0),
        children: people,
      };
    });
    // Roll totals up so every level of the tree reads correctly.
    return {
      id: `c-${companyIndex}`,
      name: company,
      type: 'Company',
      headcount: departments.reduce((sum, entry) => sum + entry.headcount, 0),
      budget: departments.reduce((sum, entry) => sum + entry.budget, 0),
      children: departments,
    };
  });
}

/** Big datasets for the benchmark page — generated lazily and cached. */
const benchmarkCache = new Map<number, User[]>();

export function getBenchmarkRows(count: number): User[] {
  const cached = benchmarkCache.get(count);
  if (cached) return cached;
  resetSeed(7);
  const rows = makeUsers(count);
  benchmarkCache.set(count, rows);
  return rows;
}
