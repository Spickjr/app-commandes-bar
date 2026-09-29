// Applique le thème avant hydration pour éviter le flash. Lit la préférence
// stockée en localStorage, sinon suit prefers-color-scheme.
export function ThemeScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem('pilot-theme');
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
