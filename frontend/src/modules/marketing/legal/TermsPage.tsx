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
      "Welcome to Sangum. These Terms of Service govern your access to and use of the Sangum website, applications, and all related services. By creating an account, accessing, or using the platform, you agree to comply with these Terms, our Privacy Policy, and any additional policies or guidelines that may apply to specific features of the platform.",
      "If you do not agree with any part of these Terms, you must discontinue using Sangum immediately. Your continued use of the platform constitutes your acceptance of the most current version of these Terms.",
    ],
  },

  {
    id: "eligibility",
    title: "Eligibility",
    content: [
      "You must be at least 13 years of age to use Sangum. If you are under the age of 18, you represent that you have obtained permission from a parent or legal guardian before creating an account or using the platform.",
      "By registering an account, you confirm that the information you provide is accurate, complete, and kept up to date. You are responsible for ensuring that your use of Sangum complies with all applicable laws and regulations in your jurisdiction.",
    ],
  },

  {
    id: "user-accounts",
    title: "User Accounts",
    content: [
      "Certain features of Sangum require you to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.",
      "You agree not to share your account with others, impersonate another individual or organization, or create accounts using false or misleading information. If you believe your account has been compromised, you should immediately update your credentials and notify us.",
      "We reserve the right to suspend, restrict, or remove accounts that violate these Terms or pose a security risk to the platform or its users.",
    ],
  },

  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: [
      "You agree to use Sangum responsibly and in a manner that respects other users and the integrity of the platform. You must not engage in unlawful, abusive, fraudulent, or harmful activities while using our services.",
      "Prohibited activities include, but are not limited to, posting illegal or infringing content, distributing malware or malicious code, sending spam, attempting unauthorized access to accounts or systems, impersonating others, manipulating platform functionality, or interfering with the normal operation of Sangum.",
      "You are also expected to follow any community-specific rules established by moderators, provided those rules do not conflict with these Terms or applicable law.",
    ],
  },

  {
    id: "content",
    title: "Content",
    content: [
      "You retain ownership of the content you create and publish on Sangum, including posts, comments, media, resources, profile information, and other user-generated content.",
      "By submitting content to Sangum, you grant us a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, distribute, and process your content solely for the purpose of operating, improving, promoting, and providing the platform and its features.",
      "You are solely responsible for the content you publish and must ensure that you have all necessary rights and permissions to share it. You must not upload content that infringes intellectual property rights, violates privacy, or breaches applicable laws.",
      "We reserve the right to remove, restrict, or moderate content that violates these Terms, our Community Guidelines, or applicable legal requirements.",
    ],
  },

  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: [
      "Unless otherwise stated, Sangum, including its name, branding, logos, design elements, source code, software, documentation, graphics, and other platform materials, are protected by applicable intellectual property laws and remain the property of Sangum or its licensors.",
      "You may not copy, reproduce, modify, distribute, reverse engineer, sell, or exploit any part of the platform without prior written permission, except as expressly permitted by applicable law.",
      "Nothing in these Terms grants ownership of Sangum's intellectual property. Any rights not expressly granted remain reserved.",
    ],
  },

  {
    id: "disclaimers",
    title: "Disclaimers",
    content: [
      "Sangum is provided on an 'as is' and 'as available' basis. To the fullest extent permitted by law, we disclaim all warranties, whether express, implied, or statutory, including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted availability.",
      "We do not guarantee that the platform will always be error-free, secure, continuously available, or free from viruses or other harmful components. User-generated content may contain inaccuracies or opinions that do not reflect the views of Sangum.",
    ],
  },

  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: [
      "To the fullest extent permitted by applicable law, Sangum, its developers, contributors, moderators, administrators, and service providers shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages arising from or related to your use of the platform.",
      "This limitation includes damages resulting from loss of data, account access, service interruptions, reliance on user-generated content, unauthorized access, technical failures, or interactions between users, even if we have been advised of the possibility of such damages.",
      "Your sole remedy for dissatisfaction with Sangum is to discontinue using the platform.",
    ],
  },

  {
    id: "termination",
    title: "Termination",
    content: [
      "We reserve the right to suspend, restrict, or permanently terminate your account or access to Sangum if we reasonably believe you have violated these Terms, applicable laws, or our community policies.",
      "You may stop using Sangum at any time and may request deletion of your account in accordance with our Privacy Policy. Certain information may be retained where necessary for legal compliance, security, fraud prevention, dispute resolution, or enforcement of these Terms.",
      "Termination of your account does not automatically remove all publicly visible content you have contributed where its retention is necessary for maintaining community discussions or legal obligations.",
    ],
  },

  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    content: [
      "We may revise these Terms of Service from time to time to reflect changes in our platform, legal requirements, or operational practices.",
      "When significant changes are made, we may notify users through in-app notices, email, or other appropriate communication channels. The updated Terms become effective upon publication unless otherwise specified.",
      "Your continued use of Sangum after the revised Terms become effective constitutes your acceptance of the updated Terms.",
    ],
  },

  {
    id: "contact-us",
    title: "Contact Us",
    content: [
      "If you have any questions, concerns, or requests regarding these Terms of Service, please contact our legal team.",
      "You can reach us at legal@sangum.dev, and we will make reasonable efforts to respond to your inquiry as promptly as possible.",
    ],
  },
];

export default function TermsPage() {
  usePageTitle("Terms of Service — Sangum");

  return (
    <LegalArticleLayout
      title="Terms of Service"
      lastUpdated="July 6, 2026"
      sections={sections}
    />
  );
}