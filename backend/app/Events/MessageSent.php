<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param  array<string, mixed>  $message  Serialized message row.
     */
    public function __construct(
        public array $message,
        public int $senderId,
        public int $recipientId,
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Recipient's channel (all their tabs/devices) + sender's channel
        // so the sender's other tabs stay in sync too.
        return [
            new PrivateChannel("chat.{$this->recipientId}"),
            new PrivateChannel("chat.{$this->senderId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}
