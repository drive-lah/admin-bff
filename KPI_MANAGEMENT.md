# KPI Management System - Simple Incremental Approach

## Overview

A lightweight KPI (Key Performance Indicator) system that leverages our existing architecture. We'll start with **one KPI** and expand gradually as needed.

**Philosophy:** Start simple, add complexity only when needed.

---

## Architecture (Using Existing Services)

```
┌─────────────────────────────────────────────────────┐
│   admincontrols (React Frontend)                    │
│   - User KPI Dashboard                              │
│   - Manager Team View                               │
│   - KPI Assignment UI (Admin)                       │
└─────────────────────────────────────────────────────┘
                        ↓ REST API
┌─────────────────────────────────────────────────────┐
│   admin-bff (Node.js Backend for Frontend)          │
│   - Authentication & Authorization                  │
│   - Proxy routes: /api/kpis/*                       │
│   - Forwards to new-monitor-api                     │
└─────────────────────────────────────────────────────┘
                        ↓ HTTP
┌─────────────────────────────────────────────────────┐
│   new-monitor-api (Python Calculation Engine)       │
│   - KPI calculation logic                           │
│   - Database queries                                │
│   - External API integrations (Intercom, Aircall)   │
│   - Scheduled calculations (cron jobs)              │
│   - Stores results in PostgreSQL                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│   PostgreSQL (collections-db)                       │
│   - kpi_definitions                                 │
│   - user_kpis                                       │
│   - kpi_measurements                                │
└─────────────────────────────────────────────────────┘
```

**Why this approach?**
- ✅ Leverage existing Python service (new-monitor-api) for calculations
- ✅ No new services needed
- ✅ Python better for data processing and calculations
- ✅ Consistent with current architecture
- ✅ Easy to test and debug

---

## Database Schema

### 1. kpi_definitions
Master table defining available KPI types.

```sql
CREATE TABLE kpi_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'customer_support', 'operations', 'sales'
  calculation_type VARCHAR(50) NOT NULL, -- 'query', 'api', 'formula', 'manual'
  config JSONB, -- Flexible configuration
  unit VARCHAR(50), -- '%', 'count', 'hours', 'minutes', 'currency'
  target_type VARCHAR(50), -- 'higher_better', 'lower_better', 'exact'
  aggregation_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
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
  target_value DECIMAL(10, 2),
  weight DECIMAL(5, 2), -- Importance percentage (0-100)
  start_date DATE NOT NULL,
  end_date DATE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, kpi_definition_id, start_date)
);

CREATE INDEX idx_user_kpis_user ON user_kpis(user_id) WHERE is_active = true;
```

### 3. kpi_measurements
Stores calculated KPI values over time.

```sql
CREATE TABLE kpi_measurements (
  id SERIAL PRIMARY KEY,
  user_kpi_id INTEGER REFERENCES user_kpis(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value DECIMAL(10, 2),
  target_value DECIMAL(10, 2),
  achievement_percentage DECIMAL(5, 2), -- (actual / target) * 100
  metadata JSONB, -- Store calculation details, data sources
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_kpi_id, period_start, period_end)
);

CREATE INDEX idx_kpi_measurements_lookup
  ON kpi_measurements(user_kpi_id, period_start DESC);
```

---

## Starting Simple: First KPI Example

Let's implement **"Average Resolution Time"** for customer support team as our first KPI.

### Step 1: Insert KPI Definition

```sql
INSERT INTO kpi_definitions (
  name,
  description,
  category,
  calculation_type,
  config,
  unit,
  target_type,
  aggregation_period
) VALUES (
  'Average Resolution Time',
  'Average time taken to resolve customer support cases',
  'customer_support',
  'query',
  '{
    "query_key": "avg_resolution_time",
    "description": "Calculates average hours between case creation and resolution"
  }'::jsonb,
  'hours',
  'lower_better',
  'weekly'
);
```

---

## Implementation: new-monitor-api (Python)

### File Structure

```
new-monitor-api/
├── kpi/
│   ├── __init__.py
│   ├── calculator.py          # Main calculation engine
│   ├── queries.py             # Predefined SQL queries
│   └── routes.py              # API endpoints
├── app.py                     # Add KPI routes
└── config.py
```

