import { createClient } from '@/utils/supabase/client';
import type { PromptTemplate, PromptVersion } from '@/types/prompt';

export class PromptService {
  private static supabase = createClient();
  private static readonly TEMPLATES_TABLE = 'prompt_templates';
  private static readonly METRICS_TABLE = 'prompt_metrics';

  /**
   * Store a new template version
   */
  public static async storeTemplate(template: PromptTemplate): Promise<string> {
    const { data, error } = await this.supabase
      .from(this.TEMPLATES_TABLE)
      .insert({
        version: template.version,
        template: template.template,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to store template: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Retrieve a template by version
   */
  public static async getTemplate(
    version: PromptVersion
  ): Promise<PromptTemplate> {
    const { data, error } = await this.supabase
      .from(this.TEMPLATES_TABLE)
      .select()
      .eq('version', version)
      .single();

    if (error || !data) {
      throw new Error('Template not found');
    }

    return {
      version: data.version,
      template: data.template,
      validate: () => true,
      format: (vars) => data.template
    };
  }

  /**
   * Record metrics for a template version
   */
  public static async recordMetrics(
    version: PromptVersion,
    metrics: {
      success: boolean;
      relevanceScore: number;
      responseTime: number;
    }
  ): Promise<void> {
    const { error } = await this.supabase.from(this.METRICS_TABLE).insert({
      version,
      success: metrics.success,
      relevance_score: metrics.relevanceScore,
      response_time: metrics.responseTime,
      created_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(`Failed to record metrics: ${error.message}`);
    }
  }

  /**
   * Get aggregated metrics for a template version
   */
  public static async getVersionMetrics(version: PromptVersion): Promise<{
    version: string;
    success_rate: number;
    avg_relevance_score: number;
    total_uses: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.METRICS_TABLE)
      .select()
      .eq('version', version);

    if (error) {
      throw new Error(`Failed to get metrics: ${error.message}`);
    }

    const metrics = data || [];
    const totalUses = metrics.length;

    // Only count successful metrics
    const successfulMetrics = metrics.filter((m) => m.success);
    const successCount = successfulMetrics.length;

    // Calculate average from successful metrics only
    const totalRelevanceScore = successfulMetrics.reduce(
      (sum, m) => sum + (m.relevance_score || 0),
      0
    );

    return {
      version,
      success_rate: totalUses ? successCount / totalUses : 0,
      avg_relevance_score: successCount
        ? totalRelevanceScore / successCount
        : 0,
      total_uses: totalUses
    };
  }

  /**
   * Get the recommended template version based on performance
   */
  public static async getRecommendedVersion(): Promise<PromptVersion> {
    const { data, error } = await this.supabase
      .from(this.METRICS_TABLE)
      .select()
      .order('success_rate', { ascending: false })
      .limit(1);

    if (error || !data?.length) {
      throw new Error('Failed to get recommended version');
    }

    return data[0].version;
  }
}
