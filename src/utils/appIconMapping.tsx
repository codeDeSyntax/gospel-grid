import React from "react";

// Simple Icons (Si) - Brand icons
import {
  SiGooglechrome,
  SiFirefox,
  SiSafari,
  SiOpera,
  SiSublimetext,
  SiVim,
  SiAdobeacrobatreader,
  SiAdobephotoshop,
  SiAdobeillustrator,
  SiAdobepremierepro,
  SiAdobeaftereffects,
  SiAdobeaudition,
  SiAdobeindesign,
  SiAdobexd,
  SiFigma,
  SiSketch,
  SiCanva,
  SiGimp,
  SiBlender,
  SiAutodesk,
  SiSpotify,
  SiApplemusic,
  SiAmazonmusic,
  SiYoutubemusic,
  SiSoundcloud,
  SiAudacity,
  SiVlcmediaplayer,
  SiYoutube,
  SiNetflix,
  SiTwitch,
  SiObsstudio,
  SiPlex,
  SiKodi,
  SiMpv,
  SiWhatsapp,
  SiTelegram,
  SiSignal,
  SiDiscord,
  SiSlack,
  SiZoom,
  SiViber,
  SiLinkedin,
  SiFacebook,
  SiInstagram,
  SiSnapchat,
  SiTiktok,
  SiReddit,
  SiSteam,
  SiEpicgames,
  SiOrigin,
  SiNintendoswitch,
  SiPlaystation,
  SiRoblox,
  SiLeagueoflegends,
  SiDropbox,
  SiGoogledrive,
  SiIcloud,
  SiBox,
  SiMega,
  SiNextcloud,
  SiNotion,
  SiObsidian,
  SiEvernote,
  SiTrello,
  SiAsana,
  SiJira,
  SiConfluence,
  SiMacos,
  SiLinux,
  SiUbuntu,
  SiAndroid,
  SiIos,
  SiGit,
  SiGithub,
  SiGitlab,
  SiBitbucket,
  SiDocker,
  SiKubernetes,
  SiPostman,
  SiInsomnia,
  SiDbeaver,
  SiMysql,
  SiPostgresql,
  SiMongodb,
  SiRedis,
  SiElasticsearch,
  SiTableau,
  SiVirtualbox,
  SiVmware,
  SiQemu,
} from "react-icons/si";

// Font Awesome 6 Icons
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
  FaFolder,
  FaFolderOpen,
  FaDesktop,
  FaTerminal,
  FaCalculator,
  FaCog,
  FaTools,
  FaGamepad,
  FaMusic,
  FaVideo,
  FaCamera,
  FaPaintBrush,
  FaEdit,
  FaBook,
  FaBible,
  FaDatabase,
  FaServer,
  FaCloud,
  FaLock,
  FaKey,
  FaWifi,
  FaNetworkWired,
  FaHdd,
  FaMemory,
  FaMicrochip,
  FaPlug,
  FaBolt,
  FaThermometerHalf,
  FaFan,
  FaKeyboard,
  FaMouse,
  FaHeadphones,
  FaMicrophone,
  FaPrint,
  FaDownload,
  FaUpload,
  FaSync,
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid,
  FaMicrosoft,
  FaEdge,
} from "react-icons/fa";

// Bootstrap Icons
import {
  BsWindows,
  BsApple,
  BsAndroid2,
  BsBrowserChrome,
  BsBrowserEdge,
  BsBrowserFirefox,
  BsBrowserSafari,
  BsFiletypePdf,
  BsFiletypeDocx,
  BsFiletypeXlsx,
  BsFiletypePptx,
  BsFiletypeJpg,
  BsFiletypePng,
  BsFiletypeMp4,
  BsFiletypeMp3,
  BsTerminal,
  BsGear,
  BsController,
  BsMusicNote,
  BsCameraVideo,
  BsCamera,
  BsPalette,
  BsPencil,
  BsBook,
  BsDatabase,
  BsServer,
  BsCloud,
  BsLock,
  BsKey,
  BsWifi,
  BsEthernet,
  BsDeviceHdd,
  BsMemory,
  BsCpu,
  BsPlug,
  BsLightning,
  BsThermometer,
  BsFan,
  BsKeyboard,
  BsMouse,
  BsHeadphones,
  BsMic,
  BsPrinter,
  BsDownload,
  BsUpload,
  BsArrowRepeat,
  BsCloudDownload,
  BsCloudUpload,
} from "react-icons/bs";