### 1. KPI Queries (Python)

```python
# new-monitor-api/kpi/queries.py

"""
Predefined KPI calculation queries.
Each query should return a single 'value' column.
"""

KPI_QUERIES = {
    'avg_resolution_time': """
        SELECT
            COALESCE(
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600),
                0
            ) as value
        FROM support_cases
        WHERE assigned_to = %(user_id)s
          AND status = 'resolved'
          AND resolved_at >= %(start_date)s
          AND resolved_at < %(end_date)s
    """,

    # Add more KPIs here as we expand
    'cases_resolved_count': """
        SELECT COUNT(*) as value
        FROM support_cases
        WHERE assigned_to = %(user_id)s
          AND status = 'resolved'
          AND resolved_at >= %(start_date)s
          AND resolved_at < %(end_date)s
    """,
}

def get_query(query_key: str) -> str:
    """Get query by key, raise error if not found"""
    if query_key not in KPI_QUERIES:
        raise ValueError(f"Unknown query key: {query_key}")
    return KPI_QUERIES[query_key]
```

### 2. KPI Calculator (Python)

```python
# new-monitor-api/kpi/calculator.py

from datetime import date, datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from .queries import get_query
import logging

logger = logging.getLogger(__name__)

class KPICalculator:
    def __init__(self, db_connection):
        self.db = db_connection

    def calculate_user_kpi(
        self,
        user_kpi_id: int,
        period_start: date,
        period_end: date
    ) -> Dict[str, Any]:
        """
        Calculate a KPI for a user for a given period.
        Returns the measurement data to be stored.
        """
        # Get user KPI details
        user_kpi = self._get_user_kpi(user_kpi_id)
        if not user_kpi:
            raise ValueError(f"User KPI {user_kpi_id} not found")

        # Get KPI definition
        definition = self._get_kpi_definition(user_kpi['kpi_definition_id'])
        if not definition:
            raise ValueError(f"KPI definition {user_kpi['kpi_definition_id']} not found")

        # Calculate based on type
        calc_type = definition['calculation_type']

        if calc_type == 'query':
            actual_value = self._calculate_query_kpi(
                user_kpi['user_id'],
                definition['config'],
                period_start,
                period_end
            )
        elif calc_type == 'manual':
            # Manual KPIs are entered by managers, not calculated
            raise ValueError("Manual KPIs cannot be auto-calculated")
        else:
            raise ValueError(f"Unsupported calculation type: {calc_type}")

        # Calculate achievement percentage
        target = user_kpi['target_value']
        achievement_pct = self._calculate_achievement(
            actual_value,
            target,
            definition['target_type']
        )

        return {
            'user_kpi_id': user_kpi_id,
            'period_start': period_start,
            'period_end': period_end,
            'actual_value': actual_value,
            'target_value': target,
            'achievement_percentage': achievement_pct,
            'metadata': {
                'calculation_type': calc_type,
                'kpi_name': definition['name'],
                'calculated_at': datetime.now().isoformat()
            }
        }

    def _calculate_query_kpi(
        self,
        user_id: int,
        config: Dict,
        period_start: date,
        period_end: date
    ) -> float:
        """Execute SQL query to calculate KPI"""
        query_key = config.get('query_key')
        if not query_key:
            raise ValueError("Missing query_key in config")

        query = get_query(query_key)

        with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, {
                'user_id': user_id,
                'start_date': period_start,
                'end_date': period_end
            })
            result = cursor.fetchone()
            return float(result['value']) if result else 0.0

    def _calculate_achievement(
        self,
        actual: float,
        target: float,
        target_type: str
    ) -> float:
        """Calculate achievement percentage based on target type"""
        if target == 0:
            return 0.0

        if target_type == 'higher_better':
            # e.g., sales: actual=120, target=100 → 120%
            return (actual / target) * 100
        elif target_type == 'lower_better':
            # e.g., resolution time: actual=2hrs, target=3hrs → 150%
            # (lower is better, so invert the ratio)
            return (target / actual) * 100 if actual > 0 else 100.0
        elif target_type == 'exact':
            # e.g., accuracy: how close to target?
            diff = abs(actual - target)
            return max(0, 100 - (diff / target * 100))
        else:
            return 0.0

    def save_measurement(self, measurement: Dict[str, Any]) -> int:
        """Save KPI measurement to database"""
        with self.db.cursor() as cursor:
            cursor.execute("""
                INSERT INTO kpi_measurements (
                    user_kpi_id, period_start, period_end,
                    actual_value, target_value, achievement_percentage,
                    metadata, calculated_at
                ) VALUES (
                    %(user_kpi_id)s, %(period_start)s, %(period_end)s,
                    %(actual_value)s, %(target_value)s, %(achievement_percentage)s,
                    %(metadata)s, CURRENT_TIMESTAMP
                )
                ON CONFLICT (user_kpi_id, period_start, period_end)
                DO UPDATE SET
                    actual_value = EXCLUDED.actual_value,
                    target_value = EXCLUDED.target_value,
                    achievement_percentage = EXCLUDED.achievement_percentage,
                    metadata = EXCLUDED.metadata,
                    calculated_at = CURRENT_TIMESTAMP
                RETURNING id
            """, measurement)

            result = cursor.fetchone()
            self.db.commit()
            return result[0]

    def _get_user_kpi(self, user_kpi_id: int) -> Optional[Dict]:
        with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM user_kpis WHERE id = %s",
                [user_kpi_id]
            )
            return cursor.fetchone()

    def _get_kpi_definition(self, kpi_def_id: int) -> Optional[Dict]:
        with self.db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT * FROM kpi_definitions WHERE id = %s",
                [kpi_def_id]
            )
            return cursor.fetchone()
```

