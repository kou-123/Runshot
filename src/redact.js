const SENSITIVE =
  /(?:secret|token|password|passwd|api[_-]?key|access[_-]?key|private[_-]?key|authorization|credential|auth)/i;

export function isSensitiveKey(key) {
  return SENSITIVE.test(key);
}

export function redactEnv(env = process.env) {
  const safe = {};
  const keys = [];

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    keys.push(key);
    safe[key] = isSensitiveKey(key) ? "***REDACTED***" : value;
  }

  keys.sort();
  return { safe, keys };
}

export function redactText(text) {
  return text
    .replace(/\b(Authorization:\s*Bearer\s+)([^\s]+)/gi, "$1***REDACTED***")
    .replace(
      /\b([A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|API[_-]?KEY|ACCESS[_-]?KEY)[A-Za-z0-9_]*)\s*[=:]\s*([^\s'"]+)/gi,
      "$1=***REDACTED***",
    );
}
