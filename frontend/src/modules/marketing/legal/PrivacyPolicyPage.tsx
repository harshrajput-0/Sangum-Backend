import LegalArticleLayout from "@/layouts/LegalArticleLayout";
import { usePageTitle } from "@/shared/hooks/usePageTitle";


interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

const sections: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: [
      "Your privacy is important to us. This Privacy Policy explains how Sangum collects, uses, stores, and protects information when you use our website, applications, and related services. By creating an account or accessing the platform, you agree to the practices described in this policy.",
      "This policy applies to all users of Sangum, including community members, moderators, administrators, and visitors who browse publicly available content. It covers information collected through account registration, community participation, content creation, messaging, and other interactions with the platform.",
    ],
  },

  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      "We collect information you provide directly when creating an account or updating your profile. This may include your name, username, email address, profile photo, biography, and other optional profile details.",
      "When you use Sangum, we also collect the content you create and interact with, including posts, comments, reactions, bookmarks, uploaded media, community memberships, reports, messages, and other activity performed within the platform.",
      "Certain technical information is collected automatically to help maintain the security and reliability of our services. This may include your IP address, browser type, device information, operating system, approximate location derived from your IP, log data, and usage statistics.",
    ],
  },

  {
    id: "how-we-use-information",
    title: "How We Use Information",
    content: [
      "We use your information to provide, maintain, and improve Sangum. This includes creating and managing your account, authenticating users, delivering platform features, and enabling participation in communities.",
      "Your information helps personalize your experience by recommending relevant communities, resources, and content based on your activity and preferences. We may also use aggregated usage data to improve performance, usability, and future platform features.",
      "We may use your contact information to send important service-related communications such as security alerts, account verification, password reset instructions, policy updates, and notifications related to your account.",
    ],
  },

  {
    id: "information-sharing",
    title: "Information Sharing",
    content: [
      "We do not sell or rent your personal information to advertisers or third parties.",
      "Information may be shared with trusted service providers who assist in operating Sangum, such as hosting providers, cloud storage services, email delivery services, analytics providers, and security infrastructure. These providers are permitted to access information only as necessary to perform services on our behalf.",
      "We may also disclose information when required by law, to comply with legal obligations, protect the rights or safety of Sangum and its users, investigate fraud or abuse, or enforce our Terms of Service.",
    ],
  },

  {
    id: "data-security",
    title: "Data Security",
    content: [
      "We implement reasonable administrative, technical, and organizational safeguards to protect personal information from unauthorized access, alteration, disclosure, or destruction.",
      "Security measures may include encrypted communications using HTTPS, secure authentication mechanisms, access controls, server monitoring, and regular security updates. While we strive to protect your information, no method of electronic storage or internet transmission can be guaranteed to be completely secure.",
    ],
  },

  {
    id: "your-rights",
    title: "Your Rights",
    content: [
      "You can review and update most of your account information directly through your profile settings. You may also choose to remove content you have created, subject to applicable platform policies.",
      "If you wish to permanently delete your account or request assistance regarding your personal information, you may contact us using the information provided below. Some information may be retained where required by law, for security purposes, or to resolve disputes.",
    ],
  },

  {
    id: "cookies-and-tracking",
    title: "Cookies & Tracking",
    content: [
      "Sangum uses cookies and similar technologies to keep you signed in, remember your preferences, improve website functionality, and understand how users interact with the platform.",
      "Cookies may also be used for authentication, security, analytics, and performance monitoring. You can manage or disable cookies through your browser settings, although some features of Sangum may not function properly without them.",
      "For more information about how cookies are used, please refer to our Cookie Policy.",
    ],
  },

  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    content: [
      "Sangum is not intended for children under the age of 13. We do not knowingly collect personal information from children in this age group.",
      "If we become aware that personal information has been collected from a child under 13 without appropriate consent, we will take reasonable steps to remove the information from our systems as soon as practicable.",
    ],
  },

  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, or operational practices.",
      "When significant changes are made, we will notify users through appropriate channels such as in-app notifications, email, or notices posted on the platform. Continued use of Sangum after the revised policy becomes effective constitutes acceptance of the updated policy.",
    ],
  },

  {
    id: "contact-us",
    title: "Contact Us",
    content: [
      "If you have questions, concerns, or requests regarding this Privacy Policy or the way your personal information is handled, please contact our privacy team.",
      "You can reach us at privacy@sangum.dev. We will make reasonable efforts to respond to your inquiry as promptly as possible.",
    ],
  },
];

export default function PrivacyPage() {
  usePageTitle("Privacy Policy — Sangum");

  return (
    <LegalArticleLayout
      title="Privacy Policy"
      lastUpdated="May 10, 2024"
      sections={sections}
    />
  );
}