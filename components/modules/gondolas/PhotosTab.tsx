import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,DialogTrigger,DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import type { Photo } from '@/types/photo'

export default function PhotosTab({ gondolaId }: { gondolaId: string }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [photoCategory, setPhotoCategory] = useState<string>("");
  const [photoDescription, setPhotoDescription] = useState<string>("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all photos for this gondola
  useEffect(() => {
    async function fetchPhotos() {
      if (!gondolaId) return;
      try {
        const res = await fetch(`/api/gondola/${gondolaId}/photos`);
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch photos');
        const data = await res.json();
        setPhotos(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch photos');
      }
    }
    fetchPhotos();
  }, [gondolaId]);

  const handleUploadPhotos = async () => {
    setError(null);
    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Please select at least one photo to upload");
      return;
    }
    if (!photoCategory) {
      setError("Please select a category");
      return;
    }
    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (!file.type.startsWith('image/')) {
          setError(`File ${file.name} is not an image.`);
          setUploading(false);
          return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          setError(`File ${file.name} exceeds 10MB size limit.`);
          setUploading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', photoCategory);
        formData.append('description', photoDescription);
        const res = await fetch(`/api/gondola/${gondolaId}/photos`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errMsg = (await res.json()).error || `Failed to upload ${file.name}`;
          setError(errMsg);
          setUploading(false);
          return;
        }
      }
      // Refresh photo list
      const res = await fetch(`/api/gondola/${gondolaId}/photos`);
      setPhotos(res.ok ? await res.json() : []);
      setIsUploadDialogOpen(false);
      setSelectedFiles(null);
      setPhotoCategory("");
      setPhotoDescription("");
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo(s)');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Photos</h2>
            <p className="text-gray-500">Images of the gondola installation and setup</p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Upload Photos</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Photos</DialogTitle>
                <DialogDescription>Upload photos of the gondola installation and setup</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="photos">Select Photos</Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                  />
                  {selectedFiles && selectedFiles.length > 0 && (
                    <p className="text-sm text-green-600">{selectedFiles.length} file(s) selected</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoCategory">Category</Label>
                  <Select name="photoCategory" value={photoCategory} onValueChange={setPhotoCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoDescription">Description</Label>
                  <Textarea id="photoDescription" value={photoDescription} onChange={e => setPhotoDescription(e.target.value)} placeholder="Add a description for these photos" />
                </div>
                {error && (
                  <p className="text-red-500">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleUploadPhotos} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.length > 0 ? (
            photos.map(photo => (
              <div key={photo.id} className="border rounded-md overflow-hidden">
                <Image
                  src={photo.fileDataBase64 ? `data:${photo.mimeType || 'image/jpeg'};base64,${photo.fileDataBase64}` : `/api/gondola/photo/${photo.id}/serve`}
                  alt={photo.fileName || "Gondola Photo"}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-medium">{photo.fileName}</p>
                  {photo.uploaded && <p className="text-xs text-gray-500">Uploaded: {new Date(photo.uploaded).toLocaleDateString()}</p>}
                  {photo.category && <p className="text-xs text-gray-400">Category: {photo.category}</p>}
                  {photo.description && <p className="text-xs text-gray-400">{photo.description}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="border rounded-md overflow-hidden flex flex-col items-center justify-center h-48 bg-gray-100 col-span-4">
              <span className="text-gray-400">No photos uploaded</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



