// ============================================================
// Facebook Conversions API (CAPI) — Direct Browser Integration
// Pixel ID: 867998396058170
// ============================================================
// NOTE: This file sends events directly to the Meta CAPI endpoint
// from the browser, in parallel with the Meta Pixel (browser-side).
// A shared event_id is used for deduplication so Meta counts each
// conversion only once.
//
// IMPORTANT: Replace CAPI_ACCESS_TOKEN below with a valid
// Meta Marketing API access token that has the
// "ads_management" and "ads_read" permissions.
// Generate one at: https://developers.facebook.com/tools/explorer/
// ============================================================

const CAPI_PIXEL_ID     = '867998396058170';
const CAPI_ACCESS_TOKEN = 'EAAUqKAlvZC5EBQ790m5KkW34LOPze17BqtoNuZAesUhlJ1zZBXyMWWRQVZANUTYUU3kmde4mo3sM2ym6zAk7oeNiBX8ARkW7KB4M248buptqRSMS54MFMNt7lqvZCDZBGgYrJuOyoZAiyXPMX9e5y7dweiniIN0UadNcs1ZATH9x6RYZCaPwleZBKHcrZCoOtZC6MQZDZD'; // <-- replace this
const CAPI_API_VERSION  = 'v19.0';
const CAPI_TEST_EVENT_CODE = 'TEST18652'; // Remove this line when going live
const CAPI_ENDPOINT     = `https://graph.facebook.com/${CAPI_API_VERSION}/${CAPI_PIXEL_ID}/events?access_token=${CAPI_ACCESS_TOKEN}`;

// ------------------------------------
// Helpers
// ------------------------------------

/**
 * Generate a unique event ID for deduplication between
 * the browser pixel and CAPI. The same ID is passed to
 * fbq() via the eventID option and to CAPI in event_id.
 */
function generateEventId() {
  return 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}



/**
 * Build the user_data object, hashing any PII fields.
 * Only includes a field when a value is actually available.
 */
async function buildUserData(extras) {
  const userData = {};

  const fbp = clientParamBuilder.getFbp();
  if (fbp) userData.fbp = fbp;

  const fbc = clientParamBuilder.getFbc();
  if (fbc) userData.fbc = fbc;

  if (extras && extras.email) {
    const hashed = await clientParamBuilder.getNormalizedAndHashedPII(extras.email, 'email');
    if (hashed) userData.em = [hashed];
  }

  if (extras && extras.phone) {
    const hashed = await clientParamBuilder.getNormalizedAndHashedPII(extras.phone, 'phone');
    if (hashed) userData.ph = [hashed];
  }

  const clientIpAddress = clientParamBuilder.getClientIpAddress();
  if (clientIpAddress) userData.client_ip_address = clientIpAddress;

  userData.client_user_agent = navigator.userAgent;

  return userData;
}

// ------------------------------------
// Core CAPI send function
// ------------------------------------

/**
 * Send one event to the Meta Conversions API.
 *
 * @param {string}  eventName   - Standard or custom event name (e.g. 'Purchase')
 * @param {string}  eventId     - Deduplication ID shared with fbq()
 * @param {object}  customData  - Event-specific payload (value, currency, contents, …)
 * @param {object}  userExtras  - Optional PII: { email, phone }
 */
async function sendCapiEvent(eventName, eventId, customData, userExtras) {
  try {
    const userData = await buildUserData(userExtras);

    const payload = {
      test_event_code: CAPI_TEST_EVENT_CODE,
      data: [
        {
          event_name:    eventName,
          event_time:    Math.floor(Date.now() / 1000),
          event_id:      eventId,
          event_source_url: window.location.href,
          action_source: 'website',
          user_data:     userData,
          custom_data:   customData || {}
        }
      ]
    };

    const response = await fetch(CAPI_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('[CAPI] Event send failed:', eventName, err);
    } else {
      console.log('[CAPI] Event sent:', eventName, eventId);
    }
  } catch (e) {
    console.warn('[CAPI] Network error sending event:', eventName, e);
  }
}

// ------------------------------------
// Public event helpers
// ------------------------------------

/**
 * Track a PageView — call once per page load.
 * Fires both the browser pixel and CAPI with the same event_id.
 */
function capiTrackPageView() {
  const eventId = generateEventId();
  // Browser pixel (deduplication via eventID option)
  if (typeof fbq === 'function') {
    fbq('track', 'PageView', {}, { eventID: eventId });
  }
  // CAPI
  sendCapiEvent('PageView', eventId, {});
}

/**
 * Track AddToCart.
 * @param {string} productName
 * @param {number} price
 */
function capiTrackAddToCart(productName, price) {
  const eventId = generateEventId();
  const customData = {
    content_name: productName,
    content_type: 'product',
    contents:     [{ id: productName, quantity: 1 }],
    value:        price,
    currency:     'USD'
  };
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', customData, { eventID: eventId });
  }
  sendCapiEvent('AddToCart', eventId, customData);
}

/**
 * Track InitiateCheckout.
 * @param {number} totalValue  - Cart total
 * @param {Array}  contents    - Array of { id, quantity } objects
 */
function capiTrackInitiateCheckout(totalValue, contents) {
  const eventId = generateEventId();
  const customData = {
    value:    totalValue,
    currency: 'USD',
    contents: contents || [],
    content_type: 'product'
  };
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', customData, { eventID: eventId });
  }
  sendCapiEvent('InitiateCheckout', eventId, customData);
}

/**
 * Track Purchase.
 * @param {number} totalValue
 * @param {Array}  contents    - Array of { id, quantity } objects
 * @param {object} userExtras  - Optional PII: { email, phone }
 */
function capiTrackPurchase(totalValue, contents, userExtras) {
  const eventId = generateEventId();
  const customData = {
    value:    totalValue,
    currency: 'USD',
    contents: contents || [],
    content_type: 'product'
  };
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', customData, { eventID: eventId });
  }
  sendCapiEvent('Purchase', eventId, customData, userExtras);
}
