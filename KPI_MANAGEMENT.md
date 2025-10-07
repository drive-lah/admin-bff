# KPI Management System Documentation

## Overview

The KPI (Key Performance Indicator) Management System is a flexible, scalable solution for tracking and measuring employee performance across multiple teams and departments. The system supports various data sources, calculation methods, and provides real-time visibility into individual and team performance.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ User KPI    │  │ Manager     │  │ Admin Config     │   │
│  │ View        │  │ Team View   │  │ Panel            │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                    BFF API Layer (Express)                   │
│  - GET /kpis/definitions                                    │
│  - GET /users/:id/kpis                                      │
│  - POST /users/:id/kpis/assign                             │
│  - PUT /users/:id/kpis/:kpiId                              │
│  - GET /teams/:id/kpis                                      │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│              KPI Calculation Engine (Service)                │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Manual Entry │  │ Query        │  │ Formula         │  │
│  │ Handler      │  │ Calculator   │  │ Processor       │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Data Source Adapters                       │  │
│  │  - Database   - Intercom   - Aircall   - Custom    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Internal │  │ Intercom │  │ Aircall  │  │ Google   │  │
│  │ Database │  │ API      │  │ API      │  │ Workspace│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. kpi_definitions
Master table for defining KPI templates.

```sql
CREATE TABLE kpi_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'customer_support', 'sales', 'operations', etc.
  calculation_type VARCHAR(50) NOT NULL, -- 'manual', 'query', 'api', 'formula'
  data_source JSONB, -- Flexible configuration for data sources
  unit VARCHAR(50), -- '%', 'count', 'hours', 'currency'
  aggregation_period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly'
  target_type VARCHAR(50), -- 'higher_better', 'lower_better', 'exact'
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. user_kpis
Links users to their assigned KPIs with targets.

```sql
CREATE TABLE user_kpis (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  kpi_definition_id INTEGER REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  target_value DECIMAL(10, 2), -- The goal to achieve
  weight DECIMAL(5, 2), -- Importance percentage (0-100)
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for ongoing KPIs
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, kpi_definition_id, start_date)
);
```

### 3. kpi_measurements
Stores actual KPI values over time.

```sql
CREATE TABLE kpi_measurements (
  id SERIAL PRIMARY KEY,
  user_kpi_id INTEGER REFERENCES user_kpis(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value DECIMAL(10, 2),
  target_value DECIMAL(10, 2), -- Snapshot of target at calculation time
  achievement_percentage DECIMAL(5, 2), -- (actual / target) * 100
  calculation_metadata JSONB, -- Store source data, timestamps, etc.
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by INTEGER REFERENCES users(id), -- NULL for automated
  notes TEXT,
  UNIQUE(user_kpi_id, period_start, period_end)
);

CREATE INDEX idx_kpi_measurements_user_period
  ON kpi_measurements(user_kpi_id, period_start, period_end);
```

### 4. kpi_snapshots
Historical snapshots for trend analysis.

```sql
CREATE TABLE kpi_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  snapshot_date DATE NOT NULL,
  overall_score DECIMAL(5, 2), -- Weighted average of all KPIs
  kpi_scores JSONB, -- Individual KPI scores for the period
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, snapshot_date)
);
```

## Data Source Configuration Examples

### Example 1: Database Query KPI
Resolution time for support cases.

```json
{
  "kpi_definition_id": 1,
  "name": "Average Resolution Time",
  "calculation_type": "query",
  "data_source": {
    "type": "database",
    "query": "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours FROM support_cases WHERE assigned_to = :user_id AND resolved_at >= :start_date AND resolved_at < :end_date",
    "parameters": ["user_id", "start_date", "end_date"]
  },
  "unit": "hours",
  "target_type": "lower_better"
}
```

### Example 2: External API KPI
Intercom response time.

```json
{
  "kpi_definition_id": 2,
  "name": "First Response Time",
  "calculation_type": "api",
  "data_source": {
    "type": "intercom",
    "endpoint": "conversations",
    "metric": "first_response_time",
    "filters": {
      "assignee_id": ":user_id",
      "created_at_after": ":start_date",
      "created_at_before": ":end_date"
    }
  },
  "unit": "minutes",
  "target_type": "lower_better"
}
```

### Example 3: Formula-Based KPI
Customer satisfaction score combining multiple sources.

```json
{
  "kpi_definition_id": 3,
  "name": "Customer Satisfaction Score",
  "calculation_type": "formula",
  "data_source": {
    "type": "formula",
    "formula": "(positive_ratings / total_ratings) * 100",
    "inputs": [
      {
        "variable": "positive_ratings",
        "source": {
          "type": "database",
          "query": "SELECT COUNT(*) FROM ratings WHERE user_id = :user_id AND rating >= 4 AND created_at >= :start_date AND created_at < :end_date"
        }
      },
      {
        "variable": "total_ratings",
        "source": {
          "type": "database",
          "query": "SELECT COUNT(*) FROM ratings WHERE user_id = :user_id AND created_at >= :start_date AND created_at < :end_date"
        }
      }
    ]
  },
  "unit": "%",
  "target_type": "higher_better"
}
```

### Example 4: Manual Entry KPI
Qualitative assessments by managers.

```json
{
  "kpi_definition_id": 4,
  "name": "Communication Quality",
  "calculation_type": "manual",
  "data_source": {
    "type": "manual",
    "allowed_range": {
      "min": 1,
      "max": 5
    }
  },
  "unit": "score",
  "target_type": "higher_better"
}
```

## API Endpoints

### KPI Definitions Management

#### GET /kpis/definitions
Get all KPI definitions (admin only).

```typescript
Response: {
  definitions: [
    {
      id: number,
      name: string,
      description: string,
      category: string,
      calculation_type: string,
      unit: string,
      aggregation_period: string,
      is_active: boolean
    }
  ]
}
```

#### POST /kpis/definitions
Create a new KPI definition (admin only).

```typescript
Request: {
  name: string,
  description: string,
  category: string,
  calculation_type: 'manual' | 'query' | 'api' | 'formula',
  data_source: object,
  unit: string,
  aggregation_period: string,
  target_type: string
}
```

### User KPI Assignment

#### GET /users/:userId/kpis
Get all KPIs assigned to a user.

```typescript
Response: {
  kpis: [
    {
      id: number,
      kpi_definition: {
        id: number,
        name: string,
        description: string,
        unit: string
      },
      target_value: number,
      weight: number,
      current_measurement: {
        actual_value: number,
        achievement_percentage: number,
        period_start: string,
        period_end: string
      },
      trend: number[] // Last 6 periods
    }
  ],
  overall_score: number
}
```

#### POST /users/:userId/kpis/assign
Assign a KPI to a user (manager/admin only).

```typescript
Request: {
  kpi_definition_id: number,
  target_value: number,
  weight: number,
  start_date: string
}
```

#### PUT /users/:userId/kpis/:kpiId
Update a user's KPI assignment.

```typescript
Request: {
  target_value?: number,
  weight?: number,
  end_date?: string,
  is_active?: boolean
}
```

### KPI Measurements

#### POST /users/:userId/kpis/:kpiId/measure
Record a manual KPI measurement.

```typescript
Request: {
  actual_value: number,
  period_start: string,
  period_end: string,
  notes?: string
}
```

#### GET /users/:userId/kpis/:kpiId/history
Get historical measurements for a KPI.

```typescript
Response: {
  measurements: [
    {
      period_start: string,
      period_end: string,
      actual_value: number,
      target_value: number,
      achievement_percentage: number,
      calculated_at: string
    }
  ]
}
```

### Team KPIs

#### GET /teams/:teamId/kpis
Get aggregated KPIs for a team.

```typescript
Response: {
  team_members: [
    {
      user_id: number,
      name: string,
      overall_score: number,
      kpis: [...]
    }
  ],
  team_averages: {
    overall_score: number,
    kpi_averages: object
  }
}
```

## Calculation Engine

### Service Structure

```typescript
// services/kpi-calculator.ts
class KPICalculator {
  async calculateKPI(
    userKpiId: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KPIMeasurement> {
    const userKpi = await this.getUserKPI(userKpiId);
    const definition = await this.getKPIDefinition(userKpi.kpi_definition_id);

    switch (definition.calculation_type) {
      case 'query':
        return this.calculateFromQuery(userKpi, definition, periodStart, periodEnd);
      case 'api':
        return this.calculateFromAPI(userKpi, definition, periodStart, periodEnd);
      case 'formula':
        return this.calculateFromFormula(userKpi, definition, periodStart, periodEnd);
      case 'manual':
        throw new Error('Manual KPIs cannot be auto-calculated');
    }
  }

  private async calculateFromQuery(
    userKpi: UserKPI,
    definition: KPIDefinition,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KPIMeasurement> {
    const query = definition.data_source.query;
    const params = {
      user_id: userKpi.user_id,
      start_date: periodStart,
      end_date: periodEnd
    };

    const result = await this.db.query(query, params);
    const actualValue = result.rows[0][Object.keys(result.rows[0])[0]];

    return this.createMeasurement(
      userKpi,
      actualValue,
      periodStart,
      periodEnd,
      { source: 'database', query, params }
    );
  }

  private async calculateFromAPI(
    userKpi: UserKPI,
    definition: KPIDefinition,
    periodStart: Date,
    periodEnd: Date
  ): Promise<KPIMeasurement> {
    const adapter = this.getDataSourceAdapter(definition.data_source.type);
    const actualValue = await adapter.fetch(
      userKpi.user_id,
      definition.data_source,
      periodStart,
      periodEnd
    );

    return this.createMeasurement(
      userKpi,
      actualValue,
      periodStart,
      periodEnd,
      { source: definition.data_source.type, fetched_at: new Date() }
    );
  }
}
```

### Data Source Adapters

```typescript
// services/data-sources/intercom-adapter.ts
class IntercomAdapter implements DataSourceAdapter {
  async fetch(
    userId: number,
    config: any,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const user = await this.getUserIntercomId(userId);
    const response = await intercomClient.conversations.list({
      assignee_id: user.intercom_id,
      created_at_after: periodStart.getTime() / 1000,
      created_at_before: periodEnd.getTime() / 1000
    });

    // Calculate metric based on config
    return this.calculateMetric(response, config.metric);
  }
}

// services/data-sources/aircall-adapter.ts
class AircallAdapter implements DataSourceAdapter {
  async fetch(
    userId: number,
    config: any,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const user = await this.getUserAircallId(userId);
    const calls = await aircallClient.getCalls({
      user_id: user.aircall_id,
      from: periodStart.toISOString(),
      to: periodEnd.toISOString()
    });

    return this.calculateMetric(calls, config.metric);
  }
}
```

## Scheduled Jobs

### Daily KPI Calculation

```typescript
// jobs/calculate-daily-kpis.ts
import cron from 'node-cron';

// Run at 2 AM every day
cron.schedule('0 2 * * *', async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active daily KPIs
  const dailyKPIs = await db.query(`
    SELECT uk.id, uk.user_id, kd.name
    FROM user_kpis uk
    JOIN kpi_definitions kd ON uk.kpi_definition_id = kd.id
    WHERE uk.is_active = true
      AND kd.is_active = true
      AND kd.aggregation_period = 'daily'
      AND kd.calculation_type != 'manual'
  `);

  for (const kpi of dailyKPIs.rows) {
    try {
      await kpiCalculator.calculateKPI(kpi.id, yesterday, today);
      console.log(`Calculated KPI ${kpi.name} for user ${kpi.user_id}`);
    } catch (error) {
      console.error(`Failed to calculate KPI ${kpi.id}:`, error);
    }
  }
});
```

### Weekly KPI Calculation

```typescript
// Run at 3 AM every Monday
cron.schedule('0 3 * * 1', async () => {
  const lastMonday = new Date();
  lastMonday.setDate(lastMonday.getDate() - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const thisMonday = new Date();
  thisMonday.setHours(0, 0, 0, 0);

  // Calculate weekly KPIs
  // Similar to daily...
});
```

### Monthly KPI Calculation

```typescript
// Run at 4 AM on the 1st of each month
cron.schedule('0 4 1 * *', async () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setDate(1);
  lastMonth.setHours(0, 0, 0, 0);

  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);

  // Calculate monthly KPIs
  // Similar to daily...
});
```

## Frontend Components

### User KPI Dashboard

```typescript
// Component showing user's own KPIs
interface UserKPIDashboardProps {
  userId: number;
}

