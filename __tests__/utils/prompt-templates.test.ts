import { describe, it, expect } from 'vitest';
import {
  generatePrompt,
  getLatestPromptVersion,
  promptTemplates
} from '@/utils/prompt-templates';

import type { PromptVariables } from '@/types/prompt';

describe('Prompt Templates', () => {
  // Sample valid preferences for testing
  const validVariables: PromptVariables = {
    topics: ['technology', 'science'],
    preferredLength: 'medium',
    stylePreferences: {
      isInterviewPreferred: true,
      isStorytellingPreferred: false,
      isEducationalPreferred: true,
      isDebatePreferred: false
    },
    maxResults: 5,
    minListenScore: 40
  };

  describe('Template Validation', () => {
    it('should validate complete variables', () => {
      expect(() => {
        promptTemplates.v1.validate(validVariables);
      }).not.toThrow();
    });

    it('should reject empty topics', () => {
      const invalidVars = {
        ...validVariables,
        topics: []
      };

      expect(() => {
        promptTemplates.v1.validate(invalidVars);
      }).toThrow('Topics are required');
    });

    it('should reject missing length preference', () => {
      const invalidVars = {
        ...validVariables,
        preferredLength: undefined
      };

      expect(() => {
        promptTemplates.v1.validate(invalidVars as any);
      }).toThrow('Preferred length is required');
    });
  });

  describe('Template Formatting', () => {
    it('should format template with variables', () => {
      const formatted = promptTemplates.v1.format(validVariables);

      // Check if all variables are properly inserted
      expect(formatted).toContain('technology, science');
      expect(formatted).toContain('medium');
      expect(formatted).toContain('true'); // isInterviewPreferred
      expect(formatted).toContain('false'); // isStorytellingPreferred
    });

    it('should use default values for optional variables', () => {
      const minimalVars = {
        topics: ['technology'],
        preferredLength: 'short',
        stylePreferences: {
          isInterviewPreferred: true,
          isStorytellingPreferred: false,
          isEducationalPreferred: false,
          isDebatePreferred: false
        }
      };

      const formatted = promptTemplates.v1.format(minimalVars);

      // Check if default values are used
      expect(formatted).toContain('Maximum Results: 5');
      expect(formatted).toContain('Minimum Listen Score: 40');
    });
  });

  describe('Prompt Generation', () => {
    it('should generate prompt with latest version by default', () => {
      const prompt = generatePrompt(validVariables);
      const latestVersion = getLatestPromptVersion();

      // Verify prompt contains template elements
      expect(prompt).toContain('podcast recommendation expert');
      expect(prompt).toContain(validVariables.topics.join(', '));
    });

    it('should generate prompt with specific version', () => {
      const prompt = generatePrompt(validVariables, 'v1');

      // Verify v1 specific elements
      expect(prompt).toContain('Find podcasts matching these preferences');
      expect(prompt).toContain('JSON format');
    });

    it('should throw error for invalid version', () => {
      expect(() => {
        generatePrompt(validVariables, 'invalid' as any);
      }).toThrow('Invalid prompt version');
    });
  });

  describe('Version Management', () => {
    it('should return valid latest version', () => {
      const latest = getLatestPromptVersion();
      expect(promptTemplates[latest]).toBeDefined();
    });

    it('should have consistent template structure across versions', () => {
      Object.entries(promptTemplates).forEach(([version, template]) => {
        expect(template).toHaveProperty('version', version);
        expect(template).toHaveProperty('template');
        expect(template).toHaveProperty('validate');
        expect(template).toHaveProperty('format');
      });
    });
  });
});
