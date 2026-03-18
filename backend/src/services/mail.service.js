'use strict';

/**
 * Microsoft Graph Mail Service
 * Sends emails using Microsoft Graph API with client credentials flow
 * 
 * Required environment variables:
 * - MS_GRAPH_TENANT_ID: Azure AD tenant ID
 * - MS_GRAPH_CLIENT_ID: Application (client) ID
 * - MS_GRAPH_CLIENT_SECRET: Client secret
 * - MS_GRAPH_SENDER_EMAIL: Email address to send from (user must have mailbox)
 * - NOTIFICATION_TO_EMAIL: Email to receive reservation notifications
 * - SEND_CUSTOMER_ACK_EMAIL: 'true' or 'false' to send ack to customer
 */

const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const logger = require('../utils/logger');

// Config from environment
const config = {
  tenantId: process.env.MS_GRAPH_TENANT_ID,
  clientId: process.env.MS_GRAPH_CLIENT_ID,
  clientSecret: process.env.MS_GRAPH_CLIENT_SECRET,
  senderEmail: process.env.MS_GRAPH_SENDER_EMAIL,
  notificationEmail: process.env.NOTIFICATION_TO_EMAIL,
  sendCustomerAck: process.env.SEND_CUSTOMER_ACK_EMAIL === 'true',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5173/admin',
};

// Check if Graph is configured
const isConfigured = () => {
  return !!(config.tenantId && config.clientId && config.clientSecret && config.senderEmail);
};

// Lazy initialization of Graph client
let graphClient = null;

const getGraphClient = () => {
  if (graphClient) return graphClient;
  
  if (!isConfigured()) {
    logger.warn('Microsoft Graph not configured - emails will be logged only');
    return null;
  }

  try {
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    graphClient = Client.initWithMiddleware({
      authProvider,
    });

    return graphClient;
  } catch (err) {
    logger.error('Failed to initialize Graph client', { error: err.message });
    return null;
  }
};

/**
 * Send email via Microsoft Graph
 */
async function sendEmail(to, subject, htmlBody, textBody = null) {
  const client = getGraphClient();

  if (!client) {
    // Log email for debugging when Graph not configured
    logger.info('EMAIL (not sent - Graph not configured)', {
      to,
      subject,
      htmlBodyLength: htmlBody?.length || 0,
    });
    return { success: false, reason: 'Graph not configured' };
  }

  try {
    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: htmlBody,
      },
      toRecipients: [
        {
          emailAddress: { address: to },
        },
      ],
    };

    await client
      .api(`/users/${config.senderEmail}/sendMail`)
      .post({ message, saveToSentItems: true });

    logger.info('Email sent via Graph', { to, subject });
    return { success: true };
  } catch (err) {
    logger.error('Failed to send email via Graph', {
      to,
      subject,
      error: err.message,
      code: err.code,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Build owner notification email HTML
 */
function buildOwnerNotificationEmail(reservation) {
  const {
    reference,
    venue_name,
    customer_name,
    customer_email,
    customer_phone,
    customer_company,
    event_type,
    attendee_count,
    start_date,
    end_date,
    notes,
  } = reservation;

  const adminLink = `${config.adminUrl}/reservations`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    .field { margin-bottom: 12px; }
    .label { font-weight: 600; color: #475569; }
    .value { color: #1e293b; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">Nueva solicitud de reserva</h1>
      <p style="margin:8px 0 0 0; opacity: 0.9;">Referencia: ${reference}</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Espacio:</div>
        <div class="value">${venue_name}</div>
      </div>
      <div class="field">
        <div class="label">Fechas:</div>
        <div class="value">${start_date} - ${end_date}</div>
      </div>
      <div class="field">
        <div class="label">Cliente:</div>
        <div class="value">${customer_name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value"><a href="mailto:${customer_email}">${customer_email}</a></div>
      </div>
      <div class="field">
        <div class="label">Teléfono:</div>
        <div class="value">${customer_phone || 'No proporcionado'}</div>
      </div>
      ${customer_company ? `
      <div class="field">
        <div class="label">Empresa:</div>
        <div class="value">${customer_company}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Tipo de evento:</div>
        <div class="value">${event_type || 'No especificado'}</div>
      </div>
      ${attendee_count ? `
      <div class="field">
        <div class="label">Asistentes estimados:</div>
        <div class="value">${attendee_count}</div>
      </div>
      ` : ''}
      ${notes ? `
      <div class="field">
        <div class="label">Notas del cliente:</div>
        <div class="value">${notes}</div>
      </div>
      ` : ''}
      
      <a href="${adminLink}" class="button">Ver en el panel de administración</a>
    </div>
    <div class="footer">
      Este email fue generado automáticamente por el sistema de reservas.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Build customer acknowledgement email HTML
 */
function buildCustomerAckEmail(reservation) {
  const {
    reference,
    venue_name,
    start_date,
    end_date,
  } = reservation;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
    .highlight { background: white; border-radius: 6px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;">¡Solicitud recibida!</h1>
      <p style="margin:8px 0 0 0; opacity: 0.9;">Referencia: ${reference}</p>
    </div>
    <div class="content">
      <p>Hemos recibido tu solicitud de reserva. Revisaremos tu petición y te contactaremos lo antes posible.</p>
      
      <div class="highlight">
        <strong>Espacio:</strong> ${venue_name}<br>
        <strong>Fechas:</strong> ${start_date} - ${end_date}
      </div>
      
      <p>Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este email.</p>
    </div>
    <div class="footer">
      Gracias por tu interés.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send owner notification for a new reservation
 */
async function sendReservationNotification(reservation) {
  if (!config.notificationEmail) {
    logger.warn('NOTIFICATION_TO_EMAIL not configured - skipping owner notification');
    return;
  }

  const subject = `Nueva reserva: ${reservation.venue_name} (${reservation.start_date})`;
  const html = buildOwnerNotificationEmail(reservation);

  const result = await sendEmail(config.notificationEmail, subject, html);
  
  if (!result.success) {
    logger.error('Failed to send owner notification', { 
      reservationId: reservation.id,
      error: result.error || result.reason,
    });
  }

  return result;
}

/**
 * Send acknowledgement email to customer
 */
async function sendCustomerAcknowledgement(reservation) {
  if (!config.sendCustomerAck) {
    logger.info('Customer ack email disabled - skipping');
    return;
  }

  const subject = `Solicitud recibida - ${reservation.venue_name}`;
  const html = buildCustomerAckEmail(reservation);

  const result = await sendEmail(reservation.customer_email, subject, html);
  
  if (!result.success) {
    logger.error('Failed to send customer ack', { 
      reservationId: reservation.id,
      email: reservation.customer_email,
      error: result.error || result.reason,
    });
  }

  return result;
}

module.exports = {
  isConfigured,
  sendEmail,
  sendReservationNotification,
  sendCustomerAcknowledgement,
};
