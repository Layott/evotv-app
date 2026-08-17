/**
 * The app's icon set. Phosphor, not Lucide.
 *
 * Same change as the website, same two reasons. The no-vibecoded-look rule
 * names "the default Lucide icon set dropped in unchanged", and every Lucide
 * glyph is a 2px open stroke - which, after the hairline ban took the lines
 * out of cards and chips, left the icons as the last place in the app still
 * drawing shapes out of thin strokes.
 *
 * Weight is assigned by what the glyph is: `fill` for anything depicting an
 * object or a state, `bold` for glyphs that are inherently a line - arrows,
 * carets, the tick, the close cross. Filling an arrow produces a blob.
 *
 * Every export is named after the Lucide icon it replaces, and both libraries
 * take the same `size` and `color` props, so the call sites did not change at
 * all. The names are a migration affordance, not a style: new code should
 * still import from here.
 *
 * Deep imports rather than the package barrel. Metro does not tree shake, so
 * importing `phosphor-react-native` directly would put all 1512 icons in the
 * bundle shipped to a phone.
 *
 * Sparkles, Star and Crown are deliberately absent, same as on the web.
 */
import * as React from "react";
import type { Icon as PhosphorIcon, IconProps, IconWeight } from "phosphor-react-native";

import { ArrowCounterClockwiseIcon as PArrowCounterClockwise } from "phosphor-react-native/src/icons/ArrowCounterClockwise";
import { ArrowDownRightIcon as PArrowDownRight } from "phosphor-react-native/src/icons/ArrowDownRight";
import { ArrowLeftIcon as PArrowLeft } from "phosphor-react-native/src/icons/ArrowLeft";
import { ArrowRightIcon as PArrowRight } from "phosphor-react-native/src/icons/ArrowRight";
import { ArrowSquareOutIcon as PArrowSquareOut } from "phosphor-react-native/src/icons/ArrowSquareOut";
import { ArrowUpRightIcon as PArrowUpRight } from "phosphor-react-native/src/icons/ArrowUpRight";
import { ArrowsClockwiseIcon as PArrowsClockwise } from "phosphor-react-native/src/icons/ArrowsClockwise";
import { BankIcon as PBank } from "phosphor-react-native/src/icons/Bank";
import { BellIcon as PBell } from "phosphor-react-native/src/icons/Bell";
import { BellRingingIcon as PBellRinging } from "phosphor-react-native/src/icons/BellRinging";
import { BellSlashIcon as PBellSlash } from "phosphor-react-native/src/icons/BellSlash";
import { BookmarkSimpleIcon as PBookmarkSimple } from "phosphor-react-native/src/icons/BookmarkSimple";
import { BooksIcon as PBooks } from "phosphor-react-native/src/icons/Books";
import { BroadcastIcon as PBroadcast } from "phosphor-react-native/src/icons/Broadcast";
import { BuildingsIcon as PBuildings } from "phosphor-react-native/src/icons/Buildings";
import { CalendarBlankIcon as PCalendarBlank } from "phosphor-react-native/src/icons/CalendarBlank";
import { CalendarPlusIcon as PCalendarPlus } from "phosphor-react-native/src/icons/CalendarPlus";
import { CaretDownIcon as PCaretDown } from "phosphor-react-native/src/icons/CaretDown";
import { CaretLeftIcon as PCaretLeft } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon as PCaretRight } from "phosphor-react-native/src/icons/CaretRight";
import { CaretUpIcon as PCaretUp } from "phosphor-react-native/src/icons/CaretUp";
import { ChartBarIcon as PChartBar } from "phosphor-react-native/src/icons/ChartBar";
import { ChartBarHorizontalIcon as PChartBarHorizontal } from "phosphor-react-native/src/icons/ChartBarHorizontal";
import { ChartLineIcon as PChartLine } from "phosphor-react-native/src/icons/ChartLine";
import { ChatIcon as PChat } from "phosphor-react-native/src/icons/Chat";
import { ChatCircleIcon as PChatCircle } from "phosphor-react-native/src/icons/ChatCircle";
import { CheckIcon as PCheck } from "phosphor-react-native/src/icons/Check";
import { CheckCircleIcon as PCheckCircle } from "phosphor-react-native/src/icons/CheckCircle";
import { ChecksIcon as PChecks } from "phosphor-react-native/src/icons/Checks";
import { CircleIcon as PCircle } from "phosphor-react-native/src/icons/Circle";
import { CircleNotchIcon as PCircleNotch } from "phosphor-react-native/src/icons/CircleNotch";
import { ClipboardTextIcon as PClipboardText } from "phosphor-react-native/src/icons/ClipboardText";
import { ClockIcon as PClock } from "phosphor-react-native/src/icons/Clock";
import { ClockCounterClockwiseIcon as PClockCounterClockwise } from "phosphor-react-native/src/icons/ClockCounterClockwise";
import { CoinsIcon as PCoins } from "phosphor-react-native/src/icons/Coins";
import { CompassIcon as PCompass } from "phosphor-react-native/src/icons/Compass";
import { CopyIcon as PCopy } from "phosphor-react-native/src/icons/Copy";
import { CreditCardIcon as PCreditCard } from "phosphor-react-native/src/icons/CreditCard";
import { CurrencyCircleDollarIcon as PCurrencyCircleDollar } from "phosphor-react-native/src/icons/CurrencyCircleDollar";
import { DiscIcon as PDisc } from "phosphor-react-native/src/icons/Disc";
import { DotsThreeIcon as PDotsThree } from "phosphor-react-native/src/icons/DotsThree";
import { DotsThreeVerticalIcon as PDotsThreeVertical } from "phosphor-react-native/src/icons/DotsThreeVertical";
import { DownloadSimpleIcon as PDownloadSimple } from "phosphor-react-native/src/icons/DownloadSimple";
import { EnvelopeIcon as PEnvelope } from "phosphor-react-native/src/icons/Envelope";
import { EyeIcon as PEye } from "phosphor-react-native/src/icons/Eye";
import { FastForwardIcon as PFastForward } from "phosphor-react-native/src/icons/FastForward";
import { FileTextIcon as PFileText } from "phosphor-react-native/src/icons/FileText";
import { FileVideoIcon as PFileVideo } from "phosphor-react-native/src/icons/FileVideo";
import { FilmSlateIcon as PFilmSlate } from "phosphor-react-native/src/icons/FilmSlate";
import { FingerprintIcon as PFingerprint } from "phosphor-react-native/src/icons/Fingerprint";
import { FireIcon as PFire } from "phosphor-react-native/src/icons/Fire";
import { FlagIcon as PFlag } from "phosphor-react-native/src/icons/Flag";
import { FloppyDiskIcon as PFloppyDisk } from "phosphor-react-native/src/icons/FloppyDisk";
import { GameControllerIcon as PGameController } from "phosphor-react-native/src/icons/GameController";
import { GavelIcon as PGavel } from "phosphor-react-native/src/icons/Gavel";
import { GearIcon as PGear } from "phosphor-react-native/src/icons/Gear";
import { GiftIcon as PGift } from "phosphor-react-native/src/icons/Gift";
import { GlobeIcon as PGlobe } from "phosphor-react-native/src/icons/Globe";
import { GoogleLogoIcon as PGoogleLogo } from "phosphor-react-native/src/icons/GoogleLogo";
import { HardDriveIcon as PHardDrive } from "phosphor-react-native/src/icons/HardDrive";
import { HeadphonesIcon as PHeadphones } from "phosphor-react-native/src/icons/Headphones";
import { HeartIcon as PHeart } from "phosphor-react-native/src/icons/Heart";
import { HouseIcon as PHouse } from "phosphor-react-native/src/icons/House";
import { ImageIcon as PImage } from "phosphor-react-native/src/icons/Image";
import { InfoIcon as PInfo } from "phosphor-react-native/src/icons/Info";
import { KeyIcon as PKey } from "phosphor-react-native/src/icons/Key";
import { ListIcon as PList } from "phosphor-react-native/src/icons/List";
import { ListChecksIcon as PListChecks } from "phosphor-react-native/src/icons/ListChecks";
import { LockIcon as PLock } from "phosphor-react-native/src/icons/Lock";
import { LockKeyOpenIcon as PLockKeyOpen } from "phosphor-react-native/src/icons/LockKeyOpen";
import { MagnifyingGlassIcon as PMagnifyingGlass } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { MapPinIcon as PMapPin } from "phosphor-react-native/src/icons/MapPin";
import { MedalIcon as PMedal } from "phosphor-react-native/src/icons/Medal";
import { MegaphoneIcon as PMegaphone } from "phosphor-react-native/src/icons/Megaphone";
import { MicrophoneStageIcon as PMicrophoneStage } from "phosphor-react-native/src/icons/MicrophoneStage";
import { MinusIcon as PMinus } from "phosphor-react-native/src/icons/Minus";
import { MoneyIcon as PMoney } from "phosphor-react-native/src/icons/Money";
import { MonitorPlayIcon as PMonitorPlay } from "phosphor-react-native/src/icons/MonitorPlay";
import { PackageIcon as PPackage } from "phosphor-react-native/src/icons/Package";
import { PaletteIcon as PPalette } from "phosphor-react-native/src/icons/Palette";
import { PaperPlaneTiltIcon as PPaperPlaneTilt } from "phosphor-react-native/src/icons/PaperPlaneTilt";
import { PauseIcon as PPause } from "phosphor-react-native/src/icons/Pause";
import { PencilSimpleIcon as PPencilSimple } from "phosphor-react-native/src/icons/PencilSimple";
import { PercentIcon as PPercent } from "phosphor-react-native/src/icons/Percent";
import { PhoneIcon as PPhone } from "phosphor-react-native/src/icons/Phone";
import { PiggyBankIcon as PPiggyBank } from "phosphor-react-native/src/icons/PiggyBank";
import { PlayIcon as PPlay } from "phosphor-react-native/src/icons/Play";
import { PlusIcon as PPlus } from "phosphor-react-native/src/icons/Plus";
import { PrinterIcon as PPrinter } from "phosphor-react-native/src/icons/Printer";
import { PushPinIcon as PPushPin } from "phosphor-react-native/src/icons/PushPin";
import { RecordIcon as PRecord } from "phosphor-react-native/src/icons/Record";
import { RepeatIcon as PRepeat } from "phosphor-react-native/src/icons/Repeat";
import { ScanIcon as PScan } from "phosphor-react-native/src/icons/Scan";
import { ScissorsIcon as PScissors } from "phosphor-react-native/src/icons/Scissors";
import { ScrollIcon as PScroll } from "phosphor-react-native/src/icons/Scroll";
import { SealCheckIcon as PSealCheck } from "phosphor-react-native/src/icons/SealCheck";
import { ShareNetworkIcon as PShareNetwork } from "phosphor-react-native/src/icons/ShareNetwork";
import { ShieldIcon as PShield } from "phosphor-react-native/src/icons/Shield";
import { ShieldCheckIcon as PShieldCheck } from "phosphor-react-native/src/icons/ShieldCheck";
import { ShieldSlashIcon as PShieldSlash } from "phosphor-react-native/src/icons/ShieldSlash";
import { ShieldWarningIcon as PShieldWarning } from "phosphor-react-native/src/icons/ShieldWarning";
import { ShoppingBagIcon as PShoppingBag } from "phosphor-react-native/src/icons/ShoppingBag";
import { ShoppingCartIcon as PShoppingCart } from "phosphor-react-native/src/icons/ShoppingCart";
import { SignInIcon as PSignIn } from "phosphor-react-native/src/icons/SignIn";
import { SignOutIcon as PSignOut } from "phosphor-react-native/src/icons/SignOut";
import { SlidersHorizontalIcon as PSlidersHorizontal } from "phosphor-react-native/src/icons/SlidersHorizontal";
import { SpeakerHighIcon as PSpeakerHigh } from "phosphor-react-native/src/icons/SpeakerHigh";
import { SpeakerXIcon as PSpeakerX } from "phosphor-react-native/src/icons/SpeakerX";
import { SquareIcon as PSquare } from "phosphor-react-native/src/icons/Square";
import { SquaresFourIcon as PSquaresFour } from "phosphor-react-native/src/icons/SquaresFour";
import { StackSimpleIcon as PStackSimple } from "phosphor-react-native/src/icons/StackSimple";
import { StarIcon as PStar } from "phosphor-react-native/src/icons/Star";
import { StorefrontIcon as PStorefront } from "phosphor-react-native/src/icons/Storefront";
import { TagIcon as PTag } from "phosphor-react-native/src/icons/Tag";
import { TargetIcon as PTarget } from "phosphor-react-native/src/icons/Target";
import { TelevisionIcon as PTelevision } from "phosphor-react-native/src/icons/Television";
import { ThumbsDownIcon as PThumbsDown } from "phosphor-react-native/src/icons/ThumbsDown";
import { ThumbsUpIcon as PThumbsUp } from "phosphor-react-native/src/icons/ThumbsUp";
import { ToggleLeftIcon as PToggleLeft } from "phosphor-react-native/src/icons/ToggleLeft";
import { TrashIcon as PTrash } from "phosphor-react-native/src/icons/Trash";
import { TreeStructureIcon as PTreeStructure } from "phosphor-react-native/src/icons/TreeStructure";
import { TrendUpIcon as PTrendUp } from "phosphor-react-native/src/icons/TrendUp";
import { TrophyIcon as PTrophy } from "phosphor-react-native/src/icons/Trophy";
import { TruckIcon as PTruck } from "phosphor-react-native/src/icons/Truck";
import { UploadSimpleIcon as PUploadSimple } from "phosphor-react-native/src/icons/UploadSimple";
import { UserIcon as PUser } from "phosphor-react-native/src/icons/User";
import { UserCheckIcon as PUserCheck } from "phosphor-react-native/src/icons/UserCheck";
import { UserGearIcon as PUserGear } from "phosphor-react-native/src/icons/UserGear";
import { UserMinusIcon as PUserMinus } from "phosphor-react-native/src/icons/UserMinus";
import { UserPlusIcon as PUserPlus } from "phosphor-react-native/src/icons/UserPlus";
import { UsersIcon as PUsers } from "phosphor-react-native/src/icons/Users";
import { VideoCameraIcon as PVideoCamera } from "phosphor-react-native/src/icons/VideoCamera";
import { WalletIcon as PWallet } from "phosphor-react-native/src/icons/Wallet";
import { WarningIcon as PWarning } from "phosphor-react-native/src/icons/Warning";
import { WarningCircleIcon as PWarningCircle } from "phosphor-react-native/src/icons/WarningCircle";
import { WifiHighIcon as PWifiHigh } from "phosphor-react-native/src/icons/WifiHigh";
import { WifiSlashIcon as PWifiSlash } from "phosphor-react-native/src/icons/WifiSlash";
import { WrenchIcon as PWrench } from "phosphor-react-native/src/icons/Wrench";
import { XIcon as PX } from "phosphor-react-native/src/icons/X";
import { XCircleIcon as PXCircle } from "phosphor-react-native/src/icons/XCircle";

