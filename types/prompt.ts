/**
 * Podcast matching prompt version
 * Used for tracking and updating prompt templates
 */
export type PromptVersion = 'v1' | 'v2' | 'v3';

/**
 * Variables that can be injected into prompt templates
 */
export interface PromptVariables {
  topics: string[];
  preferredLength: string;
  stylePreferences: {
    isInterviewPreferred: boolean;
    isStorytellingPreferred: boolean;
    isEducationalPreferred: boolean;
    isDebatePreferred: boolean;
  };
  maxResults?: number;
  minListenScore?: number;
}

/**
 * Prompt template with version and validation
 */
export interface PromptTemplate {
  version: PromptVersion;
  template: string;
  validate: (variables: PromptVariables) => boolean;
  format: (variables: PromptVariables) => string;
}

/**
 * Error thrown when prompt validation fails
 */
export class PromptValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptValidationError';
  }
}
