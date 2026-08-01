import { siteConfig } from "@/config/site";

export interface InstitutionalSection {
  heading: string;
  paragraphs: string[];
  links?: Array<{ label: string; href: string }>;
}

export interface InstitutionalPageContent {
  title: string;
  summary: string;
  sections: InstitutionalSection[];
}

const contactLaunchNote =
  "A public inbox has not yet been approved in the site configuration. This page will publish direct contact details once that address and the responsible legal entity are confirmed.";

export const institutionalPages: Record<string, InstitutionalPageContent> = {
  about: {
    title: "About Metroplist",
    summary:
      "Metroplist connects place identities, measurements, timelines and sources so people can explore how living here differs from living there.",
    sections: [
      {
        heading: "What Metroplist is building",
        paragraphs: [
          "Metroplist is an independent data-intelligence project. It brings public geographical information into one consistent system without erasing source definitions, historical periods or corrections.",
          "The public application is designed for exploration and comparison. This institutional site explains the purpose, governance and standards behind that work.",
        ],
        links: [
          { label: "Explore places", href: siteConfig.applicationUrl },
          { label: "Read about data and trust", href: "/data-and-trust/" },
        ],
      },
    ],
  },
  "data-and-trust": {
    title: "Data & Trust",
    summary:
      "How Metroplist sources, checks, calculates, revises and publishes geographical information.",
    sections: [
      {
        heading: "Reported, estimated, projected and derived",
        paragraphs: [
          "Metroplist keeps evidence status separate from calculation lineage. A value may be reported by a publisher, estimated under a declared method, projected under a scenario, or calculated by Metroplist from cited inputs.",
          "Reference year, unit, methodology and evidence status travel with every comparison. A newer release does not overwrite an older observation.",
        ],
      },
      {
        heading: "Source-specific safeguards",
        paragraphs: [
          "Publishers can apply disclosure control, suppression, rounding, perturbation, modelling or revision rules to particular datasets. Metroplist preserves those notices with the relevant source rather than presenting one generic warning as if it applied everywhere.",
        ],
        links: [
          { label: "Data sources", href: `${siteConfig.applicationUrl}/data-sources` },
          { label: "Methodology", href: `${siteConfig.applicationUrl}/methodology` },
          { label: "Coverage", href: `${siteConfig.applicationUrl}/coverage` },
        ],
      },
      {
        heading: "Challenge and correction",
        paragraphs: [
          "A reported issue is assessed against the referenced observation and source release. Corrections create linked records or notices; historical publications are not silently rewritten.",
        ],
        links: [
          { label: "Data quality", href: "/data-quality/" },
          { label: "Corrections", href: "/corrections/" },
          { label: "Report a data issue", href: `${siteConfig.applicationUrl}/report-data-issue` },
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy",
    summary:
      "A plain-language account of personal information used by Metroplist’s institutional and application services.",
    sections: [
      {
        heading: "Information processed when you visit",
        paragraphs: [
          "Metroplist is delivered through Cloudflare. Network and security logs may therefore process connection information needed to deliver, protect and diagnose the service.",
          "The optional approximate-location feature uses coarse network context supplied by Cloudflare. Metroplist does not return or store the visitor’s raw IP address through that feature, and the suggested place remains unconfirmed until the visitor chooses it.",
        ],
      },
      {
        heading: "Information you choose to provide",
        paragraphs: [
          "Future contact enquiries, accessibility reports and data-issue reports may include a name, email address and message. Those channels must publish their purpose, access boundary and retention criteria before collecting personal information.",
          "A Metroplist Snapshot records public geographical evidence and its creation time. Anonymous Snapshot creation is not intended for personal commentary and does not require recipient email addresses.",
        ],
      },
      {
        heading: "Controller and contact details",
        paragraphs: [contactLaunchNote],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Applicable information rights depend on the purpose and lawful basis for processing. The final notice will identify the responsible controller, relevant rights, complaint route and retention criteria before personal-data collection is enabled.",
        ],
        links: [
          {
            label: "ICO guidance on privacy information",
            href: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/",
          },
        ],
      },
    ],
  },
  cookies: {
    title: "Cookies",
    summary:
      "What browser storage Metroplist currently uses and how future optional technologies will be handled.",
    sections: [
      {
        heading: "Current position",
        paragraphs: [
          "The current Metroplist source does not install analytics, advertising or social-media SDKs. Sharing uses ordinary links and browser capabilities rather than embedded tracking widgets.",
          "Cloudflare or the hosting platform may use strictly necessary technologies for security and delivery. This page must be re-audited before optional analytics, advertising or account features are introduced.",
        ],
      },
      {
        heading: "Optional technologies",
        paragraphs: [
          "Optional cookies or similar technologies will not be loaded before the required choice is obtained. A consent banner will be introduced only when there is a real optional purpose to control, not merely for appearance.",
        ],
        links: [
          {
            label: "ICO guidance on cookies and similar technologies",
            href: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/",
          },
        ],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    summary:
      "Operational terms for using Metroplist information, publications and services.",
    sections: [
      {
        heading: "Informational use",
        paragraphs: [
          "Metroplist helps people explore published geographical information. Records can be revised, superseded or withdrawn as sources and methods change, and availability is not guaranteed.",
          "Visitors must consider dates, definitions, evidence status and methodology before relying on a comparison. Metroplist outputs are not a substitute for professional legal, financial, medical or planning advice.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "Do not use Metroplist to misrepresent evidence, evade source restrictions, probe security controls, publish personal commentary as a Snapshot, or conduct harmful profiling. Automated access must respect published technical and licensing rules.",
        ],
      },
      {
        heading: "Rights and third-party material",
        paragraphs: [
          "Source data remain subject to their publishers’ terms. Metroplist branding, software, written analysis and publication designs are distinct from those source rights. The governing legal entity, jurisdiction and final licence grant require confirmation before these terms are released as final legal terms.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Accessibility",
    summary:
      "Metroplist uses WCAG 2.2 Level AA as its engineering target.",
    sections: [
      {
        heading: "Our target",
        paragraphs: [
          "Core navigation, search, comparison, place records and publication controls are designed for keyboard use, visible focus, semantic structure, responsive text and accessible names.",
          "This is a target rather than a claim of complete legal conformance. Dynamic maps and newly introduced publication previews require continued manual and assistive-technology assessment.",
        ],
        links: [
          {
            label: "Web Content Accessibility Guidelines 2.2",
            href: "https://www.w3.org/TR/WCAG22/",
          },
        ],
      },
      {
        heading: "Known limitations and feedback",
        paragraphs: [
          `The current review date is ${siteConfig.lastPolicyReview}. A verified accessibility inbox has not yet been approved; it must be added before this page is treated as a complete accessibility statement.`,
        ],
      },
    ],
  },
  contact: {
    title: "Contact Metroplist",
    summary:
      "Routes for general, data, correction, licensing, partnership, privacy and accessibility enquiries.",
    sections: [
      {
        heading: "Contact categories",
        paragraphs: [
          "Metroplist will route enquiries as general, data or methodology, correction, licensing and reuse, partnership, privacy, or accessibility matters.",
          contactLaunchNote,
          "No contact form is enabled until an approved inbox, privacy wording and retention process are configured.",
        ],
      },
      {
        heading: "Data issues",
        paragraphs: [
          "Use the application’s contextual reporting route for a specific place, observation, comparison or Snapshot so the relevant evidence references can travel with the report.",
        ],
        links: [
          { label: "Report a data issue", href: `${siteConfig.applicationUrl}/report-data-issue` },
        ],
      },
    ],
  },
  "responsible-data-use": {
    title: "Responsible data use",
    summary:
      "Practical safeguards for interpreting and reusing geographical comparisons.",
    sections: [
      {
        heading: "Keep the frame",
        paragraphs: [
          "Do not hide incompatible years, units, boundaries, methods or evidence status. A country, city, authority and built-up area can sometimes be compared, but their definitions must remain visible.",
          "Do not present projections as observed facts or rankings as explanations of cause. Larger does not automatically mean better.",
        ],
      },
      {
        heading: "People and small areas",
        paragraphs: [
          "Published small-area statistics can include disclosure-control measures or uncertainty. Do not use them to identify individuals, discriminate, stigmatise communities or construct harmful profiles.",
        ],
      },
    ],
  },
  licensing: {
    title: "Licensing and reuse",
    summary:
      "Source data, Metroplist calculations and Metroplist publication assets carry different rights.",
    sections: [
      {
        heading: "Source data",
        paragraphs: [
          "Third-party datasets remain governed by their publisher’s licence and attribution requirements. A Metroplist page does not replace those terms.",
        ],
      },
      {
        heading: "Metroplist work",
        paragraphs: [
          "Metroplist-derived calculations, software, branding, written interpretation and visual Snapshot designs are separate works. A final public licence for those works has not yet been approved and is a launch requirement.",
          "Visitors may use permanent Snapshot links and the sharing controls provided by the service. Downloaded data and cards remain subject to the source and Metroplist rights shown with the Snapshot.",
        ],
      },
    ],
  },
  "data-quality": {
    title: "Data quality and revisions",
    summary:
      "How Metroplist qualifies observations, preserves history and discloses limitations.",
    sections: [
      {
        heading: "Evidence qualification",
        paragraphs: [
          "Metroplist records publisher, release, geography, unit, period, quality and evidence status. Derived observations retain calculation inputs and lineage.",
          "Reported, estimated and projected describe the evidence frame. Derivation is recorded separately through calculations.",
        ],
      },
      {
        heading: "Revisions",
        paragraphs: [
          "A later period remains independent from an earlier period. Corrections and restatements create linked records rather than rewriting observation history.",
        ],
      },
    ],
  },
  corrections: {
    title: "Corrections",
    summary:
      "How to challenge a Metroplist record and how accepted corrections are published.",
    sections: [
      {
        heading: "Report the exact result",
        paragraphs: [
          "Use Report a data issue from the relevant place, comparison or Snapshot. The route carries the page and canonical evidence context so the record can be investigated precisely.",
        ],
        links: [
          { label: "Report a data issue", href: `${siteConfig.applicationUrl}/report-data-issue` },
        ],
      },
      {
        heading: "Correction outcome",
        paragraphs: [
          "Accepted corrections preserve the original record and add a linked corrected observation, superseding Snapshot or withdrawal notice. Metroplist does not silently alter an historical publication.",
        ],
      },
    ],
  },
};
