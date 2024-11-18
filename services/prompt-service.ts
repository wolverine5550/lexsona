import { createClient } from '@/utils/supabase/client';
import {
  promptTemplates,
  getLatestPromptVersion
} from '@/utils/prompt-templates';
import type { PromptTemplate, PromptVersion } from '@/types/prompt';

/**
 * Service for managing prompt templates and their versions
 */
export class PromptService {
  /**
   * Stores a new prompt template version in the database
   * @param template - The prompt template to store
   * @returns The stored template ID
   */
  static async storeTemplate(template: PromptTemplate): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        version: template.version,
        template: template.template,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing prompt template:', error);
      throw new Error('Failed to store prompt template');
    }

    return data.id;
  }

  /**
   * Retrieves a prompt template by version
   * @param version - The version to retrieve
   * @returns The prompt template
   */
  static async getTemplate(version: PromptVersion): Promise<PromptTemplate> {
    // First check in-memory templates
    if (promptTemplates[version]) {
      return promptTemplates[version];
    }

    // If not found, check database
    const supabase = createClient();
    const { data, error } = await supabase
      .from('prompt_templates')
      .select()
      .eq('version', version)
      .single();

    if (error || !data) {
      console.error('Error fetching prompt template:', error);
      throw new Error(`Prompt template version ${version} not found`);
    }

    return {
      version: data.version as PromptVersion,
      template: data.template,
      validate: promptTemplates.v1.validate, // Use base validation
      format: promptTemplates.v1.format // Use base formatting
    };
  }

  /**
   * Gets the performance metrics for a prompt version
   * @param version - The version to analyze
   * @returns Performance metrics
   */
  static async getVersionMetrics(version: PromptVersion) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('prompt_metrics')
      .select(
        `
        success_rate,
        avg_relevance_score,
        total_uses,
        error_rate,
        avg_response_time
      `
      )
      .eq('version', version)
      .single();

    if (error) {
      console.error('Error fetching prompt metrics:', error);
      throw new Error('Failed to fetch prompt metrics');
    }

    return data;
  }

  /**
   * Records metrics for a prompt usage
   */
  static async recordMetrics(
    version: PromptVersion,
    metrics: {
      success: boolean;
      relevanceScore?: number;
      responseTime: number;
      error?: string;
    }
  ): Promise<void> {
    const supabase = createClient();

    // Create metrics record
    const metricsRecord = {
      version,
      success_rate: metrics.success ? 1 : 0,
      avg_relevance_score: metrics.relevanceScore || 0,
      total_uses: 1,
      error_rate: metrics.error ? 1 : 0,
      avg_response_time: metrics.responseTime,
      last_used_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('prompt_metrics')
      .upsert(metricsRecord, {
        onConflict: 'version'
      });

    if (error) {
      console.error('Error recording prompt metrics:', error);
      // Don't throw - metrics recording should not break main flow
    }
  }

  /**
   * Gets the recommended prompt version based on performance
   * @returns The recommended version
   */
  static async getRecommendedVersion(): Promise<PromptVersion> {
    const supabase = createClient();

    // Get metrics for all versions
    const { data, error } = await supabase
      .from('prompt_metrics')
      .select()
      .order('success_rate', { ascending: false })
      .order('avg_relevance_score', { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      // Fall back to latest version if no metrics
      return getLatestPromptVersion();
    }

    return data[0].version as PromptVersion;
  }
}
