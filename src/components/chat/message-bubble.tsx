'use client';

import { Message } from '@/lib/providers/llm/interface';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MessageBubbleProps = {
  message: Message;
  isLoading?: boolean;
};

export function MessageBubble({ message, isLoading }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[80%]',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      <Avatar className="flex-shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? 'bg-primary text-primary-foreground'
              : isSystem
                ? 'bg-muted'
                : 'bg-secondary'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <Card
        className={cn(
          'relative',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <CardContent className="p-3">
          {isLoading && !message.content ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {message.content}
              </pre>
              {isLoading && message.content && (
                <Loader2 className="inline h-3 w-3 animate-spin ml-1" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
