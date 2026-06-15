import type { ViewConfig } from '@/types';

export function exportViewConfig(config: ViewConfig, filename: string = 'orbital-config.json'): void {
  const dataStr = JSON.stringify(config, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importViewConfig(file: File): Promise<ViewConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as ViewConfig;
        resolve(config);
      } catch (err) {
        reject(new Error('Invalid config file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read config file'));
    reader.readAsText(file);
  });
}
