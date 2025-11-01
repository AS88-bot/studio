'use client';

import { useState, useTransition } from 'react';
import { Bot, Download, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { generateHandwritingAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

export function HandwritingGenerator() {
  const [text, setText] = useState('');
  const [handwritingSample, setHandwritingSample] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handwritingPlaceholder = PlaceHolderImages.find(p => p.id === 'handwriting-placeholder');

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && ['image/png', 'image/jpeg'].includes(selectedFile.type)) {
      setHandwritingSample(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else if (selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PNG or JPG image for the handwriting sample.',
      });
      setHandwritingSample(null);
      setPreview(null);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isOver);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Empty Text', description: 'Please enter some text to convert.' });
      return;
    }
    if (!handwritingSample) {
      toast({ variant: 'destructive', title: 'No Sample', description: 'Please upload a handwriting sample.' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('handwritingSample', handwritingSample);

      const response = await generateHandwritingAction(formData);
      if (response.error) {
        toast({ variant: 'destructive', title: 'Generation Failed', description: response.error });
        setResultImage(null);
      } else {
        setResultImage(response.success ?? '');
        toast({ title: 'Success!', description: 'Your handwriting image is ready.' });
      }
    });
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'handwriting.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="font-headline">Text to Handwriting</CardTitle>
        <CardDescription>Transform your typed text into an image that mimics your handwriting style.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Type your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-36 resize-none"
          />
          <label
            htmlFor="handwriting-upload"
            className={cn(
              "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50",
            )}
            onDragOver={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDrop={handleDrop}
          >
            {preview ? (
               <Image src={preview} alt="Handwriting sample preview" fill objectFit="contain" className="rounded-md p-2" />
            ) : (
              <>
                <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  <span className="font-semibold">Upload handwriting sample</span>
                </p>
                <p className="text-xs text-muted-foreground">PNG or JPG</p>
              </>
            )}
             <Input
              id="handwriting-upload"
              type="file"
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            />
          </label>
         
          <Button onClick={handleSubmit} disabled={isPending || !text || !handwritingSample}>
            {isPending ? <Loader2 className="animate-spin" /> : <Bot />}
            Generate Handwriting
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video w-full rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
            {isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : resultImage ? (
              <Image src={resultImage} alt="Generated handwriting" fill objectFit="contain" />
            ) : handwritingPlaceholder ? (
               <Image src={handwritingPlaceholder.imageUrl} alt="Handwriting placeholder" fill objectFit="cover" data-ai-hint={handwritingPlaceholder.imageHint} />
            ) : (
              <p className="text-muted-foreground text-center">Your handwriting image will appear here.</p>
            )}
          </div>
          {resultImage && (
            <Button onClick={handleDownload} variant="outline">
              <Download />
              Download Image
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
