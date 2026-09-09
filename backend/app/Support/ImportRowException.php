<?php

namespace App\Support;

class ImportRowException extends \RuntimeException
{
    public function __construct(string $message, private string $field = 'row')
    {
        parent::__construct($message);
    }

    public function getField(): string
    {
        return $this->field;
    }
}
