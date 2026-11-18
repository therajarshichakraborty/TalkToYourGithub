export const SIGN_IN_PATH = "/sign-in";
export const DEFAULT_AUTH_CALLBACK = "/dashboard";

const ORIGIN = "http://internal.invalid";

export function getSafeCallbackPath(
  callbackUrl: string | null | undefined,
): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || /[\\\u0000-\u001f]/.test(callbackUrl)) {
    return DEFAULT_AUTH_CALLBACK;
  }

  try {
    const url = new URL(callbackUrl, ORIGIN);
    if (url.origin !== ORIGIN || url.pathname.startsWith("//")) {
      return DEFAULT_AUTH_CALLBACK;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_CALLBACK;
  }
}
