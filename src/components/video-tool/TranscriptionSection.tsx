import { useState, useRef } from "react";
import { FileText, Download, Copy, Settings2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ReadLabelButton } from "./ReadLabelButton";

type Props = {
  file: File | null;
  disabled: boolean;
};

export function TranscriptionSection({ file, disabled }: Props) {
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<{ start: number; end: number; text: string; speaker: string }[] | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [strictVerbatim, setStrictVerbatim] = useState(true);
  const [autoPunctuation, setAutoPunctuation] = useState(true);
  const [includeNonSpeech, setIncludeNonSpeech] = useState(true);
  const [language, setLanguage] = useState("auto");
  const [status, setStatus] = useState("");

  const handleTranscribe = async () => {
    if (!file) return;
    setTranscribing(true);
    setStatus("Uploading");
    
    // Simulate processing steps
    await new Promise(r => setTimeout(r, 1000));
    setStatus("Processing audio");
    await new Promise(r => setTimeout(r, 1500));
    setStatus("Transcribing");
    await new Promise(r => setTimeout(r, 2000));
    
    // Mock transcript
    const mockTranscript = [
      { start: 0, end: 4.5, text: "Welcome to the all-in-one video tool.", speaker: "Speaker 1" },
      { start: 4.5, end: 8.2, text: "Um, today we're going to show you how to use the transcription feature.", speaker: "Speaker 1" },
      { start: 8.5, end: 12.0, text: "[music playing in background] And it's incredibly fast and accurate.", speaker: "Speaker 2" },
      { start: 12.0, end: 18.5, text: "Yes, you can even export it to SRT, TXT, or DOCX formats.", speaker: "Speaker 1" },
    ];
    
    setTranscript(mockTranscript);
    setStatus("Completed");
    setTranscribing(false);
  };

  const copyToClipboard = () => {
    if (!transcript) return;
    const text = transcript.map(t => 
      showTimestamps 
        ? `[${new Date(t.start * 1000).toISOString().substr(14, 5)}] ${t.text}` 
        : t.text
    ).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className={disabled ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" /> Video Transcription <ReadLabelButton label="Video Transcription" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Options Panel */}
          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Advanced Options
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Strict Verbatim Mode</p>
                  <p className="text-xs text-muted-foreground">Ensures absolutely no cleaning or formatting of speech</p>
                </div>
                <Switch checked={strictVerbatim} onCheckedChange={setStrictVerbatim} disabled={transcribing || disabled} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto Punctuation</p>
                  <p className="text-xs text-muted-foreground">Adds punctuation without changing wording</p>
                </div>
                <Switch checked={autoPunctuation} onCheckedChange={setAutoPunctuation} disabled={transcribing || disabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Include Non-Speech Sounds</p>
                  <p className="text-xs text-muted-foreground">e.g. [music], [laughter], [noise]</p>
                </div>
                <Switch checked={includeNonSpeech} onCheckedChange={setIncludeNonSpeech} disabled={transcribing || disabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show Timestamps</p>
                  <p className="text-xs text-muted-foreground">Display [00:00] before each segment</p>
                </div>
                <Switch checked={showTimestamps} onCheckedChange={setShowTimestamps} disabled={transcribing || disabled} />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Language</p>
                <select 
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={transcribing || disabled}
                >
                  <option value="auto">Auto Detect Language</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleTranscribe} 
              disabled={transcribing || disabled || !file}
            >
              {transcribing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  {status}...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Start Transcription
                </>
              )}
            </Button>
          </div>

          {/* Output Panel */}
          <div className="flex flex-col space-y-4 rounded-lg border p-4 bg-background h-[400px]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Transcript Output</h3>
              {transcript && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto rounded-md border bg-muted/10 p-4 font-mono text-sm">
              {!transcript && !transcribing && (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <FileText className="mb-2 h-8 w-8 opacity-20" />
                  <p>No transcript generated yet.</p>
                  <p className="text-xs">Click Start Transcription to begin.</p>
                </div>
              )}
              
              {transcribing && (
                <div className="flex h-full flex-col items-center justify-center text-primary">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="font-medium animate-pulse">{status}...</p>
                </div>
              )}
              
              {transcript && (
                <div className="space-y-3">
                  {transcript.map((t, i) => (
                    <div key={i} className="hover:bg-muted/50 p-1.5 rounded transition-colors group">
                      <div className="flex items-start gap-3">
                        {showTimestamps && (
                          <span className="text-xs text-primary/70 font-semibold mt-0.5 shrink-0">
                            [{new Date(t.start * 1000).toISOString().substr(14, 5)}]
                          </span>
                        )}
                        <span className="leading-relaxed">
                          {!strictVerbatim && t.speaker ? <span className="font-semibold mr-2">{t.speaker}:</span> : null}
                          {t.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
