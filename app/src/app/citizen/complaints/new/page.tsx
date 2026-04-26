'use client';

import { useState, useTransition, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, AlertCircle, ImagePlus, X, Upload } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { submitComplaint } from '@/lib/actions/complaints';
import { COMPLAINT_CATEGORIES } from '@/lib/complaint-workflow';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

// Styled native select — avoids Base UI FormData bugs entirely
function NativeSelect({
  name, value, onChange, placeholder, children, required, className,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={`w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:border-[#1B3A6B] disabled:opacity-50 ${className ?? ''}`}
    >
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
  );
}

function NewComplaintForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [departments, setDepartments] = useState<{ department_id: string; department_name: string }[]>([]);
  const [departmentId, setDepartmentId] = useState(searchParams.get('dept') || '');
  const [category, setCategory]         = useState('');
  const [charCount, setCharCount]       = useState(0);
  const [selectedPriority, setSelectedPriority] = useState('Normal');

  // Image state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl]   = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('departments')
      .select('department_id, department_name')
      .order('department_name')
      .then(({ data }) => { if (data) setDepartments(data); });
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP and GIF images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    setImageFile(file);
    setUploadedUrl(null);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImageToStorage(): Promise<string | null> {
    if (!imageFile) return null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext  = imageFile.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('complaint-images')
      .upload(path, imageFile, { upsert: false, contentType: imageFile.type });

    if (error) {
      const msg = error.message ?? String(error);
      if (msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')) {
        toast.error('Storage bucket not set up. Create a "complaint-images" bucket in Supabase Dashboard → Storage.', { duration: 7000 });
      } else if (msg.toLowerCase().includes('policy') || msg.toLowerCase().includes('unauthorized') || msg.includes('403')) {
        toast.error('Upload permission denied. Apply the storage RLS policies in Supabase SQL Editor.', { duration: 7000 });
      } else {
        toast.error(`Upload failed: ${msg}`);
      }
      console.error('[storage upload error]', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!departmentId) {
      toast.error('Please select a department.');
      return;
    }

    // Capture non-state form values synchronously before entering the async transition
    const form = e.currentTarget;
    const description  = (form.elements.namedItem('description')  as HTMLTextAreaElement)?.value ?? '';
    const isAnonymous  = (form.elements.namedItem('is_anonymous') as HTMLInputElement)?.checked ?? false;

    startTransition(async () => {
      // Upload image first if one is attached
      let imageUrl: string | null = null;
      if (imageFile && !uploadedUrl) {
        setUploading(true);
        imageUrl = await uploadImageToStorage();
        setUploading(false);
        if (imageUrl) setUploadedUrl(imageUrl);
      } else if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }

      // Build FormData fresh right before the server action call so
      // state values (departmentId, category, selectedPriority) are
      // taken from the closure snapshot at submit time — not from a
      // DOM snapshot that could be stale after async image upload.
      const formData = new FormData();
      formData.set('department_id', departmentId);
      formData.set('category', category);
      formData.set('priority', selectedPriority);
      formData.set('description', description);
      formData.set('is_anonymous', isAnonymous ? 'true' : '');
      if (imageUrl) formData.set('image_url', imageUrl);

      const result = await submitComplaint(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        toast.success('Complaint submitted successfully!');
        router.push(`/citizen/complaints/${result.complaint_id}`);
      }
    });
  }

  const priorities = [
    { value: 'Low',      label: 'Low',      desc: 'General feedback, non-urgent',         color: 'bg-slate-100 text-slate-600' },
    { value: 'Normal',   label: 'Normal',   desc: 'Standard complaint',                   color: 'bg-blue-100 text-[#1B3A6B]' },
    { value: 'High',     label: 'High',     desc: 'Significant issue affecting services', color: 'bg-orange-100 text-orange-600' },
    { value: 'Critical', label: 'Critical', desc: 'Safety or emergency issue',            color: 'bg-red-100 text-red-600' },
  ];

  const isSubmitting = isPending || uploading;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/citizen/complaints" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3A6B] mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A2E]">Submit a Complaint</h1>
        <p className="mt-1 text-sm text-gray-500">
          Report an issue with a government department. Your complaint will be reviewed within 48 hours.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Main details */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Complaint Details</CardTitle>
                <CardDescription>Provide a detailed description of the issue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Department */}
                <div className="space-y-1.5">
                  <Label htmlFor="department_id">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <NativeSelect
                    name="department_id"
                    value={departmentId}
                    onChange={setDepartmentId}
                    placeholder="Select the responsible department"
                    required
                  >
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <NativeSelect
                    name="category"
                    value={category}
                    onChange={setCategory}
                    placeholder="Select complaint category (optional)"
                  >
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </NativeSelect>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <span className={`text-xs ${charCount < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                      {charCount}/5000 (min 50)
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the issue in detail. Include relevant dates, locations, people involved, and any evidence you have..."
                    rows={7}
                    required
                    onChange={e => setCharCount(e.target.value.length)}
                    className="resize-none border-gray-300"
                  />
                </div>

                {/* Anonymous */}
                <div className="flex items-start space-x-3">
                  <Checkbox id="is_anonymous" name="is_anonymous" value="true" className="mt-0.5" />
                  <div>
                    <Label htmlFor="is_anonymous" className="font-medium">Submit anonymously</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your identity will be hidden from officials. Anonymous complaints may take longer to process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image upload */}
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-gray-400" />
                  Supporting Image
                  <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
                </CardTitle>
                <CardDescription>
                  Attach a photo as evidence — max {MAX_SIZE_MB} MB, JPEG / PNG / WebP / GIF
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <p className="mt-2 text-xs text-gray-400 truncate">{imageFile?.name}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#1B3A6B] hover:bg-blue-50/30 transition-all py-10 flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Click to upload an image</p>
                    <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF up to {MAX_SIZE_MB} MB</p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </CardContent>
            </Card>

            <button
              type="submit"
              disabled={isSubmitting || charCount < 50}
              className="w-full h-11 bg-[#1B3A6B] text-white text-sm font-semibold rounded hover:bg-[#152e58] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Uploading image…</>
              ) : isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              ) : (
                <><FileText className="h-4 w-4" /> Submit Complaint</>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Priority Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setSelectedPriority(p.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                    selectedPriority === p.value
                      ? 'border-[#1B3A6B] bg-blue-50 ring-1 ring-[#1B3A6B]'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Badge className={`text-xs ${p.color}`} variant="secondary">{p.label}</Badge>
                  <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#1B3A6B]" />
                Submission Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>✓ Be specific and factual</li>
                <li>✓ Include dates and locations</li>
                <li>✓ Attach a photo if available</li>
                <li>✓ One complaint per submission</li>
                <li>✓ Avoid offensive language</li>
                <li>✓ Select the correct department</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B3A6B]" />
      </div>
    }>
      <NewComplaintForm />
    </Suspense>
  );
}