### 3. KPI API Routes (Python)

```python
# new-monitor-api/kpi/routes.py

from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from .calculator import KPICalculator
from database import get_db_connection
import logging

kpi_bp = Blueprint('kpi', __name__, url_prefix='/kpis')
logger = logging.getLogger(__name__)

@kpi_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user_kpis(user_id):
    """Get all KPIs assigned to a user with latest measurements"""
    try:
        db = get_db_connection()
        with db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT
                    uk.id,
                    uk.target_value,
                    uk.weight,
                    uk.start_date,
                    kd.id as kpi_definition_id,
                    kd.name,
                    kd.description,
                    kd.unit,
                    kd.target_type,
                    kd.category,
                    (
                        SELECT json_build_object(
                            'actual_value', km.actual_value,
                            'achievement_percentage', km.achievement_percentage,
                            'period_start', km.period_start,
                            'period_end', km.period_end,
                            'calculated_at', km.calculated_at
                        )
                        FROM kpi_measurements km
                        WHERE km.user_kpi_id = uk.id
                        ORDER BY km.period_start DESC
                        LIMIT 1
                    ) as latest_measurement
                FROM user_kpis uk
                JOIN kpi_definitions kd ON uk.kpi_definition_id = kd.id
                WHERE uk.user_id = %s
                  AND uk.is_active = true
                  AND kd.is_active = true
                ORDER BY uk.id
            """, [user_id])

            kpis = cursor.fetchall()
            return jsonify({
                'user_id': user_id,
                'kpis': kpis
            })
    except Exception as e:
        logger.error(f"Error fetching KPIs for user {user_id}: {e}")
        return jsonify({'error': str(e)}), 500

@kpi_bp.route('/users/<int:user_id>/kpis/assign', methods=['POST'])
def assign_kpi_to_user(user_id):
    """Assign a KPI to a user"""
    try:
        data = request.json
        db = get_db_connection()

        with db.cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_kpis (
                    user_id, kpi_definition_id, target_value,
                    weight, start_date, assigned_by, assigned_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
                )
                RETURNING id
            """, [
                user_id,
                data['kpi_definition_id'],
                data['target_value'],
                data.get('weight', 100),
                data.get('start_date', date.today()),
                data.get('assigned_by')
            ])

            user_kpi_id = cursor.fetchone()[0]
            db.commit()

            return jsonify({
                'success': True,
                'user_kpi_id': user_kpi_id
            }), 201
    except Exception as e:
        logger.error(f"Error assigning KPI to user {user_id}: {e}")
        return jsonify({'error': str(e)}), 500

@kpi_bp.route('/calculate/<int:user_kpi_id>', methods=['POST'])
def calculate_kpi(user_kpi_id):
    """Calculate KPI for a specific period (manual trigger)"""
    try:
        data = request.json
        period_start = datetime.fromisoformat(data['period_start']).date()
        period_end = datetime.fromisoformat(data['period_end']).date()

        db = get_db_connection()
        calculator = KPICalculator(db)

        # Calculate
        measurement = calculator.calculate_user_kpi(
            user_kpi_id,
            period_start,
            period_end
        )

        # Save
        measurement_id = calculator.save_measurement(measurement)

        return jsonify({
            'success': True,
            'measurement_id': measurement_id,
            'measurement': measurement
        })
    except Exception as e:
        logger.error(f"Error calculating KPI {user_kpi_id}: {e}")
        return jsonify({'error': str(e)}), 500

@kpi_bp.route('/definitions', methods=['GET'])
def get_kpi_definitions():
    """Get all available KPI definitions"""
    try:
        db = get_db_connection()
        with db.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT * FROM kpi_definitions
                WHERE is_active = true
                ORDER BY category, name
            """)

            definitions = cursor.fetchall()
            return jsonify({'definitions': definitions})
    except Exception as e:
        logger.error(f"Error fetching KPI definitions: {e}")
        return jsonify({'error': str(e)}), 500
```

