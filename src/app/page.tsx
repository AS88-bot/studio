import { Header } from '@/components/header';
import { SignatureConverter } from '@/components/signature-converter';
import { NoteManager } from '@/components/note-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenLine, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-5xl">
          <Tabs defaultValue="signature" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="signature">
                <PenLine className="mr-2 h-4 w-4" />
                Signature to Text
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="mr-2 h-4 w-4" />
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signature">
              <SignatureConverter />
            </TabsContent>
            <TabsContent value="notes">
              <NoteManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
