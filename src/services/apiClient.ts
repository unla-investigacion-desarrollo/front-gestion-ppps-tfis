export const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export interface ApiRequestOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
  signal?: AbortSignal;
  errorMessage?: string;
  nullOn404?: boolean;
  headers?: Record<string, string>;
}

/**
 * Parsea la respuesta HTTP y lanza un Error legible si el status no es exitoso.
 */
export async function parseApiResponse<T = any>(
  res: Response,
  defaultErrorMessage = 'Error en la comunicación con el servidor'
): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let parsedError: any = null;
    try {
      parsedError = JSON.parse(text);
    } catch {}
    const rawMsg =
      parsedError?.message ??
      (Array.isArray(parsedError?.errors) ? parsedError.errors : parsedError?.error);
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(', ')
      : rawMsg || text || `${defaultErrorMessage} (Status ${res.status})`;
    throw new Error(message);
  }

  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

/**
 * Ejecuta una petición HTTP contra API_URL con headers estándar y manejo unificado de errores.
 */
export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    token,
    body,
    signal,
    errorMessage,
    nullOn404 = false,
    headers: customHeaders = {},
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as BodyInit) : JSON.stringify(body),
    signal,
  });

  if (nullOn404 && res.status === 404) {
    return null as T;
  }

  return parseApiResponse<T>(res, errorMessage);
}
