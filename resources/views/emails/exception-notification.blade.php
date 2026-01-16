<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Application Exception</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #dc3545;
            border-bottom: 3px solid #dc3545;
            padding-bottom: 10px;
            margin-top: 0;
        }
        h2 {
            color: #495057;
            margin-top: 30px;
            font-size: 1.3em;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 15px 0;
        }
        .error-box {
            background-color: #fff5f5;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 400px;
            overflow-y: auto;
        }
        .label {
            font-weight: bold;
            color: #495057;
            display: inline-block;
            min-width: 150px;
        }
        .value {
            color: #212529;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table th, table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #495057;
        }
        .trace-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Application Exception Occurred</h1>
        
        <div class="info-box">
            <p><strong>Application:</strong> {{ $appName ?? 'Laravel Application' }}</p>
            <p><strong>Environment:</strong> {{ $environment ?? 'production' }}</p>
            <p><strong>Time:</strong> {{ now()->format('Y-m-d H:i:s T') }}</p>
            @if($url)
            <p><strong>URL:</strong> <a href="{{ $url }}">{{ $url }}</a></p>
            @endif
        </div>

        <h2>Exception Details</h2>
        <div class="info-box">
            <p><span class="label">Type:</span> <span class="value">{{ get_class($exception) }}</span></p>
            <p><span class="label">Message:</span> <span class="value">{{ $exception->getMessage() }}</span></p>
            <p><span class="label">Code:</span> <span class="value">{{ $exception->getCode() }}</span></p>
            <p><span class="label">File:</span> <span class="value">{{ $exception->getFile() }}</span></p>
            <p><span class="label">Line:</span> <span class="value">{{ $exception->getLine() }}</span></p>
        </div>

        <h2>Stack Trace</h2>
        <div class="error-box">
{{ $exception->getTraceAsString() }}
        </div>

        @if($exception->getPrevious())
        <h2>Previous Exception</h2>
        <div class="info-box">
            <p><span class="label">Type:</span> <span class="value">{{ get_class($exception->getPrevious()) }}</span></p>
            <p><span class="label">Message:</span> <span class="value">{{ $exception->getPrevious()->getMessage() }}</span></p>
        </div>
        @endif

        @if(!empty($context))
        <h2>Additional Context</h2>
        <table>
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                @foreach($context as $key => $value)
                <tr>
                    <td><strong>{{ $key }}</strong></td>
                    <td>
                        @if(is_array($value) || is_object($value))
                            <pre>{{ json_encode($value, JSON_PRETTY_PRINT) }}</pre>
                        @else
                            {{ $value }}
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>
</body>
</html>
