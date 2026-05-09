-- ==========================================
-- BIGQUERY SCHEMA - NICARAGUA INFORMATE ANALYTICS
-- ==========================================

-- Dataset: analytics
CREATE SCHEMA IF NOT EXISTS analytics;

-- Tabla: events (streaming)
CREATE TABLE IF NOT EXISTS analytics.events (
  event_type STRING,
  user_id STRING,
  timestamp TIMESTAMP,
  session_id STRING,
  device_category STRING,
  traffic_source STRING,
  
  -- Eventos específicos
  article_id STRING,
  article_category STRING,
  article_title STRING,
  
  -- Monetización
  tier STRING,
  amount FLOAT64,
  currency STRING,
  
  -- Engagement
  scroll_depth INT64,
  time_on_page INT64,
  read_complete BOOLEAN,
  
  -- Predicción churn
  days_since_last_visit INT64,
  articles_read_last_7d INT64,
  payment_failures INT64,
  
  processed_at TIMESTAMP
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, user_id;

-- Vista: Churn Risk Score
CREATE OR REPLACE VIEW analytics.churn_risk AS
WITH user_metrics AS (
  SELECT
    user_id,
    tier,
    DATE_DIFF(CURRENT_DATE(), DATE(MAX(timestamp)), DAY) as days_since_last_activity,
    COUNTIF(event_type = 'article_view' AND DATE(timestamp) > DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as articles_last_7d,
    COUNTIF(event_type = 'payment_failed') as payment_failures,
    COUNTIF(event_type = 'subscription_cancelled') as has_cancelled,
    MAX(CASE WHEN event_type = 'subscription_created' THEN timestamp END) as subscription_date
  FROM analytics.events
  WHERE user_id IS NOT NULL
  GROUP BY user_id, tier
),
risk_scoring AS (
  SELECT
    *,
    CASE
      WHEN has_cancelled > 0 THEN 100
      WHEN payment_failures >= 2 THEN 80
      WHEN days_since_last_activity > 14 AND articles_last_7d = 0 THEN 70
      WHEN days_since_last_activity > 7 THEN 40
      WHEN articles_last_7d < 3 AND tier != 'free' THEN 30
      ELSE 10
    END as churn_risk_score,
    CASE
      WHEN has_cancelled > 0 THEN 'cancelled'
      WHEN payment_failures >= 2 THEN 'critical'
      WHEN days_since_last_activity > 14 AND articles_last_7d = 0 THEN 'high'
      WHEN days_since_last_activity > 7 THEN 'medium'
      ELSE 'low'
    END as risk_category
  FROM user_metrics
)
SELECT * FROM risk_scoring
WHERE tier != 'free';

-- Vista: Revenue Dashboard
CREATE OR REPLACE VIEW analytics.revenue_dashboard AS
SELECT
  DATE(timestamp) as date,
  tier,
  COUNTIF(event_type = 'subscription_created') as new_subscriptions,
  COUNTIF(event_type = 'subscription_cancelled') as cancellations,
  SUM(IF(event_type = 'payment_complete', amount, 0)) as daily_revenue,
  SUM(IF(event_type = 'payment_complete', amount, 0)) / 
    NULLIF(COUNTIF(event_type = 'subscription_created'), 0) as arpu
FROM analytics.events
WHERE event_type IN ('subscription_created', 'subscription_cancelled', 'payment_complete')
GROUP BY date, tier
ORDER BY date DESC;

-- Vista: Engagement Funnel
CREATE OR REPLACE VIEW analytics.engagement_funnel AS
SELECT
  DATE(timestamp) as date,
  COUNTIF(event_type = 'page_view') as page_views,
  COUNTIF(event_type = 'article_view') as article_views,
  COUNTIF(event_type = 'article_read_complete') as completed_reads,
  COUNTIF(event_type = 'subscription_click') as subscription_clicks,
  COUNTIF(event_type = 'payment_complete') as purchases,
  -- Tasas de conversión
  ROUND(COUNTIF(event_type = 'article_view') / NULLIF(COUNTIF(event_type = 'page_view'), 0) * 100, 2) as article_ctr,
  ROUND(COUNTIF(event_type = 'subscription_click') / NULLIF(COUNTIF(event_type = 'article_view'), 0) * 100, 2) as paywall_ctr,
  ROUND(COUNTIF(event_type = 'payment_complete') / NULLIF(COUNTIF(event_type = 'subscription_click'), 0) * 100, 2) as conversion_rate
FROM analytics.events
GROUP BY date
ORDER BY date DESC;

-- Modelo ML: Predicción de Churn (requiere BQML)
-- Descomentar cuando se tenga BQML habilitado
/*
CREATE OR REPLACE MODEL analytics.churn_prediction_model
OPTIONS(
  MODEL_TYPE='LOGISTIC_REG',
  INPUT_LABEL_COLS=['has_cancelled'],
  AUTO_CLASS_WEIGHTS=TRUE
) AS
SELECT
  days_since_last_activity,
  articles_last_7d,
  payment_failures,
  CASE WHEN tier = 'basic' THEN 1 ELSE 0 END as is_basic,
  CASE WHEN tier = 'pro' THEN 1 ELSE 0 END as is_pro,
  has_cancelled as label
FROM analytics.churn_risk;
*/
