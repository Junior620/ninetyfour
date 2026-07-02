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
  { type: "link", href: "/", key: "home" },
  {
    type: "group",
    key: "academyGroup",
    children: [
      { href: "/academie", key: "academy" },
      { href: "/vision", key: "vision" },
      { href: "/formation-sportive", key: "training" },
    ],
  },
  {
    type: "group",
    key: "programGroup",
    children: [
      { href: "/programme", key: "program" },
      { href: "/education", key: "education" },
      { href: "/performance-lab", key: "performanceLab" },
    ],
  },
  {
    type: "group",
    key: "mediaGroup",
    children: [
      { href: "/actualites", key: "news" },
      { href: "/galerie", key: "gallery" },
      { href: "/partenaires", key: "partners" },
    ],
  },
  { type: "link", href: "/contact", key: "contact" },
];

export const mobileNavLinks = [
  { href: "/", key: "home" },
  { href: "/academie", key: "academy" },
  { href: "/vision", key: "vision" },
  { href: "/programme", key: "program" },
  { href: "/formation-sportive", key: "training" },
  { href: "/performance-lab", key: "performanceLab" },
  { href: "/education", key: "education" },
  { href: "/partenaires", key: "partners" },
  { href: "/actualites", key: "news" },
  { href: "/galerie", key: "gallery" },
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
