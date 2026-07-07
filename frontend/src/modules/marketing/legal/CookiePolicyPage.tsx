import LegalArticleLayout from "@/layouts/LegalArticleLayout";
import { usePageTitle } from "@/shared/hooks/usePageTitle";


interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies?",
    content: [
      "Cookies are small text files that are stored on your device when you visit a website. They allow websites to recognize your browser, remember your preferences, and provide a more personalized browsing experience without requiring you to re-enter information each time you visit.",
      "In addition to cookies, Sangum may use similar technologies such as local storage and session storage to maintain certain application settings and improve performance. Throughout this policy, these technologies are collectively referred to as 'cookies' unless otherwise specified.",
      "Cookies do not typically contain information that directly identifies you. However, they may be associated with your account or device to support authentication, personalization, security, and analytics.",
    ],
  },

  {
    id: "types-of-cookies-we-use",
    title: "Types of Cookies We Use",
    content: [
      "We use several categories of cookies to ensure Sangum functions efficiently and provides a reliable user experience.",
      "Essential cookies are required for core platform functionality such as user authentication, maintaining secure sessions, protecting against unauthorized access, and enabling features that cannot operate without them.",
      "Functional cookies remember your preferences, including your selected theme, language, layout options, and other personalization settings so your experience remains consistent across visits.",
      "Performance and analytics cookies help us understand how visitors use Sangum by collecting anonymous or aggregated usage information. These insights allow us to identify performance issues, improve navigation, and optimize platform features over time.",
      "If additional features such as integrations or embedded third-party content are introduced, corresponding cookies may also be used to support those services where appropriate.",
    ],
  },

  {
    id: "how-we-use-cookies",
    title: "How We Use Cookies",
    content: [
      "Cookies help us provide a secure and seamless experience throughout Sangum. They allow us to keep you signed in, maintain active sessions, remember your preferences, and deliver essential platform functionality.",
      "We also use cookies to personalize your experience by remembering interface settings such as your preferred theme, display options, and other user-specific configurations.",
      "Analytics cookies provide insights into how users interact with the platform, including commonly visited pages, feature usage, navigation patterns, and performance metrics. This information helps us improve usability, reliability, and future development while reducing technical issues.",
      "Security-related cookies may be used to detect suspicious activity, protect user accounts, prevent abuse, and support the overall integrity of the platform.",
    ],
  },

  {
    id: "managing-cookies",
    title: "Managing Cookies",
    content: [
      "Most web browsers allow you to manage, block, or delete cookies through their settings. You may choose to remove existing cookies or prevent new cookies from being stored on your device.",
      "Please note that disabling essential cookies may affect the availability and functionality of certain features. For example, you may be unable to sign in, maintain your session, remember preferences, or access parts of the platform that require authentication.",
      "Browser settings differ between vendors, so please refer to your browser's documentation for detailed instructions on managing cookie preferences.",
    ],
  },

  {
    id: "third-party-cookies",
    title: "Third-Party Cookies",
    content: [
      "Sangum may use trusted third-party services that place cookies on our behalf to support analytics, performance monitoring, security, or other platform-related functionality.",
      "These third-party providers operate under their own privacy policies and cookie practices. We encourage you to review their policies to better understand how they collect, use, and protect your information.",
      "We do not control the cookies set directly by third-party services once you interact with their content or services through Sangum.",
    ],
  },

  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    content: [
      "We may update this Cookie Policy from time to time to reflect changes in technology, applicable laws, or the way Sangum uses cookies and similar technologies.",
      "When significant updates are made, we may notify users through appropriate channels such as an in-app notice, website announcement, or email where appropriate. The revised policy becomes effective once it is published on this page unless otherwise stated.",
      "Your continued use of Sangum after the updated Cookie Policy takes effect constitutes your acceptance of the revised terms.",
    ],
  },

  {
    id: "contact-us",
    title: "Contact Us",
    content: [
      "If you have any questions, concerns, or requests regarding this Cookie Policy or our use of cookies and similar technologies, please contact us.",
      "You can reach our privacy team at privacy@sangum.dev, and we will make reasonable efforts to respond to your inquiry as promptly as possible.",
    ],
  },
];

export default function CookiePolicyPage() {
  usePageTitle("Cookie Policy — Sangum");

  return (
    <LegalArticleLayout
      title="Cookie Policy"
      lastUpdated="May 10, 2024"
      sections={sections}
    />
  );
}