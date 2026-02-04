export interface JobAnalysisResult {
  isJobOffer: boolean;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  techStack?: string[];
  mainStack?: string;
}

export interface JobAnalyzer {
  analyze(content: string): Promise<JobAnalysisResult>;
}
