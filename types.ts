
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ReportSection {
  heading: string;
  body: string;
  keyInsights: string[];
  citedSourceIndices: number[];
}

export interface StructuredReport {
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
  keyDataPoints: { label: string; value: string }[];
  technicalConfidence: number;
}

export interface ResearchSubTopic {
  id: string;
  query: string;
  status: 'pending' | 'searching' | 'completed' | 'failed';
  findings?: string;
  sources: GroundingChunk[];
}

export interface ResearchProject {
  id: string;
  topic: string;
  timestamp: number;
  subTopics: ResearchSubTopic[];
  structuredReport?: StructuredReport;
  confidenceScore: number;
  status: 'idle' | 'analyzing' | 'searching' | 'synthesizing' | 'completed';
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
}
