'use client';

import { useState, useTransition } from 'react';
import { UploadCloud, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { convertSignatureAction } from '@/app/actions';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function SignatureConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && ['image/png', 'image/jpeg'].includes(selectedFile.type)) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    } else if (selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PNG or JPG image.',
      });
      setFile(null);
      setPreview(null);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isOver);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No File',
        description: 'Please upload a signature image first.',
      });
      return;
    }
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('signature', file);
      
      const response = await convertSignatureAction(formData);

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'Conversion Failed',
          description: response.error,
        });
        setResult(null);
      } else {
        setResult(response.success ?? '');
        toast({
          title: 'Success!',
          description: 'Your signature has been converted to text.',
        });
      }
    });
  };
  
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  return (
    <Card className="w-full transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="font-headline">Signature to Text</CardTitle>
        <CardDescription>Upload your signature image (PNG or JPG) to convert it into editable text.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="file-upload"
            className={cn(
              "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
            )}
            onDragOver={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
            <p className="mb-1 text-sm text-muted-foreground">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG or JPG</p>
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            />
          </label>
          {preview && (
            <div className="mt-4 p-2 border rounded-lg bg-muted/50 overflow-hidden">
                <p className="text-sm font-medium mb-2 pl-1 text-muted-foreground">Image Preview:</p>
                <Image
                  src={preview}
                  alt="Signature preview"
                  width={400}
                  height={200}
                  className="rounded-md object-contain w-full h-auto aspect-video"
                />
            </div>
          )}
          <Button onClick={handleSubmit} disabled={isPending || !file} className="w-full">
            {isPending ? <Loader2 className="animate-spin" /> : 'Convert to Text'}
          </Button>
        </div>
        <div className="flex flex-col">
           <Card className="flex-grow flex flex-col bg-muted/30">
            <CardHeader>
                <CardTitle className="text-lg font-headline">Converted Text</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div className="relative flex-grow flex items-center justify-center p-4 rounded-md min-h-[150px]">
                    {isPending ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : result ? (
                        <p className="text-2xl font-headline text-center italic">{result}</p>
                    ) : (
                        <p className="text-muted-foreground text-center">Your converted text will appear here.</p>
                    )}
                </div>
                {result && (
                    <Button onClick={handleCopy} variant="outline" className="mt-4 w-full">
                        {copied ? <Check className="text-green-500" /> : <Copy />}
                        {copied ? 'Copied!' : 'Copy Text'}
                    </Button>
                )}
            </CardContent>
           </Card>
        </div>
      </CardContent>
    </Card>
  );
}
