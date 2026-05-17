// Subdomain configuration for role-based dashboard routing

export interface SubdomainConfig {
  subdomain: string;       // e.g., "control"
  role: string;            // required role
  label: string;           // display name
  description: string;     // what this panel is for
  accentColor: string;     // CSS color for branding
  minRoleLevel: number;    // minimum role level required
}

export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  EDITOR: 4,
  AUTHOR: 3,
  MODERATOR: 2,
  READER: 1,
};

export const SUBDOMAINS: SubdomainConfig[] = [
  {
    subdomain: "control",
    role: "SUPER_ADMIN",
    label: "Control Center",
    description: "Full system control — users, settings, everything",
    accentColor: "#e11d48", // rose-600
    minRoleLevel: 6,
  },
  {
    subdomain: "admin",
    role: "ADMIN",
    label: "Admin Panel",
    description: "Content management, users, and configuration",
    accentColor: "#d97706", // amber-600
    minRoleLevel: 5,
  },
  {
    subdomain: "editor",
    role: "EDITOR",
    label: "Editor Desk",
    description: "Review & publish content, manage editorial workflow",
    accentColor: "#059669", // emerald-600
    minRoleLevel: 4,
  },
  {
    subdomain: "author",
    role: "AUTHOR",
    label: "Author Studio",
    description: "Write, edit, and submit your stories",
    accentColor: "#0284c7", // sky-600
    minRoleLevel: 3,
  },
];

// The base domain (no subdomain) — public blog + reader dashboard
export const BASE_DOMAIN_CONFIG = {
  subdomain: "",
  role: "READER",
  label: "Reader Dashboard",
  description: "Your bookmarks, comments, and preferences",
  accentColor: "#6b7280", // gray-500
  minRoleLevel: 1,
};

const ROOT_DOMAIN = "sanaathrumylens.co.ke";

/**
 * Detect which subdomain the request is coming from.
 * Returns the SubdomainConfig or null if it's the base domain.
 */
export function detectSubdomain(hostname: string): SubdomainConfig | null {
  // localhost/dev handling
  if (hostname === "localhost" || hostname.startsWith("127.0.0.1") || hostname === "0.0.0.0") {
    return null; // dev mode, no subdomain enforcement
  }

  // Check if this is a subdomain of our root domain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomainPart = hostname.replace(`.${ROOT_DOMAIN}`, "");
    if (!subdomainPart || subdomainPart === "www") {
      return null; // www or bare domain = public
    }
    const found = SUBDOMAINS.find(s => s.subdomain === subdomainPart);
    return found || null;
  }

  // Custom domain / Vercel preview — no subdomain enforcement
  return null;
}

/**
 * Get the subdomain config for a given role.
 * Returns the most specific subdomain for that role.
 */
export function getSubdomainForRole(role: string): SubdomainConfig | null {
  const level = ROLE_HIERARCHY[role] ?? 0;
  if (level <= 1) return null; // READER has no subdomain
  // Find the subdomain that exactly matches this role
  return SUBDOMAINS.find(s => s.role === role) || null;
}

/**
 * Get the full URL for a subdomain dashboard
 */
export function getSubdomainUrl(subdomain: string, basePath: string = "/dashboard"): string {
  return `https://${subdomain}.${ROOT_DOMAIN}${basePath}`;
}

/**
 * Check if a user with the given role can access a subdomain
 */
export function canAccessSubdomain(userRole: string, subdomain: SubdomainConfig): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  return userLevel >= subdomain.minRoleLevel;
}

/**
 * Get the root domain string
 */
export function getRootDomain(): string {
  return ROOT_DOMAIN;
}

/**
 * Client-side hook helper: detect subdomain from window.location.hostname
 * Returns the SubdomainConfig or null if on base domain / localhost
 */
export function detectSubdomainClient(hostname: string): SubdomainConfig | null {
  return detectSubdomain(hostname);
}
