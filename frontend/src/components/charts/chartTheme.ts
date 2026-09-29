export function getChartTheme() {
    const style = getComputedStyle(document.documentElement);
    const cssVar = (name: string) => style.getPropertyValue(name).trim();

    return {
        text: cssVar('--text-color'),
        textSecondary: cssVar('--text-color-secondary'),
        border: cssVar('--surface-border'),
        primary: cssVar('--primary-color'),
        green: cssVar('--green-500'),
        red: cssVar('--red-500'),
    };
}