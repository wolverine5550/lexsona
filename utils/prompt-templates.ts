import type {
  PromptTemplate,
  PromptVariables,
  PromptVersion
} from '@/types/prompt';

/**
 * Base system prompt that sets up the AI's role
 */
const SYSTEM_PROMPT = `You are a podcast recommendation expert. Your goal is to match users 
with podcasts based on their preferences. Focus on finding high-quality, well-produced shows 
that match the user's interests and preferences. Consider factors like topic relevance, 
show format, and episode length.`;

/**
 * Collection of prompt templates by version
 */
export const promptTemplates: Record<PromptVersion, PromptTemplate> = {
  v1: {
    version: 'v1',
    template: `${SYSTEM_PROMPT}

Find podcasts matching these preferences:
- Topics: {{topics}}
- Preferred Length: {{preferredLength}}
- Style Preferences:
  {{#stylePreferences}}
  - Interview Format: {{isInterviewPreferred}}
  - Storytelling Format: {{isStorytellingPreferred}}
  - Educational Content: {{isEducationalPreferred}}
  - Debate Format: {{isDebatePreferred}}
  {{/stylePreferences}}

Additional criteria:
- Minimum Listen Score: {{minListenScore}}
- Maximum Results: {{maxResults}}

Provide recommendations in JSON format with the following structure:
{
  "matches": [
    {
      "relevanceScore": number (0-100),
      "matchReason": string,
      "topicMatch": string[],
      "styleMatch": string[]
    }
  ]
}`,

    /**
     * Validates that all required variables are present and valid
     */
    validate: (variables: PromptVariables): boolean => {
      if (!variables.topics || variables.topics.length === 0) {
        throw new Error('Topics are required');
      }
      if (!variables.preferredLength) {
        throw new Error('Preferred length is required');
      }
      if (!variables.stylePreferences) {
        throw new Error('Style preferences are required');
      }
      return true;
    },

    /**
     * Formats the template with provided variables
     */
    format: (variables: PromptVariables): string => {
      const {
        topics,
        preferredLength,
        stylePreferences,
        maxResults = 5,
        minListenScore = 40
      } = variables;

      return promptTemplates.v1.template
        .replace('{{topics}}', topics.join(', '))
        .replace('{{preferredLength}}', preferredLength)
        .replace('{{#stylePreferences}}', '')
        .replace(
          '{{isInterviewPreferred}}',
          String(stylePreferences.isInterviewPreferred)
        )
        .replace(
          '{{isStorytellingPreferred}}',
          String(stylePreferences.isStorytellingPreferred)
        )
        .replace(
          '{{isEducationalPreferred}}',
          String(stylePreferences.isEducationalPreferred)
        )
        .replace(
          '{{isDebatePreferred}}',
          String(stylePreferences.isDebatePreferred)
        )
        .replace('{{/stylePreferences}}', '')
        .replace('{{maxResults}}', String(maxResults))
        .replace('{{minListenScore}}', String(minListenScore));
    }
  },

  v2: {
    // Future version template
    version: 'v2',
    template: '',
    validate: () => true,
    format: () => ''
  },

  v3: {
    // Future version template
    version: 'v3',
    template: '',
    validate: () => true,
    format: () => ''
  }
};

/**
 * Gets the latest prompt template version
 */
export function getLatestPromptVersion(): PromptVersion {
  return 'v1';
}

/**
 * Generates a prompt using the specified template version
 */
export function generatePrompt(
  variables: PromptVariables,
  version: PromptVersion = getLatestPromptVersion()
): string {
  const template = promptTemplates[version];
  if (!template) {
    throw new Error(`Invalid prompt version: ${version}`);
  }

  template.validate(variables);
  return template.format(variables);
}