### 4. Register Routes in Main App

```python
# new-monitor-api/app.py

from kpi.routes import kpi_bp

# ... existing code ...

app.register_blueprint(kpi_bp)
```

---

## Implementation: admin-bff (Node.js Proxy)

Simple proxy layer that forwards to new-monitor-api.

```typescript
// admin-bff/src/routes/kpis.ts

import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = express.Router();
const MONITOR_API_URL = process.env.AI_AGENTS_API_URL || 'http://localhost:8080';

// Get user's KPIs
router.get('/users/:userId/kpis', async (req, res) => {
  try {
    const response = await axios.get(
      `${MONITOR_API_URL}/kpis/users/${req.params.userId}`
    );
    res.json(response.data);
  } catch (error: any) {
    logger.error(`Failed to fetch KPIs for user ${req.params.userId}:`, error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch KPIs'
    });
  }
});

// Assign KPI to user
router.post('/users/:userId/kpis/assign', async (req, res) => {
  try {
    const response = await axios.post(
      `${MONITOR_API_URL}/kpis/users/${req.params.userId}/kpis/assign`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    logger.error(`Failed to assign KPI to user ${req.params.userId}:`, error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to assign KPI'
    });
  }
});

// Get all KPI definitions
router.get('/definitions', async (req, res) => {
  try {
    const response = await axios.get(`${MONITOR_API_URL}/kpis/definitions`);
    res.json(response.data);
  } catch (error: any) {
    logger.error('Failed to fetch KPI definitions:', error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to fetch KPI definitions'
    });
  }
});

// Manually trigger KPI calculation
router.post('/calculate/:userKpiId', async (req, res) => {
  try {
    const response = await axios.post(
      `${MONITOR_API_URL}/kpis/calculate/${req.params.userKpiId}`,
      req.body
    );
    res.json(response.data);
  } catch (error: any) {
    logger.error(`Failed to calculate KPI ${req.params.userKpiId}:`, error);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Failed to calculate KPI'
    });
  }
});

export default router;
```

Register in server.ts:

```typescript
// admin-bff/src/server.ts

import kpisRouter from './routes/kpis';

// ... existing code ...

app.use('/api/admin/kpis', authMiddleware, kpisRouter);
```

---

## Implementation: admincontrols (React Frontend)

### 1. Types

```typescript
// admincontrols/src/features/kpis/types/kpi.ts

export interface KPIDefinition {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  target_type: 'higher_better' | 'lower_better' | 'exact';
  aggregation_period: string;
}

export interface UserKPI {
  id: number;
  kpi_definition_id: number;
  name: string;
  description: string;
  unit: string;
  target_value: number;
  weight: number;
  category: string;
  latest_measurement?: {
    actual_value: number;
    achievement_percentage: number;
    period_start: string;
    period_end: string;
    calculated_at: string;
  };
}

export interface UserKPIsResponse {
  user_id: number;
  kpis: UserKPI[];
}
```

