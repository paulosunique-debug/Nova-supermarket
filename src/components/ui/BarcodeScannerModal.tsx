import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Camera, AlertCircle, RefreshCw, X, Zap } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from '../../hooks/useTranslation';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
}

const FAST_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE
];

// The native BarcodeDetector API (when available) is hardware-accelerated and
// scans dramatically faster than a JS-based decoder like ZXing.
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export function BarcodeScannerModal({ open, onClose, onDetected, title }: BarcodeScannerModalProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    detectedRef.current = false;
    let cancelled = false;

    function fire(code: string) {
      if (detectedRef.current || cancelled) return;
      detectedRef.current = true;
      onDetected(code);
      onClose();
    }

    async function runNativeDetector(stream: MediaStream) {
      const detector = new window.BarcodeDetector!({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
      });
      setFastMode(true);
      const video = videoRef.current!;
      const scanFrame = async () => {
        if (cancelled || detectedRef.current) return;
        if (video.readyState >= 2) {
          try {
            const results = await detector.detect(video);
            if (results.length > 0) {
              fire(results[0].rawValue);
              return;
            }
          } catch {
            // ignore transient decode errors and keep scanning
          }
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      };
      rafRef.current = requestAnimationFrame(scanFrame);
      controlsRef.current = {
        stop: () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }
      };
    }

    async function runZxingFallback(chosenDeviceId: string | undefined) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, FAST_FORMATS);
      hints.set(DecodeHintType.TRY_HARDER, false);
      const reader = new BrowserMultiFormatReader(hints); // scan every ~60ms instead of the ~500ms default
      const controls = await reader.decodeFromVideoDevice(chosenDeviceId, videoRef.current!, (result) => {
        if (result) fire(result.getText());
      });
      controlsRef.current = controls;
    }

    async function start() {
      try {
        const videoInputs = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        setDevices(videoInputs);

        const rear = videoInputs.find((d) => /back|rear|environment/i.test(d.label));
        const chosen = deviceId ?? rear?.deviceId ?? videoInputs[videoInputs.length - 1]?.deviceId;
        setDeviceId(chosen);
        if (!videoRef.current) return;
        setScanning(true);

        if (typeof window.BarcodeDetector !== 'undefined') {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: chosen ? { deviceId: { exact: chosen } } : { facingMode: 'environment' }
          });
          if (cancelled) {
            stream.getTracks().forEach((tr) => tr.stop());
            return;
          }
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          await runNativeDetector(stream);
        } else {
          setFastMode(false);
          await runZxingFallback(chosen);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera permissions and try again.'
            : e?.name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : 'Could not start the camera. You can type the code in manually instead.'
        );
        setScanning(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      setScanning(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deviceId]);

  return (
    <Modal open={open} onClose={onClose} title={title ?? 'Scan Barcode'} size="sm">
      <div className="flex flex-col gap-3">
        {error ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-tomato-200 bg-tomato-50 p-6 text-center text-sm text-tomato-600 dark:border-tomato-500/30 dark:bg-tomato-500/10">
            <AlertCircle className="h-6 w-6" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-market-400/80" />
            {scanning && (
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {fastMode && <Zap className="h-3 w-3 text-citrus-400" />}
                Point the camera at a barcode…
              </div>
            )}
          </div>
        )}

        {devices.length > 1 && !error && (
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-slate2-400" />
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="h-8 flex-1 rounded-lg border border-slate2-200 bg-white px-2 text-xs dark:border-slate2-600 dark:bg-slate2-800 dark:text-slate2-50"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          {error && (
            <Button variant="outline" className="flex-1" onClick={() => setError(null)}>
              <RefreshCw className="h-4 w-4" /> {t('common_reset')}
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4" /> {t('common_cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
