import * as React from 'react';

/**
 * Small, zero-dependency icon set used internally by this library as
 * sensible defaults (Modal's close glyph, Alert's status glyph, Select's
 * chevron, Input's password-visibility toggle, EmptyState's default
 * illustration, Sidebar's nav glyphs, RichTextEditor's toolbar, …). Every
 * consumer-facing slot that uses one of these also accepts a `ReactNode`
 * override, so swapping in `lucide-react` or any other icon set in the
 * host app never requires touching this file.
 *
 * Paths mirror the strokes used in the reference sheets (01-ui-primitives,
 * 02-form, 03-navigation) wherever that exact glyph appears there, so the
 * rendered result matches the originals pixel for pixel. A handful
 * (chevron, search, eye, code, upload, plus, list, link) are added because
 * a component's brief calls for the behavior — a custom select arrow, a
 * search input, a password toggle, a markdown toolbar — without the source
 * sheet drawing that exact glyph itself; those follow the same 24×24,
 * 2px-stroke, round-cap visual language as everything else here. The three
 * social brand marks (Twitter/X, GitHub, LinkedIn) are fill-style rather
 * than outline, matching how the reference sheet itself draws them.
 */

export interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
}

function createIcon(displayName: string, path: React.ReactNode) {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(function IconImpl(
    { size = 16, strokeWidth = 2, ...rest },
    ref
  ) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {path}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

export const XIcon = createIcon('XIcon', <path d="M18 6L6 18M6 6l12 12" />);

export const CheckIcon = createIcon('CheckIcon', <path d="M20 6L9 17l-5-5" />);

export const CheckCircleIcon = createIcon(
  'CheckCircleIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </>
);

export const InfoCircleIcon = createIcon(
  'InfoCircleIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>
);

export const XCircleIcon = createIcon(
  'XCircleIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </>
);

export const AlertTriangleIcon = createIcon(
  'AlertTriangleIcon',
  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
);

export const ChevronDownIcon = createIcon('ChevronDownIcon', <path d="M6 9l6 6 6-6" />);

export const SearchIcon = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </>
);

export const EyeIcon = createIcon(
  'EyeIcon',
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const EyeOffIcon = createIcon(
  'EyeOffIcon',
  <>
    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a21.62 21.62 0 015.06-6.06M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 8 11 8a21.6 21.6 0 01-3.22 4.32M14.12 14.12a3 3 0 11-4.24-4.24" />
    <path d="M1 1l22 22" />
  </>
);

export const LayoutGridIcon = createIcon(
  'LayoutGridIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </>
);

/* ------------------------------------------------------------------ */
/* Fill-style icons (social brand marks) — these render as solid       */
/* silhouettes (`fill="currentColor"`, no stroke), unlike every icon    */
/* above which is outline-style. Kept in their own helper so the        */
/* outline `createIcon` doesn't need a fill/stroke mode switch.         */
/* ------------------------------------------------------------------ */

function createFillIcon(displayName: string, path: React.ReactNode, viewBox = '0 0 24 24') {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(function IconImpl(
    { size = 16, ...rest },
    ref
  ) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={viewBox}
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
        {...rest}
      >
        {path}
      </svg>
    );
  });
  Icon.displayName = displayName;
  return Icon;
}

/* ------------------------------------------------------------------ */
/* Navigation icons (Sidebar, AdminSidebar, Topbar, Breadcrumb, …)      */
/* ------------------------------------------------------------------ */

export const HomeIcon = createIcon('HomeIcon', <path d="M3 12l9-9 9 9M5 10v10h14V10" />);

export const UsersIcon = createIcon(
  'UsersIcon',
  <path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M7.5 10.5a4 4 0 110-7.75" />
);

export const UserIcon = createIcon(
  'UserIcon',
  <>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </>
);

export const CompassIcon = createIcon(
  'CompassIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" />
  </>
);

export const MessageCircleIcon = createIcon(
  'MessageCircleIcon',
  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
);

export const BellIcon = createIcon(
  'BellIcon',
  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
);

export const BookmarkIcon = createIcon('BookmarkIcon', <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />);

export const BookOpenIcon = createIcon(
  'BookOpenIcon',
  <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z" />
);

