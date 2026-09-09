<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Row-by-row bulk import helper.
 *
 * The frontend parses the spreadsheet and POSTs `{ rows: [...] }`.
 * Each row is validated and handled independently; one bad row never
 * aborts the file. Response: `{ imported, total, errors }` where each
 * error is `{ row, field, message }` (`row` is the 1-based spreadsheet
 * row number, header = 1).
 */
trait ImportsRows
{
    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed> Handler result (ignored) or throws.
     *
     * @throws ImportRowException
     */
    protected function importRows(
        Request $request,
        string $key,
        array $rules,
        callable $handler,
        int $maxRows = 500
    ): JsonResponse {
        $validated = $request->validate([
            $key => ['required', 'array', 'min:1', 'max:'.$maxRows],
            $key.'.*' => ['array'],
        ]);

        $imported = 0;
        $errors = [];

        foreach (array_values($validated[$key]) as $index => $row) {
            $spreadsheetRow = $index + 2;
            try {
                $validator = Validator::make(is_array($row) ? $row : [], $rules);
                if ($validator->fails()) {
                    $firstField = array_key_first($validator->errors()->toArray());
                    throw new ImportRowException(
                        (string) $validator->errors()->first(),
                        is_string($firstField) ? $firstField : 'row'
                    );
                }
                $handler($validator->validated(), $spreadsheetRow);
                $imported++;
            } catch (ImportRowException $e) {
                $errors[] = [
                    'row' => $spreadsheetRow,
                    'field' => $e->getField(),
                    'message' => $e->getMessage(),
                ];
            } catch (\Throwable $e) {
                report($e);
                $errors[] = [
                    'row' => $spreadsheetRow,
                    'field' => 'row',
                    'message' => 'Unexpected error: '.$e->getMessage(),
                ];
            }
        }

        return response()->json([
            'imported' => $imported,
            'total' => count($validated[$key]),
            'errors' => $errors,
        ], 201);
    }
}