### 2. Service

```typescript
// admincontrols/src/features/kpis/services/kpiService.ts

import axios from 'axios';
import type { KPIDefinition, UserKPIsResponse } from '../types/kpi';

const API_BASE = '/api/admin/kpis';

export const kpiService = {
  getUserKPIs: async (userId: number): Promise<UserKPIsResponse> => {
    const response = await axios.get(`${API_BASE}/users/${userId}/kpis`);
    return response.data;
  },

  getKPIDefinitions: async (): Promise<KPIDefinition[]> => {
    const response = await axios.get(`${API_BASE}/definitions`);
    return response.data.definitions;
  },

  assignKPI: async (
    userId: number,
    data: {
      kpi_definition_id: number;
      target_value: number;
      weight?: number;
      start_date?: string;
    }
  ) => {
    const response = await axios.post(
      `${API_BASE}/users/${userId}/kpis/assign`,
      data
    );
    return response.data;
  },

  calculateKPI: async (
    userKpiId: number,
    periodStart: string,
    periodEnd: string
  ) => {
    const response = await axios.post(`${API_BASE}/calculate/${userKpiId}`, {
      period_start: periodStart,
      period_end: periodEnd,
    });
    return response.data;
  },
};
```

### 3. Simple Dashboard Component

```typescript
// admincontrols/src/features/kpis/components/UserKPIDashboard.tsx

import React, { useEffect, useState } from 'react';
import { kpiService } from '../services/kpiService';
import type { UserKPI } from '../types/kpi';

interface UserKPIDashboardProps {
  userId: number;
}

export const UserKPIDashboard: React.FC<UserKPIDashboardProps> = ({ userId }) => {
  const [kpis, setKpis] = useState<UserKPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
  }, [userId]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const data = await kpiService.getUserKPIs(userId);
      setKpis(data.kpis);
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading KPIs...</div>;
  if (kpis.length === 0) return <div>No KPIs assigned yet.</div>;

  return (
    <div className="kpi-dashboard">
      <h2>My KPIs</h2>
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
};

const KPICard: React.FC<{ kpi: UserKPI }> = ({ kpi }) => {
  const measurement = kpi.latest_measurement;
  const achievement = measurement?.achievement_percentage || 0;

  return (
    <div className="kpi-card">
      <h3>{kpi.name}</h3>
      <p className="description">{kpi.description}</p>

      {measurement ? (
        <>
          <div className="values">
            <div>
              <label>Current</label>
              <span className="value">
                {measurement.actual_value.toFixed(2)} {kpi.unit}
              </span>
            </div>
            <div>
              <label>Target</label>
              <span className="value">
                {kpi.target_value} {kpi.unit}
              </span>
            </div>
          </div>

          <div className="achievement">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(achievement, 100)}%` }}
              />
            </div>
            <span>{achievement.toFixed(0)}%</span>
          </div>

          <div className="period">
            Period: {new Date(measurement.period_start).toLocaleDateString()} -
            {new Date(measurement.period_end).toLocaleDateString()}
          </div>
        </>
      ) : (
        <div className="no-data">No measurements yet</div>
      )}
    </div>
  );
};
```

---

## Scheduled Calculations (Cron Job)

Calculate KPIs automatically on schedule.

```python
# new-monitor-api/jobs/calculate_kpis.py

from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from kpi.calculator import KPICalculator
from database import get_db_connection
import logging

logger = logging.getLogger(__name__)

