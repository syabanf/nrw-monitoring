import {
  createIcons,
  LayoutDashboard, Map as MapIcon, Hexagon, ClipboardList, RadioTower, TriangleAlert, BarChart3,
  RefreshCw, Search, Bell, X, Check, Plus, Download, ArrowRight, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus,
  Droplet, Banknote, Activity, Gauge, Wifi, WifiOff, Battery,
  Camera, MapPin, FileText, CircleAlert, AlertOctagon, Info,
  Settings, Filter, Calendar, Eye, FileBarChart, Waves, ArrowUpRight,
  Pencil, Trash2, Save, CirclePlus, PenLine,
  Clock, User, Users, ListChecks, Cpu, MessageSquare, Paperclip, Send,
  CalendarDays, Briefcase, Network, Hammer, Bookmark, Star, MoreHorizontal,
  History, Layers, Printer, Building2, Home, ShieldCheck, ChartPie, ChartLine, PanelLeft,
  Sun, Moon, Square, Triangle, Circle as CircleIcon,
  EyeOff, LogOut, LogIn, Lock, Mail, KeyRound
} from 'lucide';

const icons = {
  LayoutDashboard, Map: MapIcon, Hexagon, ClipboardList, RadioTower, TriangleAlert, BarChart3,
  RefreshCw, Search, Bell, X, Check, Plus, Download, ArrowRight, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus,
  Droplet, Banknote, Activity, Gauge, Wifi, WifiOff, Battery,
  Camera, MapPin, FileText, CircleAlert, AlertOctagon, Info,
  Settings, Filter, Calendar, Eye, FileBarChart, Waves, ArrowUpRight,
  Pencil, Trash2, Save, CirclePlus, PenLine,
  Clock, User, Users, ListChecks, Cpu, MessageSquare, Paperclip, Send,
  CalendarDays, Briefcase, Network, Hammer, Bookmark, Star, MoreHorizontal,
  History, Layers, Printer, Building2, Home, ShieldCheck,
  Sun, Moon, Square, Triangle, Circle: CircleIcon,
  EyeOff, LogOut, LogIn, Lock, Mail, KeyRound
};

export function renderIcons() {
  createIcons({ icons, attrs: { 'stroke-width': 1.8 } });
}

export function icon(name, classes = 'w-4 h-4') {
  return `<i data-lucide="${name}" class="${classes}"></i>`;
}
