// ==========================================
// CLOUD FUNCTION: PREDICCIÓN DE CHURN
// ==========================================

const { BigQuery } = require('@google-cloud/bigquery');
const admin = require('firebase-admin');

// Inicializar si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.predictChurn = async (req, res) => {
  // Verificar autenticación para HTTP requests
  if (req.method === 'POST' && req.headers.authorization) {
    // Validar token si es necesario
  }
  
  const bigquery = new BigQuery();
  const db = admin.firestore();
  
  try {
    // Obtener predicciones de riesgo alto usando la vista churn_risk
    const [rows] = await bigquery.query(`
      SELECT
        user_id,
        churn_risk_score,
        risk_category,
        days_since_last_activity,
        articles_last_7d,
        payment_failures
      FROM analytics.churn_risk
      WHERE risk_category IN ('critical', 'high')
        AND user_id IS NOT NULL
      ORDER BY churn_risk_score DESC
      LIMIT 100
    `);
    
    console.log(`Procesando ${rows.length} usuarios en riesgo de churn`);
    
    // Procesar cada usuario en riesgo
    const batch = db.batch();
    const retentionTasks = [];
    
    for (const row of rows) {
      const userRef = db.collection('users').doc(row.user_id);
      
      // Actualizar perfil de riesgo
      batch.update(userRef, {
        churn_risk_score: row.churn_risk_score,
        churn_risk_category: row.risk_category,
        last_churn_check: admin.firestore.FieldValue.serverTimestamp(),
        retention_actions: determineRetentionActions(row)
      });
      
      // Crear tarea de retención si es crítico
      if (row.risk_category === 'critical') {
        const taskRef = db.collection('retention_tasks').doc();
        batch.set(taskRef, {
          user_id: row.user_id,
          priority: 'urgent',
          action_type: 'personal_outreach',
          reason: `${row.payment_failures} payment failures`,
          assigned_to: 'retention_team',
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });
        retentionTasks.push(row.user_id);
      }
      
      // Trigger win-back para high risk
      if (row.risk_category === 'high' && row.days_since_last_activity > 10) {
        await triggerWinBackCampaign(row.user_id, 'we_miss_you');
      }
      
      // Log analytics
      await db.collection('churn_predictions').add({
        user_id: row.user_id,
        risk_score: row.churn_risk_score,
        risk_category: row.risk_category,
        days_inactive: row.days_since_last_activity,
        articles_last_7d: row.articles_last_7d,
        payment_failures: row.payment_failures,
        predicted_at: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    
    console.log(`Churn prediction completado: ${rows.length} usuarios procesados`);
    
    res.json({
      processed: rows.length,
      critical: rows.filter(r => r.risk_category === 'critical').length,
      high: rows.filter(r => r.risk_category === 'high').length,
      retention_tasks_created: retentionTasks.length
    });
    
  } catch (err) {
    console.error('Churn prediction error:', err);
    res.status(500).json({ error: err.message });
  }
};

function determineRetentionActions(row) {
  const actions = [];
  
  if (row.payment_failures > 0) {
    actions.push('payment_retry_assistance');
    actions.push('alternative_payment_methods');
  }
  if (row.articles_last_7d === 0) {
    actions.push('content_re_engagement');
    actions.push('personalized_digest');
  }
  if (row.days_since_last_activity > 10) {
    actions.push('we_miss_you_email');
    actions.push('exclusive_content_preview');
  }
  if (row.days_since_last_activity > 5 && row.articles_last_7d < 3) {
    actions.push('reading_recommendations');
  }
  
  return actions;
}

async function triggerWinBackCampaign(userId, campaignType) {
  try {
    const db = admin.firestore();
    
    // Verificar si ya se envió campaña recientemente
    const recentCampaigns = await db.collection('email_campaigns')
      .where('user_id', '==', userId)
      .where('campaign_type', '==', campaignType)
      .where('sent_at', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .limit(1)
      .get();
    
    if (!recentCampaigns.empty) {
      console.log(`Campaña ${campaignType} ya enviada recientemente a ${userId}`);
      return;
    }
    
    // Programar campaña
    await db.collection('email_campaigns').add({
      user_id: userId,
      campaign_type: campaignType,
      status: 'scheduled',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h después
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Publicar a PubSub para procesamiento asíncrono (si está configurado)
    try {
      const { PubSub } = require('@google-cloud/pubsub');
      const pubsub = new PubSub();
      await pubsub.topic('email-campaigns').publishJSON({
        user_id: userId,
        campaign_type: campaignType,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } catch (e) {
      // PubSub no configurado, ignorar
    }
    
    console.log(`Win-back campaign ${campaignType} scheduled for ${userId}`);
  } catch (err) {
    console.error('Error triggering win-back:', err);
  }
}

// Para triggers programados (Cloud Scheduler)
exports.scheduledPredictChurn = async (context) => {
  const req = { method: 'POST', headers: {} };
  const res = {
    json: (data) => console.log('Scheduled churn prediction result:', data),
    status: (code) => ({ json: (data) => console.error('Error:', code, data) })
  };
  
  return exports.predictChurn(req, res);
};
