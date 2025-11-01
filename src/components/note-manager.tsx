'use client';

import { useState, useTransition } from 'react';
import { Wand2, Copy, Check, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { enhanceNoteAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NoteManager() {
  const [noteContent, setNoteContent] = useState('');
  const [formattedNote, setFormattedNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = () => {
    if (!noteContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Note',
        description: 'Please enter some text to format.',
      });
      return;
    }

    startTransition(async () => {
      const response = await enhanceNoteAction(noteContent);
      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'Formatting Failed',
          description: response.error,
        });
        setFormattedNote(null);
      } else {
        setFormattedNote(response.success ?? '');
        toast({
          title: 'Success!',
          description: 'Your note has been beautifully formatted.',
        });
      }
    });
  };

  const handleCopy = () => {
    const textToCopy = formattedNote || noteContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  return (
    <Card className="w-full transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="font-headline">Note Enhancer</CardTitle>
        <CardDescription>Paste your notes, and our AI will format them for clarity and style. You can then copy or share them.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Paste your raw notes here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="h-72 min-h-72 resize-none"
          />
          <Button onClick={handleSubmit} disabled={isPending || !noteContent}>
            {isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Enhance Format
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <Card className="h-72 min-h-72 w-full bg-muted/30">
            <ScrollArea className="h-full w-full rounded-md">
              <div className="p-4">
                {isPending ? (
                  <div className="flex h-full min-h-[250px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : formattedNote ? (
                  <pre className="text-sm font-sans whitespace-pre-wrap break-words">
                    {formattedNote}
                  </pre>
                ) : (
                  <div className="flex h-full min-h-[250px] items-center justify-center">
                    <p className="text-muted-foreground text-center">Your formatted note will appear here.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleCopy} variant="outline" disabled={!noteContent} className="w-full">
              {copied ? <Check className="text-green-500" /> : <Copy />}
              {copied ? 'Copied!' : 'Copy Note'}
            </Button>
            <Button 
              variant="outline" 
              disabled={!formattedNote} 
              onClick={() => toast({title: "Sharing Mockup", description: "A unique URL would be generated here."})} 
              className="w-full"
            >
              <Share2 /> Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
