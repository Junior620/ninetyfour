/**
 * Select one complete environment family; never mix credentials across projects.
 * Pure resolver shared by server code and the explicit administrator bootstrap.
 * @param {Record<string, string | undefined>} env
 */
export function resolveLabConfig(env) {
  const dedicated = [
    env.MATCHLAB_SUPABASE_URL,
    env.MATCHLAB_SUPABASE_ANON_KEY,
    env.MATCHLAB_SUPABASE_SERVICE_ROLE_KEY,
  ].some((value) => Boolean(value?.trim()));
  return dedicated
    ? {
        url: env.MATCHLAB_SUPABASE_URL?.trim() || undefined,
        key: env.MATCHLAB_SUPABASE_ANON_KEY?.trim() || undefined,
        serviceKey: env.MATCHLAB_SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
      }
    : {
        url: env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined,
        key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined,
        serviceKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
      };
}