export type { IconProps };

/** The shape a component must have to be used as an icon in a config object. */
export type Icon = PhosphorIcon;

function make(Base: PhosphorIcon, weight: IconWeight): PhosphorIcon {
  // `weight` before the spread, so a call site can still override it.
  return function Wrapped(props: IconProps) {
    return <Base weight={weight} {...props} />;
  };
}

export const AlertCircle = make(PWarningCircle, "fill");
export const AlertTriangle = make(PWarning, "fill");
export const ArrowDownRight = make(PArrowDownRight, "bold");
export const ArrowLeft = make(PArrowLeft, "bold");
export const ArrowRight = make(PArrowRight, "bold");
export const ArrowUpRight = make(PArrowUpRight, "bold");
export const Award = make(PMedal, "fill");
export const BadgeCheck = make(PSealCheck, "fill");
export const Banknote = make(PMoney, "fill");
export const BarChart3 = make(PChartBar, "fill");
export const Bell = make(PBell, "fill");
export const BellOff = make(PBellSlash, "fill");
export const BellRing = make(PBellRinging, "fill");
export const Bookmark = make(PBookmarkSimple, "fill");
export const BookmarkCheck = make(PBookmarkSimple, "fill");
export const BookmarkPlus = make(PBookmarkSimple, "fill");
export const Building2 = make(PBuildings, "fill");
export const Calendar = make(PCalendarBlank, "fill");
export const CalendarClock = make(PCalendarBlank, "fill");
export const CalendarPlus = make(PCalendarPlus, "fill");
export const CalendarRange = make(PCalendarBlank, "fill");
export const ChartColumn = make(PChartBar, "fill");
export const Check = make(PCheck, "bold");
export const CheckCheck = make(PChecks, "bold");
export const CheckCircle2 = make(PCheckCircle, "fill");
export const ChevronDown = make(PCaretDown, "bold");
export const ChevronLeft = make(PCaretLeft, "bold");
export const ChevronRight = make(PCaretRight, "bold");
export const ChevronUp = make(PCaretUp, "bold");
export const ChromeIcon = make(PGoogleLogo, "fill");
export const Circle = make(PCircle, "fill");
export const CircleDollarSign = make(PCurrencyCircleDollar, "fill");
export const CircleDot = make(PRecord, "fill");
export const Clapperboard = make(PFilmSlate, "fill");
export const ClipboardList = make(PClipboardText, "fill");
export const Clock = make(PClock, "fill");
export const ClockIcon = make(PClock, "fill");
export const Coins = make(PCoins, "fill");
export const Compass = make(PCompass, "fill");
export const Copy = make(PCopy, "bold");
export const CreditCard = make(PCreditCard, "fill");
export const Disc = make(PDisc, "fill");
export const Download = make(PDownloadSimple, "bold");
export const Edit = make(PPencilSimple, "fill");
export const ExternalLink = make(PArrowSquareOut, "bold");
export const Eye = make(PEye, "fill");
export const FileText = make(PFileText, "fill");
export const FileVideo = make(PFileVideo, "fill");
export const Film = make(PFilmSlate, "fill");
export const Fingerprint = make(PFingerprint, "bold");
export const Flag = make(PFlag, "fill");
export const Flame = make(PFire, "fill");
export const Forward = make(PFastForward, "fill");
export const Gamepad2 = make(PGameController, "fill");
export const Gavel = make(PGavel, "fill");
export const Gift = make(PGift, "fill");
export const Globe = make(PGlobe, "fill");
export const HardDrive = make(PHardDrive, "fill");
export const Headphones = make(PHeadphones, "fill");
export const Heart = make(PHeart, "fill");
export const History = make(PClockCounterClockwise, "bold");
export const Home = make(PHouse, "fill");
export const Image = make(PImage, "fill");
export const Info = make(PInfo, "fill");
export const Key = make(PKey, "fill");
export const KeyRound = make(PKey, "fill");
export const Landmark = make(PBank, "fill");
export const Layers = make(PStackSimple, "fill");
export const LayoutDashboard = make(PSquaresFour, "fill");
export const LayoutGrid = make(PSquaresFour, "fill");
export const Library = make(PBooks, "fill");
export const LineChart = make(PChartLine, "fill");
export const ListChecks = make(PListChecks, "fill");
export const ListTree = make(PTreeStructure, "bold");
export const Loader2 = make(PCircleNotch, "bold");
export const Lock = make(PLock, "fill");
export const LogIn = make(PSignIn, "bold");
export const LogOut = make(PSignOut, "bold");
export const Mail = make(PEnvelope, "fill");
export const MapPin = make(PMapPin, "fill");
export const Medal = make(PMedal, "fill");
export const Megaphone = make(PMegaphone, "fill");
export const Menu = make(PList, "bold");
export const MessageCircle = make(PChatCircle, "fill");
export const MessageSquare = make(PChat, "fill");
export const Mic2 = make(PMicrophoneStage, "fill");
export const Minus = make(PMinus, "bold");
export const MonitorPlay = make(PMonitorPlay, "fill");
export const MoreHorizontal = make(PDotsThree, "bold");
export const MoreVertical = make(PDotsThreeVertical, "bold");
export const Package = make(PPackage, "fill");
export const Palette = make(PPalette, "fill");
export const Pause = make(PPause, "fill");
export const Pencil = make(PPencilSimple, "fill");
export const PercentCircle = make(PPercent, "bold");
export const Phone = make(PPhone, "fill");
export const PiggyBank = make(PPiggyBank, "fill");
export const Pin = make(PPushPin, "fill");
export const Play = make(PPlay, "fill");
export const Plus = make(PPlus, "bold");
export const Printer = make(PPrinter, "fill");
export const Radio = make(PBroadcast, "bold");
export const RefreshCw = make(PArrowsClockwise, "bold");
export const Repeat = make(PRepeat, "bold");
export const RotateCcw = make(PArrowCounterClockwise, "bold");
export const Save = make(PFloppyDisk, "fill");
export const ScanLine = make(PScan, "bold");
export const Scissors = make(PScissors, "fill");
export const ScrollText = make(PScroll, "fill");
export const Search = make(PMagnifyingGlass, "bold");
export const Send = make(PPaperPlaneTilt, "fill");
export const Settings = make(PGear, "fill");
export const Share2 = make(PShareNetwork, "fill");
export const Shield = make(PShield, "fill");
export const ShieldAlert = make(PShieldWarning, "fill");
export const ShieldBan = make(PShieldSlash, "fill");
export const ShieldCheck = make(PShieldCheck, "fill");
export const ShieldOff = make(PShieldSlash, "fill");
export const ShoppingBag = make(PShoppingBag, "fill");
export const ShoppingCart = make(PShoppingCart, "fill");
export const SlidersHorizontal = make(PSlidersHorizontal, "bold");
export const Square = make(PSquare, "bold");
export const Star = make(PStar, "fill");
export const Store = make(PStorefront, "fill");
export const Tags = make(PTag, "fill");
export const Target = make(PTarget, "fill");
export const ThumbsDown = make(PThumbsDown, "fill");
export const ThumbsUp = make(PThumbsUp, "fill");
export const ToggleLeft = make(PToggleLeft, "fill");
export const Trash2 = make(PTrash, "fill");
export const TrendingUp = make(PTrendUp, "bold");
export const Trophy = make(PTrophy, "fill");
export const Truck = make(PTruck, "fill");
export const Tv = make(PTelevision, "fill");
export const Tv2 = make(PTelevision, "fill");
export const Unlock = make(PLockKeyOpen, "fill");
export const Upload = make(PUploadSimple, "bold");
export const User = make(PUser, "fill");
export const UserCheck = make(PUserCheck, "fill");
export const UserCog = make(PUserGear, "fill");
export const UserPlus = make(PUserPlus, "fill");
export const UserRound = make(PUser, "fill");
export const Users = make(PUsers, "fill");
export const UserX = make(PUserMinus, "fill");
export const Video = make(PVideoCamera, "fill");
export const Volume2 = make(PSpeakerHigh, "fill");
export const VolumeX = make(PSpeakerX, "fill");
export const Vote = make(PChartBarHorizontal, "fill");
export const Wallet = make(PWallet, "fill");
export const Wifi = make(PWifiHigh, "bold");
export const WifiOff = make(PWifiSlash, "bold");
export const Wrench = make(PWrench, "fill");
export const X = make(PX, "bold");
export const XCircle = make(PXCircle, "fill");
