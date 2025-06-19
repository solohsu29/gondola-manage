import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';

interface ProfilePhotoUploadProps {
  photoUrl: string;
  onUploaded: (url: string) => void;
}

export default function ProfilePhotoUpload({ photoUrl, onUploaded }: ProfilePhotoUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  setError(null);
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      setError('File must be an image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB size limit.');
      return;
    }
    setSelectedFile(file);
    // Create Data URL for instant preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      onUploaded(reader.result as string);
    };
    reader.readAsDataURL(file);
  } else {
    setSelectedFile(null);
    setPreviewUrl(null);
  }
};

  const handleUpload = async () => {
  if (!selectedFile) {
    setError('Please select a photo to upload.');
    return;
  }
  setUploading(true);
  setError(null);
  const prevPhotoUrl = photoUrl;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    const res = await fetch('/api/profile/photo/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to upload photo.');
      // Revert preview if upload fails
      setPreviewUrl(null);
      onUploaded(prevPhotoUrl);
      setUploading(false);
      return;
    }
    // Optionally: onUploaded(data.url); // If you want to swap to backend URL later
    setIsDialogOpen(false);
    setSelectedFile(null);
  } catch (err: any) {
    setError(err.message || 'Failed to upload photo.');
    setPreviewUrl(null);
    onUploaded(prevPhotoUrl);
  } finally {
    setUploading(false);
  }
};

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Change Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="profile-photo">Select Photo</Label>
            <Input
              id="profile-photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="py-[13px]"
            />
            {selectedFile && previewUrl && (
  <div className="flex flex-col items-center">
    <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover mb-2" />
    <p className="text-sm text-green-600">{selectedFile.name}</p>
  </div>
)}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
