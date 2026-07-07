import LegalArticleLayout from "@/layouts/LegalArticleLayout";
import { usePageTitle } from "@/shared/hooks/usePageTitle";


interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

const sections: LegalSection[] = [
  {
    id: "general-information",
    title: "General Information",
    content: [
      "The information available on Sangum is provided for general informational, educational, and community discussion purposes only. By accessing or using the platform, you acknowledge that you have read and understood this Disclaimer and agree to use the platform at your own discretion.",
      "Sangum is a community-driven platform where users create, share, and discuss content across various topics. While we strive to maintain a safe and reliable environment, the presence of any content on the platform should not be interpreted as an endorsement, verification, or recommendation by Sangum.",
      "Your use of Sangum is entirely at your own risk. You are responsible for evaluating the accuracy, relevance, and suitability of any information before relying on it.",
    ],
  },

  {
    id: "no-professional-advice",
    title: "No Professional Advice",
    content: [
      "Content published on Sangum, including posts, comments, resources, discussions, and community contributions, is not intended to replace professional advice. Nothing on the platform should be considered legal, financial, medical, technical, educational, or other professional guidance.",
      "Users may share personal experiences, opinions, tutorials, recommendations, or interpretations based on their own knowledge. These contributions may not be accurate, complete, or applicable to your particular circumstances.",
      "Before making important decisions based on information found on Sangum, you should consult an appropriately qualified professional who can evaluate your specific situation.",
    ],
  },

  {
    id: "third-party-content",
    title: "Third-Party Content",
    content: [
      "Sangum allows users to publish posts, comments, resources, media, links, and other forms of content. Such content is created solely by individual users and reflects their own opinions, experiences, and viewpoints.",
      "We do not routinely verify the accuracy, completeness, legality, or reliability of user-generated content. The publication of content on Sangum does not imply endorsement, approval, or recommendation by the platform or its administrators.",
      "Users are encouraged to independently verify information obtained through the platform before relying on it. If you encounter content that violates our policies or applicable laws, you may report it using the reporting tools available within Sangum.",
    ],
  },

  {
    id: "no-guarantees",
    title: "No Guarantees",
    content: [
      "Sangum is provided on an 'as is' and 'as available' basis without warranties of any kind, whether express or implied. We do not guarantee that the platform will always be available, secure, uninterrupted, or free from errors.",
      "We make no representations regarding the completeness, reliability, accuracy, timeliness, or usefulness of any information, resources, or services available through Sangum. Content may become outdated, contain inaccuracies, or be modified without prior notice.",
      "While we continuously work to improve the platform, we cannot guarantee that every feature, community, or piece of content will meet your expectations or specific requirements.",
    ],
  },

  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: [
      "To the fullest extent permitted by applicable law, Sangum, its developers, contributors, moderators, and administrators shall not be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising from or related to your use of the platform.",
      "This includes, but is not limited to, damages resulting from reliance on user-generated content, temporary service interruptions, loss of data, unauthorized account access, inaccurate information, third-party links, or interactions between users.",
      "You acknowledge that your use of Sangum and any decisions made based on information obtained through the platform are solely your responsibility.",
    ],
  },

  {
    id: "external-links",
    title: "External Links",
    content: [
      "Sangum may contain links to third-party websites, repositories, documentation, videos, or other external resources shared by users or administrators for reference purposes.",
      "We do not control, monitor, or assume responsibility for the content, privacy practices, security, or availability of external websites. Visiting third-party websites is entirely at your own risk, and you should review their respective terms and privacy policies before using their services.",
    ],
  },

  {
    id: "contact-us",
    title: "Contact Us",
    content: [
      "If you have any questions or concerns regarding this Disclaimer, or if you require clarification about any statement contained within this page, please contact our legal team.",
      "You can reach us at legal@sangum.dev, and we will make reasonable efforts to respond to your inquiry in a timely manner.",
    ],
  },
];

export default function DisclaimerPage() {
  usePageTitle("Disclaimer — Sangum");

  return (
    <LegalArticleLayout
      title="Disclaimer"
      lastUpdated="May 10, 2024"
      sections={sections}
    />
  );
}