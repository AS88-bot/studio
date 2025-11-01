'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
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

export function NoteManager() {
  const [noteContent, setNoteContent] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharePending, setSharePending] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isUserLoading } = useAuth();
  const auth = useAuth();

  const handleShare = async () => {
    setSharePending(true);
    let currentUserId = user?.uid;

    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
      toast({
        title: 'Signing in...',
        description: 'Creating an anonymous account to save your note.',
      });
      // We can't get user immediately, we need to wait for auth state to change.
      // For this simple case, we'll let the user click again. A more robust solution would listen for auth state change.
      setSharePending(false);
      return;
    }

    if (!currentUserId) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'Still signing you in. Please try again in a moment.',
      });
      setSharePending(false);
      return;
    }

    if (!noteContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Note',
        description: 'Please enter some text to share.',
      });
      setSharePending(false);
      return;
    }

    try {
      const publicNotesCol = collection(firestore, 'public_notes');
      const noteDoc = await addDocumentNonBlocking(publicNotesCol, {
        userId: currentUserId,
        title:
          noteContent.substring(0, 40) +
          (noteContent.length > 40 ? '...' : ''),
        content: noteContent,
        createdAt: serverTimestamp(),
      });

      const url = `${window.location.origin}/notes/${noteDoc.id}`;
      setShareUrl(url);
    } catch (error) {
      console.error('Error sharing note: ', error);
      toast({
        variant: 'destructive',
        title: 'Sharing Failed',
        description: 'Could not save your note for sharing. Please try again.',
      });
    } finally {
      setSharePending(false);
    }
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
          <CardTitle className="font-headline">Notes</CardTitle>
          <CardDescription>
            Write a note and share it with others via a unique link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Textarea
            placeholder="Write your note here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="h-48 min-h-48 resize-none"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              disabled={isSharePending || !noteContent}
              onClick={handleShare}
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
