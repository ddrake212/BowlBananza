export function generateRandomString(length: number): string {
  if (length <= 0) return '';

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const charCount = chars.length;
  let result = '';

  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % charCount];
  }

  return result;
}
