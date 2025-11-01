'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Note {
  title: string;
  content: string;
  createdAt: any;
}

export default function SharedNotePage() {
  const { noteId } = useParams();
  const firestore = useFirestore();

  const noteRef = useMemoFirebase(() => {
    if (!firestore || !noteId) return null;
    return doc(firestore, 'public_notes', noteId as string);
  }, [firestore, noteId]);

  const { data: note, isLoading, error } = useDoc<Note>(noteRef);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">{note?.title || 'Shared Note'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {error && <p className="text-destructive">Error loading note: {error.message}</p>}
              {!isLoading && !note && !error && (
                <p className="text-muted-foreground">Note not found.</p>
              )}
              {note && (
                <ScrollArea className="h-96 w-full rounded-md border bg-muted/30 p-4">
                   <pre className="text-sm font-sans whitespace-pre-wrap break-words">
                    {note.content}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
