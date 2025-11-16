import type { FC } from 'react';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';

interface PhotoEditorModalProps {
  imageUrl: string;
  onSave: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export const PhotoEditorModal: FC<PhotoEditorModalProps> = ({
  imageUrl,
  onSave,
  onCancel,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (): Promise<Blob> => {
    if (!croppedAreaPixels) {
      throw new Error('No crop area defined');
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to desired output size (300x300 for profile photos)
        const outputSize = 300;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Draw cropped image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outputSize,
          outputSize
        );

        // Convert to blob with compression (0.9 quality for JPEG)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          0.9
        );
      };

      image.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      image.src = imageUrl;
    });
  };

  const handleSave = async () => {
    try {
      setProcessing(true);
      const croppedImage = await createCroppedImage();
      onSave(croppedImage);
    } catch (err) {
      console.error('Failed to crop image:', err);
      alert('Fout bij verwerken van foto');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-card shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="p-6 border-b border-card-border">
          <h2 className="text-2xl font-light text-navy">Foto bijsnijden</h2>
          <p className="text-sm text-text-muted mt-1">
            Sleep en zoom om de gewenste uitsnede te selecteren
          </p>
        </div>

        {/* Crop Area */}
        <div className="relative h-96 bg-gray-100">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom Control */}
        <div className="p-6 border-b border-card-border">
          <label className="block text-sm font-medium text-navy mb-2">
            Zoom
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>

        {/* Actions */}
        <div className="p-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-6 py-2.5 border border-card-border text-navy rounded-button hover:bg-background transition-colors disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="px-6 py-2.5 bg-accent text-white rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {processing ? 'Verwerken...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};
