'use client';

import { useChatContext } from '@/components/providers/chat-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { ModelSelector } from './model-selector';

export function ChatContainer() {
  const { messages, sendMessage, isLoading, error, defaultModel } =
    useChatContext();

  const [input, setInput] = useState('');
  const [model, setModel] = useState(defaultModel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message, model);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-1 px-4 mb-4 overflow-y-auto pb-6 pt-0">
        <div className="flex gap-2 w-full sticky top-0 p-2 bg-white">
          <ModelSelector onModelSelect={setModel} defaultModel={defaultModel} />
          <p className="text-muted-foreground text-center py-2 text center border-slate-500 border-2 rounded-xl w-full">
            Chat with LLM
          </p>
        </div>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e as React.FormEvent);
            }
          }}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="self-end h-[60px]"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