export const CalendarIcon = createIcon(
  'CalendarIcon',
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

export const SettingsIcon = createIcon(
  'SettingsIcon',
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15.84a1.65 1.65 0 00-1.51-1H3.5a2 2 0 110-4h.09A1.65 1.65 0 005 9.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5.18a1.65 1.65 0 001-1.51V3.5a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 8.6a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </>
);

export const LayoutDashboardIcon = createIcon(
  'LayoutDashboardIcon',
  <>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </>
);

export const GlobeIcon = createIcon(
  'GlobeIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
  </>
);

export const FlagIcon = createIcon(
  'FlagIcon',
  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22V15" />
);

export const MenuIcon = createIcon('MenuIcon', <path d="M3 12h18M3 6h18M3 18h18" />);

export const SunIcon = createIcon(
  'SunIcon',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </>
);

export const MoonIcon = createIcon('MoonIcon', <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />);

export const ChevronLeftIcon = createIcon('ChevronLeftIcon', <path d="M15 18l-6-6 6-6" />);

export const ChevronRightIcon = createIcon('ChevronRightIcon', <path d="M9 18l6-6-6-6" />);

export const PlusIcon = createIcon('PlusIcon', <path d="M12 5v14M5 12h14" />);

/* ------------------------------------------------------------------ */
/* Form icons (RichTextEditor, ImageUpload, …)                          */
/* ------------------------------------------------------------------ */

export const LinkIcon = createIcon(
  'LinkIcon',
  <path d="M10 13a5 5 0 007.07 0l1.93-1.93a5 5 0 00-7.07-7.07L10 5M14 11a5 5 0 00-7.07 0L5 12.93a5 5 0 007.07 7.07L14 19" />
);

export const ListIcon = createIcon(
  'ListIcon',
  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
);

export const CodeIcon = createIcon('CodeIcon', <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />);

export const UploadCloudIcon = createIcon(
  'UploadCloudIcon',
  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
);

/* ------------------------------------------------------------------ */
/* Social brand marks (PublicFooter default social links)               */
/* ------------------------------------------------------------------ */

export const TwitterIcon = createFillIcon(
  'TwitterIcon',
  <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0022.4.36a9.09 9.09 0 01-2.88 1.1A4.52 4.52 0 0016.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03A12.94 12.94 0 013 1.64a4.48 4.48 0 001.4 6.04 4.48 4.48 0 01-2.05-.57v.06c0 2.2 1.57 4.04 3.65 4.46a4.5 4.5 0 01-2.04.08 4.52 4.52 0 004.22 3.14A9.06 9.06 0 010 19.54a12.83 12.83 0 006.95 2.04c8.34 0 12.9-6.91 12.9-12.9 0-.2 0-.39-.01-.58A9.22 9.22 0 0023 3z" />
);

export const GithubIcon = createFillIcon(
  'GithubIcon',
  <path d="M12 0a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0012 0z" />
);

export const LinkedinIcon = createFillIcon(
  'LinkedinIcon',
  <path d="M19 0h-14a5 5 0 00-5 5v14a5 5 0 005 5h14a5 5 0 005-5v-14a5 5 0 00-5-5zM8 19h-3v-9h3zm-1.5-10.3a1.74 1.74 0 110-3.49 1.74 1.74 0 010 3.49zM20 19h-3v-4.74c0-1.13-.02-2.58-1.57-2.58-1.57 0-1.81 1.23-1.81 2.5v4.82h-3v-9h2.88v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z" />
);

/**
 * Monochrome "G" mark — deliberately not the official 4-colour Google
 * logo. Matches 18-auth.html's note that all OAuth provider icons render
 * in `currentColor` so they adapt to light/dark theme.
 */
export const GoogleIcon = createFillIcon(
  'GoogleIcon',
  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
);

export const MailIcon = createIcon(
  'MailIcon',
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </>
);

/* ------------------------------------------------------------------ */
/* Post icons (PostTypeSelector, PostActions, PostHeader, …)            */
/* ------------------------------------------------------------------ */

export const AlignLeftIcon = createIcon('AlignLeftIcon', <path d="M4 7h16M4 12h16M4 17h10" />);

export const ImageIcon = createIcon(
  'ImageIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </>
);

export const VideoIcon = createIcon(
  'VideoIcon',
  <>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </>
);

export const TrendingUpIcon = createIcon(
  'TrendingUpIcon',
  <path d="M21 21H4a1 1 0 01-1-1V3M7 14l4-4 4 4 5-5" />
);

export const ThumbsUpIcon = createFillIcon(
  'ThumbsUpIcon',
  <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3z" />
);

export const ShareIcon = createIcon(
  'ShareIcon',
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
  </>
);

export const MoreHorizontalIcon = createFillIcon(
  'MoreHorizontalIcon',
  <>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </>
);

/* ------------------------------------------------------------------ */
/* Comment icons (CommentActions, …)                                    */
/* ------------------------------------------------------------------ */

export const EditIcon = createIcon(
  'EditIcon',
  <>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" />
  </>
);

export const TrashIcon = createIcon('TrashIcon', <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />);

/* ------------------------------------------------------------------ */
/* Community icons (CommunityTypeBadge, CommunityCard, …)               */
/* ------------------------------------------------------------------ */

/** Plain padlock — Private community type, and the private CommunityCard's icon-fallback avatar. */
export const LockIcon = createIcon(
  'LockIcon',
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </>
);

/** Padlock with a visible keyhole — Restricted community type (distinct from the plain LockIcon used for Private). */
export const LockKeyholeIcon = createIcon(
  'LockKeyholeIcon',
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M12 15v2M7 11V7a5 5 0 0110 0v4" />
  </>
);

export const CircleIcon = createIcon('CircleIcon', <circle cx="12" cy="12" r="10" />);

/** Spiky seal/badge — verified or featured community marker, fill-style. */
export const SealIcon = createFillIcon(
  'SealIcon',
  <path d="M12 2l2.5 4.5L19 8l-3.5 3.5L16 16l-4-2-4 2 .5-4.5L5 8l4.5-1.5z" />
);

/* ------------------------------------------------------------------ */
/* Resource icons (ResourceTypeBadge) — Video and Book reuse the         */
/* existing VideoIcon / BookOpenIcon above (identical paths).           */
/* ------------------------------------------------------------------ */

export const FileIcon = createIcon(
  'FileIcon',
  <>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
  </>
);

export const GraduationCapIcon = createIcon(
  'GraduationCapIcon',
  <>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </>
);

export const WrenchIcon = createIcon(
  'WrenchIcon',
  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z" />
);

export const FileTextIcon = createIcon(
  'FileTextIcon',
  <>
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2z" />
    <path d="M9 12h6M9 16h6M9 8h6" />
  </>
);

/* ------------------------------------------------------------------ */
/* Chat icons (ChatInput, …)                                            */
/* ------------------------------------------------------------------ */

export const PaperclipIcon = createIcon(
  'PaperclipIcon',
  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
);

export const SmileIcon = createIcon(
  'SmileIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </>
);

export const SendIcon = createIcon('SendIcon', <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />);