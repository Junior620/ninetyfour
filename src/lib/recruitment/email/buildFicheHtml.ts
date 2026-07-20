import type { RecruitmentFormData } from "@/lib/validations/schemas";

const POSITION_LABELS: Record<string, string> = {
  GARDIEN: "Gardien",
  DEFENSEUR_CENTRAL: "Défenseur central",
  LATERAL_DROIT: "Latéral droit",
  LATERAL_GAUCHE: "Latéral gauche",
  MILIEU_CENTRAL: "Milieu défensif",
  MILIEU_RELAYEUR: "Milieu relayeur",
  MILIEU_OFFENSIF: "Milieu offensif",
  AILE_DROIT: "Ailier droit",
  AILE_GAUCHE: "Ailier gauche",
  ATTAQUANT: "Attaquant",
};

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pick(label: string, on: boolean) {
  const bg = on ? "#1f3fa8" : "#ffffff";
  const col = on ? "#ffffff" : "#16205a";
  return `<td align="center" bgcolor="${bg}" style="border:1px solid #bfbfbf;padding:7px 3px;font-weight:bold;font-size:10px;color:${col};background:${bg}">${label}</td>`;
}

function row(label: string, value?: string) {
  return `<tr><td width="42%" bgcolor="#f4f6fb" style="border:1px solid #bfbfbf;background:#f4f6fb;color:#16205a;font-weight:bold;font-size:10px;padding:6px 8px">${label}</td><td style="border:1px solid #bfbfbf;font-size:12px;padding:6px 8px">${value?.trim() ? esc(value) : "&nbsp;"}</td></tr>`;
}

function bar(t: string) {
  return `<table width="100%" cellspacing="0" cellpadding="0"><tr><td bgcolor="#111111" style="background:#111;color:#fff;font-weight:bold;font-size:12px;padding:6px 10px">${t}</td></tr></table>`;
}

function spacer(h: number) {
  return `<div style="height:${h}px;line-height:${h}px;font-size:1px">&nbsp;</div>`;
}

function docRow(label: string, yes: boolean) {
  return `<tr><td style="border:1px solid #bfbfbf;color:#16205a;font-weight:bold;font-size:10px;padding:6px 8px">${label}</td>${pick("OUI", yes)}${pick("NON", !yes)}</tr>`;
}

export type BuildFicheHtmlOptions = {
  data: RecruitmentFormData;
  /** Use cid:photo when attaching inline image via Resend */
  photoCid?: string | null;
  photoUrl?: string | null;
};