const UserKPIDashboard: React.FC<UserKPIDashboardProps> = ({ userId }) => {
  const { kpis, overallScore } = useUserKPIs(userId);

  return (
    <div>
      <OverallScoreCard score={overallScore} />
      <div className="kpi-grid">
        {kpis.map(kpi => (
          <KPICard
            key={kpi.id}
            name={kpi.kpi_definition.name}
            actual={kpi.current_measurement.actual_value}
            target={kpi.target_value}
            unit={kpi.kpi_definition.unit}
            trend={kpi.trend}
            weight={kpi.weight}
          />
        ))}
      </div>
    </div>
  );
};
```

### Manager Team View

```typescript
// Component for managers to view team KPIs
interface TeamKPIViewProps {
  teamId: string;
}

const TeamKPIView: React.FC<TeamKPIViewProps> = ({ teamId }) => {
  const { teamMembers, teamAverages } = useTeamKPIs(teamId);

  return (
    <div>
      <TeamAveragesCard averages={teamAverages} />
      <TeamMemberTable members={teamMembers} />
      <TeamPerformanceChart data={teamMembers} />
    </div>
  );
};
```

### Admin Configuration Panel

```typescript
// Component for admins to manage KPI definitions
const KPIAdminPanel: React.FC = () => {
  const { definitions } = useKPIDefinitions();

  return (
    <div>
      <KPIDefinitionsList definitions={definitions} />
      <CreateKPIButton />
      <BulkAssignKPIsButton />
    </div>
  );
};
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create database schema
- [ ] Build basic CRUD APIs for KPI definitions
- [ ] Implement manual KPI entry system
- [ ] Create simple user dashboard view

