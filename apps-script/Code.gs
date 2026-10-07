/**
 * ТЗ для замірника · ESCORE — серверна частина (Apps Script).
 *
 * Що робить: приймає від сайту текст запиту, перевіряє, що користувач увійшов
 * через Google і є в списку дозволених, і пересилає запит у Claude API.
 * Ключ API зберігається тут, у властивостях скрипта, і не потрапляє на сайт.
 *
 * Властивості скрипта (Project Settings → Script properties):
 *   ANTHROPIC_API_KEY — ключ з console.anthropic.com (обов'язково)
 *   CLIENT_ID         — OAuth Client ID сайту (той самий, що в index.html)
 *   ALLOWED_EMAILS    — дозволені email через кому (порожньо = будь-хто з доступом до OAuth-клієнта)
 *   MODEL             — модель Claude (необов'язково, за замовчуванням нижче)
 */

const MODEL_DEFAULT = 'claude-sonnet-5-5';
const MAX_PROMPT_CHARS = 200000;

function doPost(e) {
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();

    const email = verifyUser_(req.token, props.getProperty('CLIENT_ID'));
    const allowed = (props.getProperty('ALLOWED_EMAILS') || '')
      .toLowerCase().split(/[\s,;]+/).filter(String);
    if (!email || (allowed.length && allowed.indexOf(email) === -1)) {
      return json_({ ok: false, error: 'forbidden' });
    }

    const key = props.getProperty('ANTHROPIC_API_KEY');
    if (!key) return json_({ ok: false, error: 'no_key' });

    const prompt = String(req.prompt || '');
    if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
      return json_({ ok: false, error: 'bad_request' });
    }

    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({
        model: props.getProperty('MODEL') || MODEL_DEFAULT,
        max_tokens: 6000,
        messages: [{ role: 'user', content: prompt }]
      }),
      muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    const body = JSON.parse(res.getContentText() || '{}');
    if (code !== 200) {
      return json_({ ok: false, error: 'anthropic',
        message: (body.error && body.error.message) || ('HTTP ' + code) });
    }

    const text = (body.content || [])
      .filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; }).join('');

    console.log('TZ filled by ' + email + ', tokens in/out: ' +
      (body.usage ? body.usage.input_tokens + '/' + body.usage.output_tokens : '?'));

    return json_({ ok: true, text: text, usage: body.usage || null });
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err) });
  }
}

/** Перевірка: це справжній вхід Google через наш сайт. Повертає email або null. */
function verifyUser_(token, clientId) {
  if (!token) return null;
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' +
    encodeURIComponent(token), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const t = JSON.parse(r.getContentText());
  if (clientId && t.azp !== clientId && t.aud !== clientId) return null;
  if (String(t.email_verified) !== 'true') return null;
  return String(t.email || '').toLowerCase() || null;
}

/** Перевірка, що веб-додаток працює: відкрийте його URL у браузері. */
function doGet() {
  return json_({ ok: true, service: 'tz-zamirnyk' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
