import { useEffect, useRef, useState } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, FileWarning, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui';
import apiClient from '@/lib/axios';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

type PdfPreviewProps = {
  source: string | Blob | File;
  title?: string;
  heightClassName?: string;
};

type PdfJsModule = typeof import('pdfjs-dist');

type RenderTask = {
  cancel: () => void;
  promise: Promise<void>;
};

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs() {
  pdfJsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return pdfjs;
  });
  return pdfJsPromise;
}

function toInternalApiPath(url: string) {
  const value = url.trim();
  if (!value) return '';

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/api\/v1/, '');
  }

  try {
    const apiBase = new URL(apiClient.defaults.baseURL || '', window.location.origin);
    const parsed = new URL(value);
    if (parsed.origin === apiBase.origin && parsed.pathname.startsWith('/api/v1/content/files/')) {
      return `${parsed.pathname.replace(/^\/api\/v1/, '')}${parsed.search}`;
    }
  } catch {
    return '';
  }

  return '';
}

async function readPdfSource(source: PdfPreviewProps['source']) {
  if (source instanceof Blob) {
    return new Uint8Array(await source.arrayBuffer());
  }

  const internalPath = toInternalApiPath(source);
  if (internalPath) {
    const response = await apiClient.get<ArrayBuffer>(internalPath, { responseType: 'arraybuffer' });
    return new Uint8Array(response.data);
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error('Không tải được file PDF.');
  }
  return new Uint8Array(await response.arrayBuffer());
}

export default function PdfPreview({ source, title = 'PDF preview', heightClassName = 'h-[680px]' }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedDocument: PDFDocumentProxy | null = null;

    void Promise.resolve().then(async () => {
      setLoading(true);
      setRendering(false);
      setError(null);
      setDocument(null);
      setPageCount(0);
      setPageNumber(1);

      try {
        const pdfjs = await loadPdfJs();
        const data = await readPdfSource(source);
        const loadingTask = pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        loadedDocument = pdf;
        setDocument(pdf);
        setPageCount(pdf.numPages);
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : 'Không xem trước được file PDF.';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (loadedDocument) {
        void loadedDocument.destroy();
      }
    };
  }, [source]);

  useEffect(() => {
    if (!document || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: RenderTask | null = null;

    void Promise.resolve().then(async () => {
      setRendering(true);
      try {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) {
          throw new Error('Không khởi tạo được vùng xem PDF.');
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        context.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (renderError) {
        const isCancelled = renderError instanceof Error && renderError.name === 'RenderingCancelledException';
        if (!cancelled && !isCancelled) {
          setError(renderError instanceof Error ? renderError.message : 'Không render được trang PDF.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [document, pageNumber, scale]);

  const canGoPrevious = pageNumber > 1;
  const canGoNext = pageNumber < pageCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500">
            {pageCount > 0 ? `Trang ${pageNumber} / ${pageCount}` : 'Đang chuẩn bị tài liệu'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canGoPrevious || loading}
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canGoNext || loading}
            onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => setScale((current) => Math.max(0.8, Number((current - 0.2).toFixed(1))))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => setScale(1.2)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => setScale((current) => Math.min(2.2, Number((current + 0.2).toFixed(1))))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`${heightClassName} overflow-auto bg-slate-100 p-4`}>
        {loading ? (
          <div className="skeleton h-full min-h-80 rounded-xl" />
        ) : error ? (
          <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
            <FileWarning className="h-10 w-10" />
            <p className="max-w-md text-sm font-medium">{error}</p>
            <p className="max-w-md text-xs text-red-600">
              Nếu đây là URL ngoài hệ thống, máy chủ đó cần cho phép CORS để SageLMS xem trước nội dung.
            </p>
          </div>
        ) : (
          <div className="flex min-h-full justify-center">
            <div className="relative">
              {rendering && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
              )}
              <canvas ref={canvasRef} className="max-w-full rounded-lg bg-white shadow-sm" aria-label={title} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
