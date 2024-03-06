import * as vscode from 'vscode'
import { Document } from '../extension';
export function htmlDoc(selectedText: Document, context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'loginPanel',
    'Testing Scheme',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );
  const faviconUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'favicon.png'));
  const cssUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'main.css'));
  const cssBootstrap = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'bootstrap.min.css'));
  const jsBootstrap = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'bootstrap.bundle.min.js'));
  const mainJs = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'main.js'));

  const htmlContent = `
            <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testing Scheme</title>

    <link rel="icon" type="image/png" href="${faviconUri.toString()}">
    <link rel="stylesheet" href="${cssUri.toString()}" as="style" crossorigin="anonymous">
    <link rel="stylesheet" href="${cssBootstrap.toString()}" as="style" crossorigin="anonymous"> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism.css" integrity="sha256-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7R/NEAABNr2zI=" crossorigin="anonymous" />
   
    <script src="${mainJs.toString()}"></script>
    <script src="${jsBootstrap.toString()}"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js" integrity="sha256-WtnIYJwGMqf4reIVNpnV+uVGpIuE+TuwuXYaobb1ECs=" crossorigin="anonymous"></script>

</head>
<body class="container mt-4">

<form>
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="function" class="form-label">Function</label>
                <input value="${selectedText.function}" type="text" class="form-control" id="function" placeholder="Enter Function">
            </div>
            <div class="col-md-6">
                <label for="route" class="form-label">Route</label>
                <input value="${selectedText.route}" type="text" class="form-control" id="route" placeholder="Enter Route">
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-6">
                <label for="method" class="form-label">Method</label>
                <select class="form-select" id="method">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>
            <div class="col-md-6">
                <label for="description" class="form-label">Description Panel</label>
                <textarea  class="form-control" id="description" placeholder="Enter Description"></textarea>
            </div>
        </div>


        <div class="row mb-3">
            <div class="col-md-6">
                <label for="preview" class="form-label">Preview Code Panel</label>
<div id="preview" class="form-control" style="max-height: 500px; overflow: auto;">
<pre>
        <code class="language-php">
            ${selectedText.code}
        </code>
        </pre>
    </div>
            </div>
            <div class="col-md-6">
                <label for="preview" class="form-label">Example</label>
                <div id="preview" class="form-control" style="height: 100px; overflow: auto;">
                    // Your code preview will be displayed here
                </div>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-12">
                <label class="form-label">Responses</label>

                <!-- Nav tabs for responses -->
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" id="response-tab-404" data-bs-toggle="tab" href="#response-404">404</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="response-tab-200" data-bs-toggle="tab" href="#response-200">200</a>
                    </li>
                </ul>

                <!-- Tab content for responses -->
                <div class="tab-content mt-2">
                    <div class="tab-pane fade show active" id="response-404">
                        <!-- Content for 404 response -->
                        <div id="response-404-content" class="form-control" style="height: 200px; overflow: auto;">
                            // Your 404 response will be displayed here
                        </div>
                    </div>
                    <div class="tab-pane fade" id="response-200">
                        <!-- Content for 200 response -->
                        <div id="response-200-content" class="form-control" style="height: 200px; overflow: auto;">
                            // Your 200 response will be displayed here
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-md-2">
                <button type="button" class="btn btn-primary" onclick="submitForm()">Submit</button>
            </div>
        </div>
    </form>

</body>
</html>
`;
  // Set the HTML content for the webview panel
  panel.webview.html = htmlContent;
  // Handle disposal of the panel when it's closed
  panel.onDidDispose(() => {
    // Do any cleanup here if needed
  });
  return panel
}