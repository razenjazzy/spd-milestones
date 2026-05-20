/**
 * Utility functions for exporting Gantt charts
 */

export interface ExportOptions {
  filename?: string;
  containerId?: string;
  copyToClipboard?: boolean;
  showSuccessMessage?: (message: string) => void;
  showErrorMessage?: (message: string) => void;
}

/**
 * Exports a Gantt chart as PNG image
 * @param options - Export configuration options
 */
export const exportGanttChart = async (options: ExportOptions = {}) => {
  const {
    filename = 'gantt-chart',
    containerId = 'gantt-chart-container',
    copyToClipboard = true,
    showSuccessMessage,
    showErrorMessage,
  } = options;

  try {
    const container = document.querySelector(`#${containerId}`) as HTMLElement | null;
    if (!container) {
      showErrorMessage?.('Chart container not found');
      return;
    }

    const svg = container.querySelector('svg');
    if (!svg) {
      await exportElementAsImage({
        containerId,
        filename,
        copyToClipboard,
        showSuccessMessage,
        showErrorMessage,
      });
      return;
    }

    // Serialize SVG to string
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    
    img.onload = async () => {
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        showErrorMessage?.('Failed to create canvas context');
        return;
      }

      // Fill white background and draw image
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Try to copy to clipboard first
      if (copyToClipboard) {
        try {
          const blob = await new Promise<Blob | null>((resolve) => 
            canvas.toBlob((b) => resolve(b), 'image/png')
          );
          
          if (blob && 'clipboard' in navigator && 'ClipboardItem' in window) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob })
            ]);
            showSuccessMessage?.('Chart copied to clipboard');
            return;
          }
        } catch (clipboardError) {
          console.warn('Clipboard API failed, falling back to download', clipboardError);
        }
      }

      // Fallback: trigger download
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSuccessMessage?.('Chart downloaded as PNG');
    };

    img.onerror = () => {
      showErrorMessage?.('Failed to load chart image');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error('Export failed:', error);
    showErrorMessage?.('Failed to export chart');
  }
};

/**
 * Prints the current page
 */
export const printChart = () => {
  window.print();
};

export interface ElementExportOptions {
  containerId: string;
  filename?: string;
  copyToClipboard?: boolean;
  showSuccessMessage?: (message: string) => void;
  showErrorMessage?: (message: string) => void;
}

type Html2CanvasFn = (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;

async function loadHtml2Canvas(): Promise<Html2CanvasFn | null> {
  const existing = (window as any).html2canvas as Html2CanvasFn | undefined;
  if (existing) return existing;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  }).catch(() => undefined);

  return ((window as any).html2canvas as Html2CanvasFn | undefined) || null;
}

async function tryCaptureWithHtml2Canvas(node: HTMLElement): Promise<HTMLCanvasElement | null> {
  const html2canvas = await loadHtml2Canvas();
  if (!html2canvas) return null;

  const width = Math.max(node.clientWidth, node.scrollWidth);
  const height = Math.max(node.clientHeight, node.scrollHeight);
  const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  return html2canvas(node, {
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    width,
    height,
    scale,
    logging: false,
    onclone: (clonedDoc: Document) => {
      const clone = clonedDoc.getElementById(node.id);
      if (clone) {
        (clone as HTMLElement).style.overflow = 'visible';
      }
    },
  }) as Promise<HTMLCanvasElement>;
}

async function copyOrDownloadCanvas(params: {
  canvas: HTMLCanvasElement;
  filename: string;
  copyToClipboard: boolean;
  showSuccessMessage?: (message: string) => void;
}) {
  const { canvas, filename, copyToClipboard, showSuccessMessage } = params;

  if (copyToClipboard) {
    try {
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
      if (pngBlob && 'clipboard' in navigator && 'ClipboardItem' in window) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': pngBlob }),
        ]);
        showSuccessMessage?.('Image copied to clipboard');
        return;
      }
    } catch {
      // Fall back to download.
    }
  }

  const pngUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showSuccessMessage?.('Image downloaded as PNG');
}

function getInlineStyleText(): string {
  const styleTags = Array.from(document.querySelectorAll('style'));
  return styleTags.map((tag) => tag.textContent || '').join('\n');
}

export const exportElementAsImage = async (options: ElementExportOptions) => {
  const {
    containerId,
    filename = 'capture',
    copyToClipboard = true,
    showSuccessMessage,
    showErrorMessage,
  } = options;

  try {
    const node = document.querySelector(`#${containerId}`) as HTMLElement | null;
    if (!node) {
      showErrorMessage?.('Target container not found');
      return;
    }

    const directCanvas = await tryCaptureWithHtml2Canvas(node);
    if (directCanvas) {
      await copyOrDownloadCanvas({
        canvas: directCanvas,
        filename,
        copyToClipboard,
        showSuccessMessage,
      });
      return;
    }

    const rect = node.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    if (width <= 0 || height <= 0) {
      showErrorMessage?.('Target container is empty');
      return;
    }

    const clonedHtml = node.cloneNode(true) as HTMLElement;
    clonedHtml.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

    const styleText = getInlineStyleText();
    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;background:#fff;">
            <style>${styleText}</style>
            ${clonedHtml.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        showErrorMessage?.('Canvas context unavailable');
        URL.revokeObjectURL(url);
        return;
      }

      ctx.scale(pixelRatio, pixelRatio);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      await copyOrDownloadCanvas({
        canvas,
        filename,
        copyToClipboard,
        showSuccessMessage,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showErrorMessage?.('Failed to render image');
    };

    img.src = url;
  } catch (error) {
    console.error(error);
    showErrorMessage?.('Failed to export image');
  }
};