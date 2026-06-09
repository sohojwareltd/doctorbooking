<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadContactMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $phone,
        public string $comment = ''
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New contact lead',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead-contact',
            with: [
                'sender_name' => $this->name,
                'sender_phone' => $this->phone,
                'sender_comment' => trim($this->comment),
            ],
        );
    }
}
