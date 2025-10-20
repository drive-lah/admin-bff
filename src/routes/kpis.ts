import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { APIResponse } from '../types/api';
import axios from 'axios';
import { config } from '../config/config';
import { UserRegistryService } from '../services/user-registry';

export const kpisRouter = Router();
const userRegistry = new UserRegistryService();

// GET /api/admin/kpis/team/:team/measurements - Get KPI measurements for a team
kpisRouter.get('/team/:team/measurements', asyncHandler(async (req, res) => {
  const { team } = req.params;
  const { start_date, end_date } = req.query;

  logger.info(`Fetching KPI measurements for team: ${team}`, { start_date, end_date });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/measurements/team/${team}`;
    const params: string[] = [];

    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for team KPIs: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Team KPI measurements retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch team KPI measurements from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      team,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve team KPI measurements',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/user/:userId/measurements - Get KPI measurements for a user
kpisRouter.get('/user/:userId/measurements', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { start_date, end_date } = req.query;

  logger.info(`Fetching KPI measurements for user: ${userId}`, { start_date, end_date });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/measurements/user/${userId}`;
    const params: string[] = [];

    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for user KPIs: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'User KPI measurements retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch user KPI measurements from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      userId,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve user KPI measurements',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/analysis/team/:team - Generate AI analysis for team KPIs
kpisRouter.get('/analysis/team/:team', asyncHandler(async (req, res) => {
  const { team } = req.params;
  const { weeks } = req.query;

  logger.info(`Generating AI analysis for team: ${team}`, { weeks: weeks || 12 });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/analysis/team/${team}`;
    if (weeks) {
      url += `?weeks=${weeks}`;
    }

    logger.info(`Calling monitor API for KPI analysis: ${url}`);

    const response = await axios.get(url, {
      timeout: 60000, // 60 seconds for AI generation
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Team KPI analysis generated successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to generate KPI analysis from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      team,
      weeks,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: error.response?.data?.message || 'Failed to generate KPI analysis',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/listings/breakdown - Get listings breakdown (organic vs team-attributed)
kpisRouter.get('/listings/breakdown', asyncHandler(async (req, res) => {
  const { weeks } = req.query;

  logger.info(`Fetching listings breakdown`, { weeks: weeks || 26 });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/listings/breakdown`;
    if (weeks) {
      url += `?weeks=${weeks}`;
    }

    logger.info(`Calling monitor API for listings breakdown: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listings breakdown retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listings breakdown from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      weeks,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listings breakdown',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/attributions/search - Search listing attributions
kpisRouter.get('/attributions/search', asyncHandler(async (req, res) => {
  const { listing_id, team_member_id, start_date, end_date, is_new_host, has_attribution, limit, offset } = req.query;

  logger.info(`Searching listing attributions`, {
    listing_id,
    team_member_id,
    start_date,
    end_date,
    is_new_host,
    has_attribution,
    limit: limit || 50,
    offset: offset || 0
  });

  try {
    // Build URL with query parameters
    let url = `${config.aiAgentsApiUrl}/api/monitor/kpis/attributions/search`;
    const params: string[] = [];

    if (listing_id) params.push(`listing_id=${listing_id}`);
    if (team_member_id) params.push(`team_member_id=${team_member_id}`);
    if (start_date) params.push(`start_date=${start_date}`);
    if (end_date) params.push(`end_date=${end_date}`);
    if (is_new_host) params.push(`is_new_host=${is_new_host}`);
    if (has_attribution) params.push(`has_attribution=${has_attribution}`);
    if (limit) params.push(`limit=${limit}`);
    if (offset) params.push(`offset=${offset}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    logger.info(`Calling monitor API for attribution search: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listing attributions retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listing attributions from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      listing_id,
      team_member_id,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listing attributions',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/attributions/:listingId - Get attribution details for a listing
kpisRouter.get('/attributions/:listingId', asyncHandler(async (req, res) => {
  const { listingId } = req.params;

  logger.info(`Fetching attribution details for listing: ${listingId}`);

  try {
    const url = `${config.aiAgentsApiUrl}/api/monitor/kpis/attributions/${listingId}`;

    logger.info(`Calling monitor API for attribution details: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const apiResponse: APIResponse = {
      data: response.data,
      message: 'Listing attribution details retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch listing attribution details from monitor API', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      listingId,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve listing attribution details',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));

// GET /api/admin/kpis/personal-dashboard - Get personalized KPI dashboard for logged-in user
// Supports ?user_id=X for super admins to view another user's dashboard
kpisRouter.get('/personal-dashboard', asyncHandler(async (req, res) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Unauthorized: User not authenticated',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // Check if super admin is viewing as another user
  const viewAsUserId = req.query.user_id ? parseInt(req.query.user_id as string) : null;
  const isSuperAdmin = user.email === process.env.GOOGLE_ADMIN_EMAIL;

  // Only super admins can view as another user
  if (viewAsUserId && !isSuperAdmin) {
    return res.status(403).json({
      error: {
        message: 'Forbidden: Only super admins can view other users\' dashboards',
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }

  // Determine which user's dashboard to fetch
  const targetUserId = viewAsUserId || user.userId;
  let targetUserName = user.name;
  let targetUserTeam = user.team;

  // If viewing as another user, fetch their details from database
  if (viewAsUserId && viewAsUserId !== user.userId) {
    logger.info(`Super admin ${user.email} viewing dashboard for user ${viewAsUserId}`);

    const targetUser = await userRegistry.getUserById(viewAsUserId);
    if (!targetUser) {
      return res.status(404).json({
        error: {
          message: `User with ID ${viewAsUserId} not found`,
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        },
      });
    }

    targetUserName = targetUser.name;
    // Get the first team from the teams array
    targetUserTeam = targetUser.teams && targetUser.teams.length > 0 ? targetUser.teams[0] : 'core';
    logger.info(`Viewing as user: ${targetUser.name} (${targetUser.email}), team: ${targetUserTeam}`);
  }

  const userId = targetUserId;
  const team = targetUserTeam;

  logger.info(`Fetching personal dashboard for user: ${userId}, team: ${team}`);

  try {
    // Calculate PREVIOUS COMPLETED week's date range (Monday to Sunday)
    // Always show the last fully completed week, not the current partial week
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Calculate days back to last week's Monday
    // Go back to this week's Monday, then back 7 more days for previous week
    const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToLastMonday = daysToThisMonday + 7;

    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6); // Last week's Sunday
    lastSunday.setHours(23, 59, 59, 999);

    const startDate = lastMonday.toISOString().split('T')[0];
    const endDate = lastSunday.toISOString().split('T')[0];

    logger.info(`Date range: ${startDate} to ${endDate}`);

    // Fetch team KPI measurements for last week
    const teamUrl = `${config.aiAgentsApiUrl}/api/monitor/kpis/measurements/team/${team}?start_date=${startDate}&end_date=${endDate}`;

    logger.info(`Calling monitor API for team KPIs: ${teamUrl}`);

    const teamResponse = await axios.get(teamUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Drivelah-Admin-BFF/1.0.0',
      },
    });

    const teamData = teamResponse.data;

    // Process team data to calculate rankings and comparisons
    interface UserStats {
      userId: number;
      userName: string;
      userEmail: string;
      totalAchievement: number;
      kpiCount: number;
      averageAchievement: number;
      kpis: any[];
    }

    const userStatsMap = new Map<number, UserStats>();

    // Aggregate data by user
    if (teamData.users && Array.isArray(teamData.users)) {
      teamData.users.forEach((userData: any) => {
        const userIdNum = userData.user_id;
        let totalAchievement = 0;
        let kpiCount = 0;
        const userKpis: any[] = [];

        if (userData.kpis && Array.isArray(userData.kpis)) {
          // Use a Map to deduplicate KPIs by name (keep only the latest measurement)
          const kpiMap = new Map<string, any>();

          userData.kpis.forEach((kpiData: any) => {
            if (kpiData.measurements && Array.isArray(kpiData.measurements) && kpiData.measurements.length > 0) {
              // Take the last measurement (most recent) for this KPI
              const latestMeasurement = kpiData.measurements[kpiData.measurements.length - 1];

              // Only add if we haven't seen this KPI name yet, or if this is a more complete record
              if (!kpiMap.has(kpiData.kpi_name)) {
                kpiMap.set(kpiData.kpi_name, {
                  kpiName: kpiData.kpi_name,
                  actualValue: latestMeasurement.actual_value,
                  targetValue: latestMeasurement.target_value,
                  achievementPercentage: latestMeasurement.achievement_percentage,
                  unit: latestMeasurement.unit,
                  targetType: latestMeasurement.target_type,
                });
              }
            }
          });

          // Convert map to array and calculate totals
          const deduplicatedKpis = Array.from(kpiMap.values());
          deduplicatedKpis.forEach(kpi => {
            totalAchievement += kpi.achievementPercentage || 0;
            kpiCount++;
            userKpis.push(kpi);
          });
        }

        if (kpiCount > 0) {
          userStatsMap.set(userIdNum, {
            userId: userIdNum,
            userName: userData.user_name,
            userEmail: userData.user_email,
            totalAchievement,
            kpiCount,
            averageAchievement: totalAchievement / kpiCount,
            kpis: userKpis,
          });
        }
      });
    }

    // Sort users by average achievement to determine ranking
    const rankedUsers = Array.from(userStatsMap.values()).sort(
      (a, b) => b.averageAchievement - a.averageAchievement
    );

    // Find current user's data and rank
    const currentUserStats = userStatsMap.get(userId);
    const userRank = rankedUsers.findIndex(u => u.userId === userId) + 1;
    const totalTeamMembers = rankedUsers.length;

    if (!currentUserStats) {
      return res.json({
        data: {
          user: {
            id: userId,
            name: targetUserName,
            team: team,
          },
          period: {
            start: startDate,
            end: endDate,
          },
          summary: {
            overallAchievement: 0,
            teamRank: 0,
            totalTeamMembers: totalTeamMembers,
            percentile: 0,
          },
          kpis: [],
          message: 'No KPI data available for last week',
        },
        message: 'Personal dashboard data retrieved (no data for last week)',
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate percentile
    const percentile = userRank > 0 ? Math.round((1 - (userRank - 1) / totalTeamMembers) * 100) : 0;

    // Calculate team averages for each KPI
    interface KPIAggregate {
      kpiName: string;
      unit?: string;
      targetType?: string;
      totalValue: number;
      count: number;
      avgValue: number;
    }

    const kpiAggregates = new Map<string, KPIAggregate>();

    rankedUsers.forEach(userStat => {
      userStat.kpis.forEach(kpi => {
        const existing = kpiAggregates.get(kpi.kpiName);
        if (existing) {
          existing.totalValue += kpi.actualValue;
          existing.count++;
          existing.avgValue = existing.totalValue / existing.count;
        } else {
          kpiAggregates.set(kpi.kpiName, {
            kpiName: kpi.kpiName,
            unit: kpi.unit,
            targetType: kpi.targetType,
            totalValue: kpi.actualValue,
            count: 1,
            avgValue: kpi.actualValue,
          });
        }
      });
    });

    // Build KPI comparisons for current user
    const kpiComparisons = currentUserStats.kpis.map(kpi => {
      const teamAvg = kpiAggregates.get(kpi.kpiName);
      const teamAvgValue = teamAvg ? teamAvg.avgValue : kpi.actualValue;

      // Calculate percentage difference
      // For lower_is_better KPIs, invert the calculation so being below team average is positive (good)
      let percentVsTeam = 0;
      if (teamAvgValue !== 0) {
        const targetType = kpi.targetType || 'higher_is_better';
        if (targetType === 'lower_better' || targetType === 'lower_is_better') {
          // For lower_is_better: being below team average is better (positive)
          percentVsTeam = ((teamAvgValue - kpi.actualValue) / teamAvgValue) * 100;
        } else {
          // For higher_is_better: being above team average is better (positive)
          percentVsTeam = ((kpi.actualValue - teamAvgValue) / teamAvgValue) * 100;
        }
      }

      // Determine status based on achievement percentage
      let status = 'good';
      if (kpi.achievementPercentage >= 100) {
        status = 'excellent';
      } else if (kpi.achievementPercentage < 80) {
        status = 'needs-attention';
      }

      return {
        kpiName: kpi.kpiName,
        unit: kpi.unit || '',
        targetType: kpi.targetType || 'higher_is_better',
        yourValue: kpi.actualValue,
        yourAchievement: kpi.achievementPercentage,
        teamAverage: teamAvgValue,
        target: kpi.targetValue,
        percentVsTeam: Math.round(percentVsTeam * 10) / 10,
        status,
      };
    });

    const apiResponse: APIResponse = {
      data: {
        user: {
          id: userId,
          name: targetUserName,
          team: team,
        },
        period: {
          start: startDate,
          end: endDate,
        },
        summary: {
          overallAchievement: Math.round(currentUserStats.averageAchievement * 10) / 10,
          teamRank: userRank,
          totalTeamMembers: totalTeamMembers,
          percentile: percentile,
        },
        kpis: kpiComparisons,
      },
      message: 'Personal dashboard data retrieved successfully',
      timestamp: new Date().toISOString(),
    };

    res.json(apiResponse);

  } catch (error: any) {
    logger.error('Failed to fetch personal dashboard data', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      userId,
      team,
    });

    res.status(error.response?.status || 500).json({
      error: {
        message: 'Failed to retrieve personal dashboard data',
        statusCode: error.response?.status || 500,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      },
    });
  }
}));