// Devicons
import {
  DiVisualstudio,
  DiSublime,
  DiVim,
  DiLinux,
  DiUbuntu,
  DiWindows,
  DiApple,
  DiAndroid,
  DiGit,
  DiGithubBadge,
  DiMysql,
  DiPostgresql,
  DiMongodb,
  DiRedis,
  DiDocker,
  DiReact,
  DiNodejs,
  DiPython,
  DiJavascript1,
  DiJava,
  DiDotnet,
  DiPhp,
  DiRuby,
  DiGo,
  DiRust,
  DiSwift,
} from "react-icons/di";

export interface AppIconData {
  icon: React.ReactNode;
  gradient: string;
  color: string;
}

// Comprehensive app icon mapping
export const APP_ICON_MAP: Record<string, AppIconData> = {
  // Web Browsers
  chrome: {
    icon: <SiGooglechrome />,
    gradient: "from-blue-500 via-green-400 to-red-400",
    color: "text-blue-500",
  },
  "google chrome": {
    icon: <SiGooglechrome />,
    gradient: "from-blue-500 via-green-400 to-red-400",
    color: "text-blue-500",
  },
  edge: {
    icon: <BsBrowserEdge />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
  "microsoft edge": {
    icon: <BsBrowserEdge />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
  firefox: {
    icon: <SiFirefox />,
    gradient: "from-orange-500 to-red-500",
    color: "text-orange-500",
  },
  "mozilla firefox": {
    icon: <SiFirefox />,
    gradient: "from-orange-500 to-red-500",
    color: "text-orange-500",
  },
  safari: {
    icon: <SiSafari />,
    gradient: "from-blue-400 to-cyan-300",
    color: "text-blue-400",
  },
  opera: {
    icon: <SiOpera />,
    gradient: "from-red-500 to-pink-400",
    color: "text-red-500",
  },

  // Code Editors & IDEs
  "visual studio code": {
    icon: <DiVisualstudio />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  vscode: {
    icon: <DiVisualstudio />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  code: {
    icon: <FaFileCode />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  "visual studio": {
    icon: <DiVisualstudio />,
    gradient: "from-purple-600 to-blue-500",
    color: "text-purple-600",
  },
  intellij: {
    icon: <FaFileCode />,
    gradient: "from-orange-500 to-red-500",
    color: "text-orange-500",
  },
  "intellij idea": {
    icon: <FaFileCode />,
    gradient: "from-orange-500 to-red-500",
    color: "text-orange-500",
  },
  webstorm: {
    icon: <FaFileCode />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  pycharm: {
    icon: <FaFileCode />,
    gradient: "from-green-500 to-yellow-400",
    color: "text-green-500",
  },
  "sublime text": {
    icon: <SiSublimetext />,
    gradient: "from-orange-500 to-yellow-400",
    color: "text-orange-500",
  },
  "notepad++": {
    icon: <FaFileAlt />,
    gradient: "from-green-500 to-blue-400",
    color: "text-green-500",
  },
  notepad: {
    icon: <FaFileAlt />,
    gradient: "from-gray-500 to-blue-400",
    color: "text-gray-500",
  },
  atom: {
    icon: <FaFileCode />,
    gradient: "from-green-500 to-teal-400",
    color: "text-green-500",
  },
  vim: {
    icon: <SiVim />,
    gradient: "from-green-600 to-green-400",
    color: "text-green-600",
  },

  // Microsoft Office Suite
  "microsoft office": {
    icon: <FaMicrosoft />,
    gradient: "from-orange-500 to-red-500",
    color: "text-orange-500",
  },
  word: {
    icon: <FaFileWord />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },
  "microsoft word": {
    icon: <FaFileWord />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },
  excel: {
    icon: <FaFileExcel />,
    gradient: "from-green-600 to-green-400",
    color: "text-green-600",
  },
  "microsoft excel": {
    icon: <FaFileExcel />,
    gradient: "from-green-600 to-green-400",
    color: "text-green-600",
  },
  powerpoint: {
    icon: <FaFilePowerpoint />,
    gradient: "from-orange-600 to-red-400",
    color: "text-orange-600",
  },
  "microsoft powerpoint": {
    icon: <FaFilePowerpoint />,
    gradient: "from-orange-600 to-red-400",
    color: "text-orange-600",
  },
  outlook: {
    icon: <FaFileAlt />,
    gradient: "from-blue-500 to-indigo-400",
    color: "text-blue-500",
  },
  "microsoft outlook": {
    icon: <FaFileAlt />,
    gradient: "from-blue-500 to-indigo-400",
    color: "text-blue-500",
  },
  teams: {
    icon: <FaVideo />,
    gradient: "from-purple-500 to-blue-400",
    color: "text-purple-500",
  },
  "microsoft teams": {
    icon: <FaVideo />,
    gradient: "from-purple-500 to-blue-400",
    color: "text-purple-500",
  },
  onenote: {
    icon: <FaFileAlt />,
    gradient: "from-purple-600 to-purple-400",
    color: "text-purple-600",
  },

  // Adobe Creative Suite
  "adobe acrobat": {
    icon: <SiAdobeacrobatreader />,
    gradient: "from-red-600 to-red-400",
    color: "text-red-600",
  },
  "acrobat reader": {
    icon: <SiAdobeacrobatreader />,
    gradient: "from-red-600 to-red-400",
    color: "text-red-600",
  },
  "adobe reader": {
    icon: <SiAdobeacrobatreader />,
    gradient: "from-red-600 to-red-400",
    color: "text-red-600",
  },
  photoshop: {
    icon: <SiAdobephotoshop />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
  "adobe photoshop": {
    icon: <SiAdobephotoshop />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
  illustrator: {
    icon: <SiAdobeillustrator />,
    gradient: "from-orange-500 to-yellow-400",
    color: "text-orange-500",
  },
  "adobe illustrator": {
    icon: <SiAdobeillustrator />,
    gradient: "from-orange-500 to-yellow-400",
    color: "text-orange-500",
  },
  "premiere pro": {
    icon: <SiAdobepremierepro />,
    gradient: "from-purple-600 to-pink-400",
    color: "text-purple-600",
  },
  "after effects": {
    icon: <SiAdobeaftereffects />,
    gradient: "from-blue-600 to-purple-500",
    color: "text-blue-600",
  },
  audition: {
    icon: <SiAdobeaudition />,
    gradient: "from-teal-500 to-green-400",
    color: "text-teal-500",
  },
  indesign: {
    icon: <SiAdobeindesign />,
    gradient: "from-pink-500 to-red-400",
    color: "text-pink-500",
  },
  "adobe xd": {
    icon: <SiAdobexd />,
    gradient: "from-purple-500 to-pink-400",
    color: "text-purple-500",
  },

  // Design & Creative
  figma: {
    icon: <SiFigma />,
    gradient: "from-purple-500 to-pink-400",
    color: "text-purple-500",
  },
  sketch: {
    icon: <SiSketch />,
    gradient: "from-yellow-500 to-orange-400",
    color: "text-yellow-500",
  },
  canva: {
    icon: <SiCanva />,
    gradient: "from-blue-500 to-purple-400",
    color: "text-blue-500",
  },
  gimp: {
    icon: <SiGimp />,
    gradient: "from-gray-600 to-gray-400",
    color: "text-gray-600",
  },
  blender: {
    icon: <SiBlender />,
    gradient: "from-orange-500 to-blue-500",
    color: "text-orange-500",
  },

  // Media & Entertainment
  spotify: {
    icon: <SiSpotify />,
    gradient: "from-green-500 to-green-300",
    color: "text-green-500",
  },
  "apple music": {
    icon: <SiApplemusic />,
    gradient: "from-red-500 to-pink-400",
    color: "text-red-500",
  },
  youtube: {
    icon: <SiYoutube />,
    gradient: "from-red-500 to-red-300",
    color: "text-red-500",
  },
  vlc: {
    icon: <SiVlcmediaplayer />,
    gradient: "from-orange-500 to-yellow-400",
    color: "text-orange-500",
  },
  "vlc media player": {
    icon: <SiVlcmediaplayer />,
    gradient: "from-orange-500 to-yellow-400",
    color: "text-orange-500",
  },
  netflix: {
    icon: <SiNetflix />,
    gradient: "from-red-600 to-red-400",
    color: "text-red-600",
  },
  twitch: {
    icon: <SiTwitch />,
    gradient: "from-purple-500 to-purple-300",
    color: "text-purple-500",
  },
  "obs studio": {
    icon: <SiObsstudio />,
    gradient: "from-gray-600 to-gray-400",
    color: "text-gray-600",
  },
  obs: {
    icon: <SiObsstudio />,
    gradient: "from-gray-600 to-gray-400",
    color: "text-gray-600",
  },
  plex: {
    icon: <SiPlex />,
    gradient: "from-yellow-500 to-orange-400",
    color: "text-yellow-500",
  },
  audacity: {
    icon: <SiAudacity />,
    gradient: "from-blue-600 to-red-500",
    color: "text-blue-600",
  },

  // Communication
  whatsapp: {
    icon: <SiWhatsapp />,
    gradient: "from-green-500 to-green-300",
    color: "text-green-500",
  },
  telegram: {
    icon: <SiTelegram />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  signal: {
    icon: <SiSignal />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },
  discord: {
    icon: <SiDiscord />,
    gradient: "from-indigo-500 to-purple-400",
    color: "text-indigo-500",
  },
  slack: {
    icon: <SiSlack />,
    gradient: "from-purple-500 to-pink-400",
    color: "text-purple-500",
  },
  zoom: {
    icon: <SiZoom />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  skype: {
    icon: <FaVideo />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  viber: {
    icon: <SiViber />,
    gradient: "from-purple-500 to-purple-300",
    color: "text-purple-500",
  },

  // Gaming
  steam: {
    icon: <SiSteam />,
    gradient: "from-blue-600 to-gray-500",
    color: "text-blue-600",
  },
  "epic games": {
    icon: <SiEpicgames />,
    gradient: "from-gray-800 to-gray-600",
    color: "text-gray-800",
  },
  origin: {
    icon: <SiOrigin />,
    gradient: "from-orange-500 to-red-400",
    color: "text-orange-500",
  },
  minecraft: {
    icon: <FaGamepad />,
    gradient: "from-green-500 to-brown-400",
    color: "text-green-500",
  },
  roblox: {
    icon: <SiRoblox />,
    gradient: "from-red-500 to-orange-400",
    color: "text-red-500",
  },

  // Cloud Storage
  dropbox: {
    icon: <SiDropbox />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  "google drive": {
    icon: <SiGoogledrive />,
    gradient: "from-blue-500 via-yellow-400 to-green-400",
    color: "text-blue-500",
  },
  onedrive: {
    icon: <FaCloud />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
  icloud: {
    icon: <SiIcloud />,
    gradient: "from-blue-500 to-gray-400",
    color: "text-blue-500",
  },

  // Productivity
  notion: {
    icon: <SiNotion />,
    gradient: "from-gray-800 to-gray-600",
    color: "text-gray-800",
  },
  obsidian: {
    icon: <SiObsidian />,
    gradient: "from-purple-600 to-purple-400",
    color: "text-purple-600",
  },
  evernote: {
    icon: <SiEvernote />,
    gradient: "from-green-500 to-green-300",
    color: "text-green-500",
  },
  trello: {
    icon: <SiTrello />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },

  // System & Utilities
  terminal: {
    icon: <BsTerminal />,
    gradient: "from-green-500 to-green-300",
    color: "text-green-500",
  },
  cmd: {
    icon: <BsTerminal />,
    gradient: "from-gray-600 to-gray-400",
    color: "text-gray-600",
  },
  powershell: {
    icon: <BsTerminal />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },
  calculator: {
    icon: <FaCalculator />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  "file explorer": {
    icon: <FaFolder />,
    gradient: "from-yellow-500 to-orange-400",
    color: "text-yellow-500",
  },
  explorer: {
    icon: <FaFolder />,
    gradient: "from-yellow-500 to-orange-400",
    color: "text-yellow-500",
  },
  "windows explorer": {
    icon: <FaFolder />,
    gradient: "from-yellow-500 to-orange-400",
    color: "text-yellow-500",
  },

  // Bible & Religious Software
  logos: {
    icon: <FaBible />,
    gradient: "from-amber-500 to-yellow-400",
    color: "text-amber-500",
  },
  "logos bible software": {
    icon: <FaBible />,
    gradient: "from-amber-500 to-yellow-400",
    color: "text-amber-500",
  },
  bible: {
    icon: <FaBible />,
    gradient: "from-amber-500 to-yellow-400",
    color: "text-amber-500",
  },
  "olive tree": {
    icon: <FaBible />,
    gradient: "from-green-600 to-green-400",
    color: "text-green-600",
  },
  accordance: {
    icon: <FaBible />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },

  // Development Tools
  git: {
    icon: <SiGit />,
    gradient: "from-orange-500 to-red-400",
    color: "text-orange-500",
  },
  github: {
    icon: <SiGithub />,
    gradient: "from-gray-800 to-gray-600",
    color: "text-gray-800",
  },
  gitlab: {
    icon: <SiGitlab />,
    gradient: "from-orange-500 to-red-400",
    color: "text-orange-500",
  },
  docker: {
    icon: <SiDocker />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  postman: {
    icon: <SiPostman />,
    gradient: "from-orange-500 to-red-400",
    color: "text-orange-500",
  },

  // Database Tools
  mysql: {
    icon: <SiMysql />,
    gradient: "from-blue-600 to-orange-400",
    color: "text-blue-600",
  },
  postgresql: {
    icon: <SiPostgresql />,
    gradient: "from-blue-600 to-blue-400",
    color: "text-blue-600",
  },
  mongodb: {
    icon: <SiMongodb />,
    gradient: "from-green-600 to-green-400",
    color: "text-green-600",
  },
  redis: {
    icon: <SiRedis />,
    gradient: "from-red-600 to-red-400",
    color: "text-red-600",
  },

  // Virtualization
  virtualbox: {
    icon: <SiVirtualbox />,
    gradient: "from-blue-500 to-cyan-400",
    color: "text-blue-500",
  },
  vmware: {
    icon: <SiVmware />,
    gradient: "from-blue-600 to-gray-500",
    color: "text-blue-600",
  },
  "hyper-v": {
    icon: <FaServer />,
    gradient: "from-blue-600 to-cyan-400",
    color: "text-blue-600",
  },
};

// Function to get app icon data
export const getAppIconData = (appName: string): AppIconData => {
  const normalizedName = appName.toLowerCase().trim();

  // Direct match
  if (APP_ICON_MAP[normalizedName]) {
    return APP_ICON_MAP[normalizedName];
  }

  // Partial match - find the first key that includes the app name
  const matchedKey = Object.keys(APP_ICON_MAP).find(
    (key) => normalizedName.includes(key) || key.includes(normalizedName)
  );

  if (matchedKey) {
    return APP_ICON_MAP[matchedKey];
  }

  // Default fallback
  return {
    icon: <FaDesktop />,
    gradient: "from-gray-500 to-gray-300",
    color: "text-gray-500",
  };
};

// Function to get app icon with specified size
export const getAppIcon = (
  appName: string,
  size: number = 16
): React.ReactNode => {
  const iconData = getAppIconData(appName);
  return React.cloneElement(iconData.icon as React.ReactElement, {
    size,
    className: iconData.color,
  });
};

// Function to get app gradient
export const getAppGradient = (appName: string): string => {
  const iconData = getAppIconData(appName);
  return iconData.gradient;
};
