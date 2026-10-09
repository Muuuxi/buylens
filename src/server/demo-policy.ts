// Live access is an explicit deployment choice.
export function publicDemoOnly() {
  return process.env.BUYLENS_LIVE_ENABLED !== 'true';
}
