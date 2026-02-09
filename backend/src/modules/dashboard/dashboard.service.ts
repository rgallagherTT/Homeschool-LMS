import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { IRequestUser } from '../../common/interfaces/user.interface';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get dashboard statistics: total leads, open deals, pipeline value, open tickets.
   */
  async getStats(user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    // Count total leads
    const { count: totalLeads, error: leadsError } = await client
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsError) {
      throw new BadRequestException(
        `Failed to fetch leads count: ${leadsError.message}`,
      );
    }

    // Count open deals
    const { count: openDeals, error: dealsError } = await client
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (dealsError) {
      throw new BadRequestException(
        `Failed to fetch deals count: ${dealsError.message}`,
      );
    }

    // Sum pipeline value (open deals)
    const { data: openDealsData, error: pipelineError } = await client
      .from('deals')
      .select('amount')
      .eq('status', 'open');

    if (pipelineError) {
      throw new BadRequestException(
        `Failed to fetch pipeline value: ${pipelineError.message}`,
      );
    }

    const pipelineValue = (openDealsData || []).reduce(
      (sum, deal) => sum + (deal.amount || 0),
      0,
    );

    // Count open tickets
    const { count: openTickets, error: ticketsError } = await client
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (ticketsError) {
      throw new BadRequestException(
        `Failed to fetch tickets count: ${ticketsError.message}`,
      );
    }

    return {
      totalLeads: totalLeads || 0,
      openDeals: openDeals || 0,
      pipelineValue,
      openTickets: openTickets || 0,
    };
  }

  /**
   * Get pipeline summary: open deals grouped by stage with count and total amount.
   */
  async getPipelineSummary(user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data: deals, error } = await client
      .from('deals')
      .select('stage_id, amount')
      .eq('status', 'open');

    if (error) {
      throw new BadRequestException(
        `Failed to fetch pipeline summary: ${error.message}`,
      );
    }

    // Group by stage_id
    const stageMap = new Map<
      string,
      { stage: string; count: number; totalAmount: number }
    >();

    for (const deal of deals || []) {
      const stageId = deal.stage_id || 'unassigned';
      const existing = stageMap.get(stageId);

      if (existing) {
        existing.count += 1;
        existing.totalAmount += deal.amount || 0;
      } else {
        stageMap.set(stageId, {
          stage: stageId,
          count: 1,
          totalAmount: deal.amount || 0,
        });
      }
    }

    return Array.from(stageMap.values());
  }

  /**
   * Get the last 10 activities ordered by created_at desc.
   */
  async getRecentActivities(user: IRequestUser) {
    const client = this.supabaseService.getClientForUser(user.access_token);

    const { data, error } = await client
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new BadRequestException(
        `Failed to fetch recent activities: ${error.message}`,
      );
    }

    return data;
  }
}
