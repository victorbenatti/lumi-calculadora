import type { ChangeEvent } from 'react';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface ImageUploaderProps {
  preview: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUploader({ preview, onChange }: ImageUploaderProps) {
  return (
    <div className="space-y-2">
      <Label className="text-brand-brown">Imagem do Produto</Label>
      <div className="flex items-center gap-4">
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 object-cover rounded-md border border-brand-brown/20"
          />
        )}
        <Input
          type="file"
          accept="image/*"
          onChange={onChange}
          className="border-brand-brown/20 focus-visible:ring-brand-brown text-brand-brown cursor-pointer"
        />
      </div>
    </div>
  );
}