export function buildFicheHtml({ data, photoCid, photoUrl }: BuildFicheHtmlOptions) {
  const dob = [data.dobDay, data.dobMonth, data.dobYear].filter(Boolean).join(" / ");
  const poste = POSITION_LABELS[data.primaryPosition] || data.primaryPosition;
  const foot =
    data.strongFoot === "right"
      ? "Droit"
      : data.strongFoot === "left"
        ? "Gauche"
        : "Les deux";
  const dateStr = new Date().toLocaleDateString("fr-FR");

  const photoSrc = photoCid ? `cid:${photoCid}` : photoUrl || "";
  const photoHtml = photoSrc
    ? `<img src="${photoSrc}" width="108" alt="Photo" style="display:block;width:108px;height:120px;object-fit:cover" />`
    : `<div style="padding:26px 4px;color:#7a8091;font-size:10px;font-weight:bold;line-height:1.4">PHOTO<br>D'IDENTITÉ<br>(RÉCENTE)</div>`;

  const logoHtml = `<div style="width:80px;height:80px;background:#1f3fa8;border:3px solid #c2a14e;color:#fff;text-align:center;font-weight:900;font-size:24px;line-height:80px;margin:0 auto">91</div>`;

  const header = `<table width="100%" cellspacing="0" cellpadding="0"><tr valign="middle">
    <td width="100" align="center">${logoHtml}</td>
    <td align="center">
      <div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#111">NINETY ONE</div>
      <div style="font-size:12px;font-weight:bold;letter-spacing:5px;color:#111">FOOT ACADEMY</div>
      <div style="border-top:2px solid #c2a14e;width:55%;margin:5px auto"></div>
      <div style="font-size:16px;font-weight:bold;color:#1f3fa8;letter-spacing:1px">FICHE D'ENREGISTREMENT</div>
      <div style="font-size:10px;font-weight:bold;color:#333">DÉTECTION DES JEUNES TALENTS 2026</div>
    </td>
    <td width="120" align="center"><div style="border:2px solid #1f3fa8;width:112px;height:120px;text-align:center;overflow:hidden">${photoHtml}</div></td>
  </tr></table>`;

  const catZone = `<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="22%" style="padding-right:6px"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td bgcolor="#1f3fa8" align="center" style="background:#1f3fa8;color:#fff;font-weight:bold;font-size:10px;padding:5px">N° JOUEUR</td></tr>
      <tr><td style="border:1px solid #bfbfbf;font-size:12px;padding:8px;text-align:center">${esc(data.playerNumber)}</td></tr>
    </table></td>
    <td width="28%" style="padding-right:6px"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td colspan="3" bgcolor="#1f3fa8" align="center" style="background:#1f3fa8;color:#fff;font-weight:bold;font-size:10px;padding:5px">CATÉGORIE</td></tr>
      <tr>${pick("U-14", data.category === "U-14")}${pick("U-16", data.category === "U-16")}${pick("U-18", data.category === "U-18")}</tr>
    </table></td>
    <td><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td colspan="4" bgcolor="#1f3fa8" align="center" style="background:#1f3fa8;color:#fff;font-weight:bold;font-size:10px;padding:5px">ZONE DE DÉTECTION</td></tr>
      <tr>${pick("ZONE A", data.zone === "A")}${pick("ZONE B", data.zone === "B")}${pick("ZONE C", data.zone === "C")}${pick("FINALE", data.zone === "FINAL")}</tr>
    </table></td>
  </tr></table>`;

  const s1 = `${bar("1. INFORMATIONS DU JOUEUR")}<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      ${row("NOM", data.lastName.toUpperCase())}${row("PRÉNOM(S)", data.firstNames.toUpperCase())}${row("DATE DE NAISSANCE", dob)}${row("ÂGE", data.age)}${row("NATIONALITÉ", data.nationality)}
    </table></td><td width="2%"></td>
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      ${row("LIEU DE NAISSANCE", data.birthPlace)}${row("VILLE DE RÉSIDENCE", data.city)}${row("QUARTIER", data.neighborhood)}${row("TAILLE (cm)", data.heightCm)}${row("POIDS (kg)", data.weightKg)}
    </table></td>
  </tr></table>`;

  const s2 = `${bar("2. CONTACTS")}<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      ${row("NOM DU PÈRE / TUTEUR", data.fatherTutorName)}${row("TÉLÉPHONE", data.fatherTutorPhone)}${row("NOM DE LA MÈRE", data.motherName)}${row("TÉLÉPHONE", data.motherPhone || data.playerPhone)}${row("E-MAIL", data.email)}
    </table></td><td width="2%"></td>
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td bgcolor="#f4f6fb" style="border:1px solid #bfbfbf;background:#f4f6fb;color:#16205a;font-weight:bold;font-size:10px;padding:6px 8px">ADRESSE COMPLÈTE</td></tr>
      <tr><td style="border:1px solid #bfbfbf;font-size:12px;padding:6px 8px;height:96px;vertical-align:top">${data.address ? esc(data.address) : "&nbsp;"}</td></tr>
    </table></td>
  </tr></table>`;

  const s3 = `${bar("3. PARCOURS FOOTBALLISTIQUE")}<table width="100%" cellspacing="0" cellpadding="0">
    ${row("CLUB ACTUEL", data.currentClub)}${row("ANCIEN(S) CLUB(S)", data.previousClubs)}${row("ÉTABLISSEMENT SCOLAIRE FRÉQUENTÉ", data.school)}
  </table>`;

  const positions = [
    ["Gardien", "Défenseur central", "Latéral droit", "Latéral gauche", "Milieu défensif"],
    ["Milieu relayeur", "Milieu offensif", "Ailier droit", "Ailier gauche", "Attaquant"],
  ];
  const pRows = positions
    .map(
      (arr) =>
        `<tr>${arr.map((p) => pick(p, poste === p)).join("")}</tr>`
    )
    .join("");

  const s4 = `${bar("4. PROFIL SPORTIF")}<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="60%" style="padding-right:6px"><div style="border:1px solid #bfbfbf;padding:6px">
      <div style="color:#16205a;font-weight:bold;font-size:10px;margin-bottom:4px">POSTE PRINCIPAL</div>
      <table width="100%" cellspacing="0" cellpadding="0">${pRows}</table>
    </div></td>
    <td width="40%"><table width="100%" cellspacing="0" cellpadding="0">${row("DEUXIÈME POSTE", data.secondaryPosition)}</table>
      <div style="border:1px solid #bfbfbf;padding:6px;margin-top:6px">
        <div style="color:#16205a;font-weight:bold;font-size:10px;margin-bottom:4px">PIED FORT</div>
        <table width="100%" cellspacing="0" cellpadding="0"><tr>${pick("DROIT", foot === "Droit")}${pick("GAUCHE", foot === "Gauche")}${pick("LES DEUX", foot === "Les deux")}</tr></table>
      </div>
    </td>
  </tr></table>`;

  const s56 = `<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="49%" style="padding-right:6px"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td colspan="3" bgcolor="#111111" style="background:#111;color:#fff;font-weight:bold;font-size:11px;padding:5px 8px">5. ÉTAT DE SANTÉ</td></tr>
      <tr><td style="border:1px solid #bfbfbf;color:#16205a;font-weight:bold;font-size:10px;padding:6px 8px">BLESSURE ACTUELLE</td>${pick("OUI", data.injuryCurrent)}${pick("NON", !data.injuryCurrent)}</tr>
      <tr><td colspan="3" style="border:1px solid #bfbfbf;font-size:11px;padding:6px 8px"><b style="color:#16205a">Si oui, laquelle :</b> ${esc(data.injuryCurrent ? data.injuryDetails || "—" : "—")}</td></tr>
      <tr><td colspan="3" style="border:1px solid #bfbfbf;font-size:11px;padding:6px 8px;height:60px;vertical-align:top"><b style="color:#16205a">Allergies connues :</b> ${esc(data.allergies || "—")}</td></tr>
    </table></td>
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td colspan="3" bgcolor="#111111" style="background:#111;color:#fff;font-weight:bold;font-size:11px;padding:5px 8px">6. DOCUMENTS FOURNIS</td></tr>
      ${docRow("Copie de l'acte de naissance", data.birthCertificateProvided)}
      ${docRow("Autorisation parentale", data.parentalAuthProvided)}
      ${docRow("Certificat médical", data.medicalCertificateProvided)}
      ${docRow("Frais d'inscription réglés", data.feesPaidProvided)}
      <tr><td colspan="3" style="border:1px solid #bfbfbf;font-size:11px;padding:6px 8px"><b style="color:#16205a">Montant payé (XAF) :</b> ${esc(data.amountPaidXaf || "—")} &nbsp;|&nbsp; <b style="color:#16205a">Mode :</b> ${esc(data.paymentMethod)}</td></tr>
    </table></td>
  </tr></table>`;

  const s7 = `${bar("7. RÉSERVÉ À L'ADMINISTRATION")}<table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">${row("NUMÉRO DE DOSSARD", "")}${row("NUMÉRO DE GROUPE", "")}${row("HEURE D'ARRIVÉE", "")}</table></td><td width="2%"></td>
    <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">
      <tr><td bgcolor="#f4f6fb" style="border:1px solid #bfbfbf;background:#f4f6fb;color:#16205a;font-weight:bold;font-size:10px;padding:6px 8px">OBSERVATIONS</td></tr>
      <tr><td style="border:1px solid #bfbfbf;height:70px"></td></tr>
    </table></td>
  </tr></table>`;

  const s8 = `${bar("8. DÉCLARATION DU PARENT / TUTEUR")}
    <div style="font-style:italic;font-size:11px;color:#333;padding:6px 2px">Je certifie que les informations fournies sont exactes et j'autorise mon enfant à participer à la journée de détection organisée par Ninety One Foot Academy.</div>
    <table width="100%" cellspacing="0" cellpadding="0"><tr valign="top">
      <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">${row("NOM DU PARENT / TUTEUR", data.parentDeclarationName.toUpperCase())}</table></td><td width="2%"></td>
      <td width="49%"><table width="100%" cellspacing="0" cellpadding="0">${row("DATE", dateStr)}</table></td>
    </tr></table>`;

  const footer = `<table width="100%" cellspacing="0" cellpadding="0"><tr><td bgcolor="#111111" style="background:#111;color:#fff;font-size:10px;padding:8px 10px;text-align:center">Immeuble Air France, Bonanjo — Douala / Cameroun &nbsp;•&nbsp; ninetyonefoot@outlook.com &nbsp;•&nbsp; ninetyonefoot.com &nbsp;•&nbsp; @ninety.one.foot</td></tr></table>`;

  return `<div style="background:#e9edf5;padding:14px">
    <table width="770" align="center" cellspacing="0" cellpadding="0" style="background:#fff;border:6px solid #c2a14e">
      <tr><td style="padding:14px">
        ${header}${spacer(10)}${catZone}${spacer(10)}
        ${s1}${spacer(8)}${s2}${spacer(8)}${s3}${spacer(8)}${s4}${spacer(8)}
        ${s56}${spacer(8)}${s7}${spacer(8)}${s8}${spacer(10)}${footer}
      </td></tr>
    </table>
  </div>`;
}