### Phase 2: Automation (Week 3-4)
- [ ] Implement query-based calculation engine
- [ ] Add scheduled jobs for daily/weekly/monthly calculations
- [ ] Build historical tracking and trend analysis
- [ ] Create manager team view

### Phase 3: Integration (Week 5-6)
- [ ] Integrate with Intercom API
- [ ] Integrate with Aircall API
- [ ] Implement formula-based calculations
- [ ] Add real-time calculation triggers

### Phase 4: Analytics & UX (Week 7-8)
- [ ] Build advanced analytics dashboard
- [ ] Add predictive insights
- [ ] Implement automated alerts and notifications
- [ ] Create mobile-responsive views
- [ ] Add export/reporting functionality

## Configuration Examples by Team

### Customer Support Team KPIs
1. **Average Resolution Time** (Database Query)
2. **First Response Time** (Intercom API)
3. **Customer Satisfaction Score** (Formula: ratings data)
4. **Cases Resolved** (Database Query)
5. **Communication Quality** (Manual Entry by Manager)

### Sales Team KPIs
1. **Deals Closed** (Database Query)
2. **Revenue Generated** (Database Query)
3. **Call Volume** (Aircall API)
4. **Lead Conversion Rate** (Formula)
5. **Client Relationship Quality** (Manual Entry)

