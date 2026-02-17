/**
 * Проверка загрузки .env и наличия ключей (без вывода значений).
 * Вызывается при старте и в GET /health для диагностики.
 */

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
const OPTIONAL = ['SUPABASE_SERVICE_ROLE_KEY', 'CEREBRAS_API_KEY', 'CEREBRAS_MODEL', 'LLM_SERVICE_URL', 'SYNTHESIS_LLM_URL'] as const;

function hasValue(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.trim().length > 0;
}

/** Проверяет наличие ключей. Требуем хотя бы один из SUPABASE_ANON_KEY или SUPABASE_SERVICE_ROLE_KEY */
export function getEnvStatus(): {
  ok: boolean;
  required: Record<string, boolean>;
  optional: Record<string, boolean>;
  missing: string[];
} {
  const supabaseKey = hasValue('SUPABASE_ANON_KEY') || hasValue('SUPABASE_SERVICE_ROLE_KEY');
  const required: Record<string, boolean> = {
    SUPABASE_URL: hasValue('SUPABASE_URL'),
    SUPABASE_KEY: supabaseKey,
  };
  const optional: Record<string, boolean> = {};
  for (const key of OPTIONAL) {
    optional[key] = hasValue(key);
  }

  const missing: string[] = [];
  if (!required.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!required.SUPABASE_KEY) missing.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');

  return {
    ok: missing.length === 0,
    required,
    optional,
    missing,
  };
}

/** Логирует статус env при старте */
export function logEnvStatus(): void {
  const status = getEnvStatus();
  console.log('📋 Env check:');
  console.log('   SUPABASE_URL:', status.required.SUPABASE_URL ? '✓ set' : '✗ missing');
  console.log('   SUPABASE_KEY (anon or service_role):', status.required.SUPABASE_KEY ? '✓ set' : '✗ missing');
  console.log('   CEREBRAS_API_KEY:', status.optional.CEREBRAS_API_KEY ? '✓ set' : '– not set');
  console.log('   LLM_SERVICE_URL:', status.optional.LLM_SERVICE_URL ? '✓ set' : '– not set');
  console.log('   SYNTHESIS_LLM_URL:', status.optional.SYNTHESIS_LLM_URL ? '✓ set' : '– not set');
  if (status.missing.length > 0) {
    console.warn('⚠️  Missing required:', status.missing.join(', '), '→ set them in .env');
  }
}