def calculate_weekly_kpis():
    """Run every Monday to calculate last week's KPIs"""
    logger.info("Starting weekly KPI calculation job")

    # Calculate for last week (Monday to Sunday)
    today = date.today()
    days_since_monday = today.weekday()
    last_monday = today - timedelta(days=days_since_monday + 7)
    last_sunday = last_monday + timedelta(days=6)

    db = get_db_connection()
    calculator = KPICalculator(db)

    # Get all active weekly KPIs
    with db.cursor(cursor_factory=RealDictCursor) as cursor:
        cursor.execute("""
            SELECT uk.id
            FROM user_kpis uk
            JOIN kpi_definitions kd ON uk.kpi_definition_id = kd.id
            WHERE uk.is_active = true
              AND kd.is_active = true
              AND kd.aggregation_period = 'weekly'
              AND kd.calculation_type != 'manual'
        """)
        user_kpis = cursor.fetchall()

    success_count = 0
    fail_count = 0

    for user_kpi in user_kpis:
        try:
            measurement = calculator.calculate_user_kpi(
                user_kpi['id'],
                last_monday,
                last_sunday
            )
            calculator.save_measurement(measurement)
            success_count += 1
            logger.info(f"Calculated KPI {user_kpi['id']}")
        except Exception as e:
            fail_count += 1
            logger.error(f"Failed to calculate KPI {user_kpi['id']}: {e}")

    logger.info(
        f"Weekly KPI calculation complete. "
        f"Success: {success_count}, Failed: {fail_count}"
    )

def start_scheduler():
    """Start the background scheduler"""
    scheduler = BackgroundScheduler()

    # Run every Monday at 2 AM
    scheduler.add_job(
        calculate_weekly_kpis,
        'cron',
        day_of_week='mon',
        hour=2,
        minute=0
    )

    scheduler.start()
    logger.info("KPI scheduler started")
```

Add to main app:

```python
# new-monitor-api/app.py

from jobs.calculate_kpis import start_scheduler

if __name__ == '__main__':
    start_scheduler()
    app.run()
```

---

## Expansion Path

### Adding Second KPI: "Cases Resolved Count"

1. **Add SQL query** to `new-monitor-api/kpi/queries.py`:
```python
'cases_resolved_count': """
    SELECT COUNT(*) as value
    FROM support_cases
    WHERE assigned_to = %(user_id)s
      AND status = 'resolved'
      AND resolved_at >= %(start_date)s
      AND resolved_at < %(end_date)s
"""
```

2. **Insert definition** in database:
```sql
INSERT INTO kpi_definitions (name, description, category, calculation_type, config, unit, target_type, aggregation_period)
VALUES (
  'Cases Resolved',
  'Number of customer support cases successfully resolved',
  'customer_support',
  'query',
  '{"query_key": "cases_resolved_count"}'::jsonb,
  'count',
  'higher_better',
  'weekly'
);
```

3. **Assign to users** via admin UI

4. **Done!** Next weekly run will calculate it automatically

### Adding External API KPI (e.g., Intercom)

```python
# new-monitor-api/kpi/adapters/intercom_adapter.py

class IntercomKPIAdapter:
    def calculate_first_response_time(self, user_id, start_date, end_date):
        user_intercom_id = self.get_user_intercom_id(user_id)
        # Call Intercom API
        # Calculate average first response time
        return avg_response_time
```

Update calculator to support 'api' type calculations.

---

## Testing

### Manual Testing

1. **Assign KPI to user:**
```bash
curl -X POST http://localhost:3001/api/admin/kpis/users/1/kpis/assign \
  -H "Content-Type: application/json" \
  -d '{
    "kpi_definition_id": 1,
    "target_value": 3,
    "weight": 100
  }'
```

2. **Calculate KPI manually:**
```bash
curl -X POST http://localhost:3001/api/admin/kpis/calculate/1 \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2025-10-01",
    "period_end": "2025-10-07"
  }'
```

3. **View user KPIs:**
```bash
curl http://localhost:3001/api/admin/kpis/users/1/kpis
```

---

## Summary

**Simple approach:**
1. ✅ Start with ONE KPI (avg resolution time)
2. ✅ Use existing services (no new infrastructure)
3. ✅ Store queries in Python (easy to modify)
4. ✅ Auto-calculate weekly via cron
5. ✅ Add more KPIs incrementally

**Expansion is easy:**
- Add new query to `queries.py`
- Insert definition in database
- Assign to users
- Done!

This incremental approach lets us validate the system with real usage before adding complexity.
