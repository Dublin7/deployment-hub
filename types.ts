
export type AppStatus = 'LIVE' | 'BETA' | 'DRAFT' | 'MAINTENANCE';
export type AISynthesisStyle = 'Cyberpunk' | 'Minimalist' | '3D Render' | 'Retro' | 'Corporate';

export interface AIMetadata {
  readinessScore: number;
  warnings: string[];
  suggestedTags: string[];
  reasoning?: string;
  tagline?: string;
  confidence?: number;
}

export interface IconSuggestion {
  emojis: string[];
  imagePrompt: string;
}

export interface AIMemory {
  acceptedCount: number;
  rejectedCount: number;
  recentPrompts: { type: string; input: string; timestamp: number }[];
  lastSuggestions?: any;
}

export interface AppEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  status: AppStatus;
  iconType: 'emoji' | 'image' | 'ai-gen';
  iconValue: string; // Emoji char or Image URL
  tags: string[];
  capabilities: string[];
  createdAt: number;
  iconStyle?: AISynthesisStyle;
  lastSyncAt?: number;
  hasInternalInterface?: boolean;
  aiMetadata?: AIMetadata;
}

export interface HubConfig {
  theme: 'dark' | 'light';
  apps: AppEntry[];
}

export interface ChatRichContent {
  type: 'registry_list' | 'system_report' | 'file_preview' | 'tool_output';
  data: any;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  richContent?: ChatRichContent;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  neuralLinkStability: number;
  uptime: number;
  activeAgents: number;
}