### Operations Team KPIs
1. **Tasks Completed** (Database Query)
2. **Process Efficiency** (Formula: time tracking data)
3. **Error Rate** (Database Query)
4. **SLA Compliance** (Formula)
5. **Team Collaboration** (Manual Entry)

## Security & Permissions

### Access Control
- **Users**: Can view their own KPIs only
- **Managers**: Can view and assign KPIs for their team members
- **Admins**: Full access to all KPIs and configurations

### Data Privacy
- KPI calculations should not expose sensitive customer data
- Aggregated metrics only in team views
- Audit logs for all KPI assignments and manual entries

## Performance Considerations

### Caching Strategy
- Cache calculated KPI values (invalidate on new calculation)
- Cache user KPI lists (invalidate on assignment change)
- Use Redis for frequently accessed data

### Query Optimization
- Index on `user_kpi_id`, `period_start`, `period_end`
- Materialized views for team aggregations
- Partition `kpi_measurements` by month

### Rate Limiting
- Limit external API calls (Intercom, Aircall)
- Batch calculations where possible
- Queue heavy calculations for async processing

## Monitoring & Alerting

### System Metrics
- KPI calculation success/failure rates
- API response times
- Database query performance
- External API call volumes

### User Metrics
- KPI achievement rates
- Trend analysis (improving/declining)
- Alert managers when team members consistently miss targets
