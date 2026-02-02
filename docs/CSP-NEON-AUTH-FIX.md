# CSP Inline Style Fix for Neon Auth

**Date:** February 2, 2026  
**Issue:** Neon Auth UI components blocked by CSP  
**Status:** ✅ RESOLVED

---

## Problem

Neon Auth UI components were being blocked by CSP with these errors:

```
Applying inline style violates the following Content Security Policy directive 
'style-src 'self' 'unsafe-inline' 'nonce-XXX''. 
Note that 'unsafe-inline' is ignored if either a hash or nonce value is present 
in the source list. The action has been blocked.
```

---

## Root Cause

**CSP Specification Behavior:**

When you include a `nonce` or `hash` in the `style-src` directive, the browser **completely ignores** `'unsafe-inline'`. This is by design in the CSP specification.

**Our Previous Configuration:**
```typescript
style-src 'self' 'unsafe-inline' 'nonce-${nonce}';
```

This meant:
- ✅ Nonce-based styles would work
- ❌ `'unsafe-inline'` was IGNORED (due to nonce being present)
- ❌ Neon Auth UI components applying inline styles were BLOCKED

---

## Solution

**Remove the nonce from `style-src`:**

```diff
- style-src 'self' 'unsafe-inline' 'nonce-${nonce}';
+ style-src 'self' 'unsafe-inline';
```

### Why This Works

1. **Neon Auth Compatibility:** Neon Auth UI components use inline styles (via React's `style` prop) and don't support nonces
2. **Still Secure:** External stylesheets still require `'self'`, only inline styles are allowed
3. **React Inline Styles:** All React components using `style={{...}}` work correctly
4. **No Breaking Changes:** All existing styles continue to work

---

## File Changed

**[proxy.ts](../proxy.ts#L13-L26)**

```typescript
// Content Security Policy
// NOTE: Neon Auth UI components require 'unsafe-inline' - nonce is NOT used for styles
// because when nonce is present, 'unsafe-inline' is ignored per CSP spec
const cspHeader = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'sha256-rbbnijHn7DZ6ps39myQ3cVQF1H+U/PJfHh5ei/Q2kb8=' ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://images.unsplash.com;
  font-src 'self';
  connect-src 'self' ${isDev ? "ws: wss:" : ""};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
```

---

## Security Impact

### What Changed

- **Before:** `style-src 'self' 'unsafe-inline' 'nonce-XXX'`
  - Only nonce-based inline styles allowed
  - `'unsafe-inline'` ignored
  - Neon Auth blocked

- **After:** `style-src 'self' 'unsafe-inline'`
  - All inline styles allowed
  - External stylesheets still require `'self'`
  - Neon Auth works

### Security Considerations

**Still Protected Against:**
- ✅ External stylesheet injection (requires `'self'`)
- ✅ Cross-site script attacks (via `script-src` nonce)
- ✅ Inline script injection (requires nonce)

**Trade-off:**
- ⚠️ Inline styles from any source are now allowed
- This is standard for React applications using inline styles
- Alternative would be to extract all inline styles to CSS classes (not practical for Neon Auth UI)

---

## Testing

After the fix, verify:

1. **No CSP Violations:**
   ```
   Open Browser DevTools → Console
   Should see NO "Applying inline style violates..." errors
   ```

2. **Neon Auth UI Works:**
   ```
   Visit: http://localhost:3000/auth/sign-in
   Should see styled auth page with no console errors
   ```

3. **CSP Header Correct:**
   ```
   Open Browser DevTools → Network → Select any request
   Response Headers → Content-Security-Policy
   Should NOT contain 'nonce-XXX' in style-src
   ```

---

## References

- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/#directive-style-src)
- [MDN: style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src)
- [Neon Auth UI Components](https://neon.com/docs/auth/reference/ui-components)

---

## Related Issues

- ✅ Neon Auth inline styles now work
- ✅ React `style={{...}}` prop works
- ✅ Next.js dynamic styles work
- ✅ No breaking changes to existing code
