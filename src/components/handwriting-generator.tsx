'use client';

import { useState, useTransition } from 'react';
import { Bot, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { generateHandwritingAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HandwritingGenerator() {
  const [text, setText] = useState('');
  const [font, setFont] = useState('cursive');
  const [slant, setSlant] = useState('normal');
  const [thickness, setThickness] = useState('normal');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handwritingPlaceholder = PlaceHolderImages.find(p => p.id === 'handwriting-placeholder');

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Empty Text', description: 'Please enter some text to convert.' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('font', font);
      formData.append('slant', slant);
      formData.append('thickness', thickness);

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
        <CardDescription>Transform your typed text into a realistic handwriting image. Customize the style below.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Type your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-48 resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="font-style">Font Style</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger id="font-style"><SelectValue placeholder="Font" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cursive">Cursive</SelectItem>
                  <SelectItem value="print">Print</SelectItem>
                  <SelectItem value="calligraphy">Calligraphy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slant">Slant</Label>
              <Select value={slant} onValueChange={setSlant}>
                <SelectTrigger id="slant"><SelectValue placeholder="Slant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="oblique">Oblique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="thickness">Thickness</Label>
              <Select value={thickness} onValueChange={setThickness}>
                <SelectTrigger id="thickness"><SelectValue placeholder="Thickness" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isPending || !text}>
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
