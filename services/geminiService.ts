
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppEntry, AppStatus, AISynthesisStyle, AIMetadata, AIMemory, IconSuggestion } from "../types";

const MEMORY_KEY = 'deploymentHub.ai.memory.v3';

/**
 * AI AGENT ROUTER (CORE ARCHITECTURE)
 */
export const AI = {
  busy: false,
  
  memory: { 
    acceptedCount: 0, 
    rejectedCount: 0, 
    recentPrompts: [] 
  } as AIMemory,

  config: {
    model: 'gemini-3-flash-preview',
    imageModel: 'gemini-2.5-flash-image'
  },

  loadMemory() {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        this.memory = JSON.parse(saved);
      }
    } catch (e) {
      console.error("AI Memory Load Failure:", e);
    }
  },

  saveMemory() {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(this.memory));
    } catch (e) {
      console.error("AI Memory Save Failure:", e);
    }
  },

  trackAction(type: string, input: string) {
    this.memory.recentPrompts = [
      { type, input, timestamp: Date.now() }, 
      ...this.memory.recentPrompts
    ].slice(0, 20);
    this.saveMemory();
  },

  updateMemory(update: Partial<AIMemory>) {
    this.memory = { ...this.memory, ...update };
    this.saveMemory();
  },

  async callGemini(prompt: string, schema?: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const config: any = {
      responseMimeType: schema ? "application/json" : "text/plain",
    };
    if (schema) config.responseSchema = schema;

    const response = await ai.models.generateContent({
      model: this.config.model,
      contents: prompt,
      config
    });

    return response.text;
  },

  agents: {
    async smartSuggest(payload: { title: string; description: string; url: string; status: AppStatus; style: AISynthesisStyle }) {
      const prompt = `
        You are an ARCHITECT agent optimizing app metadata.
        Input:
        Title: ${payload.title}
        Description: ${payload.description}
        URL: ${payload.url}
        Status: ${payload.status}
        Style Preference: ${payload.style}

        Return STRICT JSON:
        {
          "title": "Improved Title",
          "description": "Improved professional description",
          "status": "LIVE|BETA|DRAFT",
          "tagline": "Short marketing tagline",
          "confidence": 0-100,
          "reasoning": "Why these changes help"
        }
      `;

      const schema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          status: { type: Type.STRING },
          tagline: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ["title", "description", "status", "tagline", "confidence", "reasoning"]
      };

      const result = await AI.callGemini(prompt, schema);
      return JSON.parse(result);
    },

    async validateApp(app: Partial<AppEntry>) {
      const prompt = `
        Perform a non-blocking analysis of this agent deployment. 
        Look for invalid URLs, weak descriptions, or mismatching status (e.g. LIVE with '#' URL).
        App: ${JSON.stringify(app)}
        Return JSON:
        {
          "readinessScore": 0-100,
          "warnings": ["Warning 1", "Warning 2"],
          "suggestedTags": ["tag1", "tag2"],
          "reasoning": "Quick summary of analysis"
        }
      `;
      const schema = {
        type: Type.OBJECT,
        properties: {
          readinessScore: { type: Type.NUMBER },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING }
        },
        required: ["readinessScore", "warnings", "suggestedTags", "reasoning"]
      };
      const result = await AI.callGemini(prompt, schema);
      return JSON.parse(result);
    },

    async iconSuggest(app: { title: string; description: string }) {
      const prompt = `
        Suggest icons for: ${app.title} - ${app.description}
        Return JSON:
        {
          "emojis": ["🚀", "⚡", "🤖"],
          "imagePrompt": "minimalist professional app icon, vector style, centered..."
        }
      `;
      const schema = {
        type: Type.OBJECT,
        properties: {
          emojis: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING }
        },
        required: ["emojis", "imagePrompt"]
      };
      const result = await AI.callGemini(prompt, schema);
      return JSON.parse(result) as IconSuggestion;
    }
  },

  async run(agentName: keyof typeof AI.agents, payload: any) {
    if (this.busy) throw new Error("AI is currently synthesizing another request.");
    this.busy = true;
    try {
      const agent = this.agents[agentName] as any;
      const result = await agent(payload);
      this.trackAction(agentName, payload.title || "Unknown");
      return result;
    } finally {
      this.busy = false;
    }
  }
};

AI.loadMemory();

export const generateAppIcon = async (prompt: string, style: AISynthesisStyle = 'Corporate'): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const stylePrompts: Record<AISynthesisStyle, string> = {
    'Cyberpunk': 'Neon lights, dark chrome, glitch aesthetics, high contrast, futuristic tech.',
    'Minimalist': 'Clean lines, Apple-style glassmorphism, white/soft gradients, professional.',
    '3D Render': 'Unreal Engine 5 style, soft shadows, 3D claymorphism or high-gloss plastic.',
    'Retro': '8-bit pixel art style, vibrant CRT scanlines, 90s tech aesthetic.',
    'Corporate': 'Vector illustration, flat design, trustworthy blue/grey tones, sleek.'
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A professional square app icon for: ${prompt}. Style: ${stylePrompts[style]}. Centered, high resolution, 1024x1024.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const hubTools: FunctionDeclaration[] = [
  {
    name: "add_app",
    parameters: {
      type: Type.OBJECT,
      description: "Deploy a new agent to the hub.",
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        url: { type: Type.STRING },
        status: { type: Type.STRING, enum: ["LIVE", "BETA", "DRAFT", "MAINTENANCE"] },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        iconEmoji: { type: Type.STRING },
        capabilities: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["title", "url", "description"]
    }
  },
  {
    name: "list_registry",
    parameters: {
      type: Type.OBJECT,
      description: "List all deployed agents in a file-manager style view.",
      properties: {}
    }
  },
  {
    name: "system_report",
    parameters: {
      type: Type.OBJECT,
      description: "Generate a detailed system health and diagnostics report.",
      properties: {}
    }
  },
  {
    name: "export_manifest",
    parameters: {
      type: Type.OBJECT,
      description: "Prepare a hub manifest for backup or archive.",
      properties: {}
    }
  },
  {
    name: "delete_app",
    parameters: {
      type: Type.OBJECT,
      description: "Decommission an agent by ID or title.",
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING }
      }
    }
  }
];

export const startAssistantChat = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are ARCHITECT, an elite agent orchestrator. You act as a high-performance File Manager and mission control. When asked for registry, files, or system health, use tools to provide rich data visualizations. Keep tone professional and technical.",
      tools: [{ functionDeclarations: hubTools }]
    }
  });
};
