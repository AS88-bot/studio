'use client';

import { useState, useTransition } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

interface Note {
  title: string;
  content: string;
  createdAt: any;
  userId: string;
}

export function NoteManager() {
  const [noteContent, setNoteContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, startUploadTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const publicNotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'public_notes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: publicNotes, isLoading: isLoadingNotes } = useCollection<Note>(publicNotesQuery);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFileName(selectedFile.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setNoteContent(text);
        toast({
          title: 'File Ready',
          description: `Ready to upload ${selectedFile.name}.`,
        });
      };
      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Read Error',
          description: `Could not read the file ${selectedFile.name}.`,
        });
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDragEvents = (
    e: React.DragEvent<HTMLDivElement>,
    isOver: boolean
  ) => {
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

  const handleUploadClick = () => {
    startUploadTransition(async () => {
      if (!noteContent.trim()) {
        toast({
          variant: 'destructive',
          title: 'Empty Note',
          description: 'Please upload a document to share.',
        });
        return;
      }

      let currentUser = user;
      if (!currentUser && !isUserLoading) {
        await initiateAnonymousSignIn(auth);
        // We need to get the user after sign-in. This is a simplification.
        // A more robust solution might use a state to wait for user.
        return;
      }

      if (isUserLoading || !auth.currentUser) {
        toast({ title: "Please wait", description: "Authenticating..." });
        // Retry logic could be implemented here.
        return;
      }
      currentUser = auth.currentUser;


      try {
        const publicNotesCol = collection(firestore, 'public_notes');
        await addDocumentNonBlocking(publicNotesCol, {
          userId: currentUser.uid,
          title: fileName || noteContent.substring(0, 40) + (noteContent.length > 40 ? '...' : ''),
          content: noteContent,
          createdAt: serverTimestamp(),
        });

        toast({
          title: 'Note Published!',
          description: 'Your note is now visible to everyone.',
        });
        // Clear inputs after successful upload
        setNoteContent('');
        setFileName('');

      } catch (error) {
        console.error('Error publishing note: ', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'Could not publish your note. Please try again.',
        });
      }
    });
  };


  return (
    <>
      <Card className="w-full transition-all duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="font-headline">Public Notes</CardTitle>
          <CardDescription>
            Upload your college notes or documents to make them visible to everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <label
              htmlFor="file-upload"
              className={cn(
                'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                isDragging
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/50'
              )}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
              <p className="mb-1 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-xs text-muted-foreground">
                Any text-based document
              </p>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleFileChange(e.target.files ? e.target.files[0] : null)
                }
              />
            </label>
            {fileName && (
              <div className="grid gap-2">
                <Label htmlFor="file-name">Note Title</Label>
                <Input
                  id="file-name"
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a name for your note"
                />
              </div>
            )}
            <Button
              disabled={isUploading || !noteContent}
              onClick={handleUploadClick}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <UploadCloud />
              )}
              Upload Publicly
            </Button>
          </div>
          <div className="flex flex-col gap-4">
             <h3 className="text-lg font-semibold font-headline">Recently Uploaded Notes</h3>
             <ScrollArea className="h-96 w-full rounded-md border">
                <div className="p-4">
                {isLoadingNotes && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isLoadingNotes && publicNotes?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">No public notes yet. Be the first to upload one!</p>
                )}
                {publicNotes && publicNotes.length > 0 && (
                    <div className="space-y-4">
                        {publicNotes.map(note => (
                            <Card key={note.id}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base font-headline">{note.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                </div>
             </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </>
  );
}