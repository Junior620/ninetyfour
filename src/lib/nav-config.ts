export type NavLink = {
  type: "link";
  href: string;
  key: string;
};

export type NavGroup = {
  type: "group";
  key: string;
  children: { href: string; key: string }[];
};

export type NavItem = NavLink | NavGroup;

export const desktopNavItems: NavItem[] = [
  { type: "link", href: "/actualites", key: "news" },
  {
    type: "group",
    key: "clubGroup",
    children: [
      { href: "/academie", key: "academy" },
      { href: "/vision", key: "vision" },
    ],
  },
  {
    type: "group",
    key: "programGroup",
    children: [
      { href: "/programme", key: "program" },
      { href: "/formation-sportive", key: "training" },
      { href: "/education", key: "education" },
      { href: "/performance-lab", key: "performanceLab" },
    ],
  },
  {
    type: "group",
    key: "teamsGroup",
    children: [
      { href: "/encadrement", key: "coaching" },
      { href: "/equipes", key: "teams" },
    ],
  },
  { type: "link", href: "/galerie", key: "media" },
  {
    type: "group",
    key: "partnersGroup",
    children: [
      { href: "/partenaires", key: "partners" },
      { href: "/parrains", key: "ambassadors" },
    ],
  },
  { type: "link", href: "/contact", key: "contact" },
];

export const mobileNavLinks = [
  { href: "/actualites", key: "news" },
  { href: "/academie", key: "academy" },
  { href: "/vision", key: "vision" },
  { href: "/programme", key: "program" },
  { href: "/formation-sportive", key: "training" },
  { href: "/education", key: "education" },
  { href: "/performance-lab", key: "performanceLab" },
  { href: "/encadrement", key: "coaching" },
  { href: "/equipes", key: "teams" },
  { href: "/galerie", key: "media" },
  { href: "/partenaires", key: "partners" },
  { href: "/parrains", key: "ambassadors" },
  { href: "/contact", key: "contact" },
] as const;

export function isNavGroupActive(
  pathname: string,
  children: { href: string }[]
): boolean {
  return children.some(
    (child) =>
      pathname === child.href ||
      (child.href !== "/" && pathname.startsWith(child.href))
  );
}
