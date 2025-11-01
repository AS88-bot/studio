'use client';

import { useState, useTransition, useEffect } from 'react';
import { Check, Loader2, Share2, Copy, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

export function NoteManager() {
  const [noteContent, setNoteContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharePending, startShareTransition] = useTransition();
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldShare, setShouldShare] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // This effect runs when the user is authenticated and the share action was triggered.
    if (user && !isUserLoading && shouldShare) {
      handleShare(); // Re-trigger share logic now that we have a user.
      setShouldShare(false); // Reset the flag.
    }
  }, [user, isUserLoading, shouldShare]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFileName(selectedFile.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setNoteContent(text);
        toast({
          title: 'File Loaded',
          description: `${selectedFile.name} content is ready to be shared.`,
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

  const handleShareClick = () => {
    setShouldShare(true); // Set intent to share
    handleShare(); // Start the share process
  };

  const handleShare = () => {
    startShareTransition(async () => {
      // Step 1: Validate note content
      if (!noteContent.trim()) {
        toast({
          variant: 'destructive',
          title: 'Empty Note',
          description: 'Please upload a document to share.',
        });
        setShouldShare(false);
        return;
      }
  
      // Step 2: Handle user authentication
      if (!user && !isUserLoading) {
        initiateAnonymousSignIn(auth);
        toast({
          title: 'Signing in...',
          description: 'Creating a temporary account to share your note.',
        });
        // The useEffect will retry handleShare once authenticated.
        return;
      }
  
      // If still loading, wait for the next render.
      if (isUserLoading) {
        return; 
      }
  
      // Step 3: We must have a user by this point.
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: 'Could not sign you in. Please try again.',
        });
        setShouldShare(false);
        return;
      }
  
      // Step 4: Proceed with sharing
      try {
        const publicNotesCol = collection(firestore, 'public_notes');
        const noteDoc = await addDocumentNonBlocking(publicNotesCol, {
          userId: user.uid,
          title:
            fileName ||
            noteContent.substring(0, 40) +
              (noteContent.length > 40 ? '...' : ''),
          content: noteContent,
          createdAt: serverTimestamp(),
        });
  
        const url = `${window.location.origin}/notes/${noteDoc.id}`;
        setShareUrl(url); // This will open the dialog
      } catch (error) {
        console.error('Error sharing note: ', error);
        toast({
          variant: 'destructive',
          title: 'Sharing Failed',
          description:
            'Could not save your note for sharing. Please try again.',
        });
      } finally {
        setShouldShare(false); // Reset flag after operation
      }
    });
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
      toast({ title: 'Link copied to clipboard!' });
    }
  };

  return (
    <>
      <Card className="w-full transition-all duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="font-headline">Share Notes</CardTitle>
          <CardDescription>
            Upload your college notes or documents and share them via a unique
            link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
              <Label htmlFor="file-name">File Name</Label>
              <Input
                id="file-name"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for your note"
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              disabled={isSharePending || !noteContent}
              onClick={handleShareClick}
              className="w-full"
            >
              {isSharePending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Share2 />
              )}
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!shareUrl} onOpenChange={() => setShareUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your note is ready to be shared!</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your note.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input id="link" defaultValue={shareUrl ?? ''} readOnly />
            </div>
            <Button
              type="submit"
              size="sm"
              className="px-3"
              onClick={copyShareUrl}
            >
              <span className="sr-only">Copy</span>
              {copiedShareLink ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
