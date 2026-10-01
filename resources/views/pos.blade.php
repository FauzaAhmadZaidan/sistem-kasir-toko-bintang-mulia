<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Kasir Bintang Mulia</title>

    @viteReactRefresh
    @vite('resources/js/pos/main.tsx')
</head>
<body>
    <div id="pos-root"></div>
</body>
</html>
