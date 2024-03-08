import * as vscode from 'vscode'
import * as path from 'path';
import * as fs from 'fs';
import { Document, vsCodePath } from '../extension';
export function htmlTest(selectedText: Document, context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'loginPanel',
        `Test : ${selectedText.function}`,
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
    const axiosJs = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', 'axios.js'));
    const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test : ${selectedText.function}</title>
								 <link rel="icon" type="image/png" href="${faviconUri.toString()}">
<link rel="stylesheet" href="${cssUri.toString()}" as="style" crossorigin="anonymous">
<link rel="stylesheet" href="${cssBootstrap.toString()}" as="style" crossorigin="anonymous">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
  
<script src="${mainJs.toString()}"></script>
<script src="${jsBootstrap.toString()}"></script>
<script src="${axiosJs.toString()}"></script>

            </head>
            <body>
						<div class="row mb-3">
						<div class="col-md-4">
                <label for="method" class="form-label">Base URL</label>
                <select class="form-select" id="method">
                ${getBaseURL(context)}  
                </select>
            </div>
						</div>
				<form>
        <div class="row mb-3">
            <div class="col-md-2">
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
                <label for="url" class="form-label">URL</label>
                <input type="text" class="form-control" value="${selectedText.route}" id="url" placeholder="Enter URL">
            </div>
            <div class="col-md-2">
                <label for="go" class="form-label"></label>
                <button type="button" class="btn btn-primary" onclick="sendRequest()">Go</button>
            </div>

        </div>
    </form>

		 <div class="col-md-12 row">
            <div class="col-md-6">
              <label for="body" class="form-label">Request Body</label>
               <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" id="params-tab" data-bs-toggle="tab" href="#params">Params</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="header-tab" data-bs-toggle="tab" href="#header">Header</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="query-tab" data-bs-toggle="tab" href="#query">Query</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="form-encode-tab" data-bs-toggle="tab" href="#form-encode">Form-Encode</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="form-tab" data-bs-toggle="tab" href="#form">Form</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="json-tab" data-bs-toggle="tab" href="#json">JSON</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="xml-tab" data-bs-toggle="tab" href="#xml">XML</a>
                    </li>
                </ul>

                <!-- Tab content -->
                <div class="tab-content mt-2">
                    <div class="tab-pane fade show active" id="params">
                        <!-- Content for Params tab -->
                    <form id="paramsForm">
                    <div class="key-value-pair">
                        <div class="input-group">
                            <input type="text" class="form-control" name="key" placeholder="Key">
                            <input type="text" class="form-control" name="value" placeholder="Value">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-danger" onclick="removeKeyValuePair('paramsForm')">
                                    <i class="fas fa-trash"></i>
                            </button>
                            </div>
                        </div>
                        <div class="input-group">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('paramsForm')">
                                    <i class="fas fa-plus"></i>
                                </button>
                        </div>
                    </div>
                </form>
                    </div>
                    <div class="tab-pane fade" id="header">
                      <form id="headerForm">
                    <div class="key-value-pair">
                        <div class="input-group">
                            <input type="text" class="form-control" name="key" placeholder="Key">
                            <input type="text" class="form-control" name="value" placeholder="Value">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('headerForm')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                    </div>
                    <div class="tab-pane fade" id="query">
                    <form id="queryForm">
                    <div class="key-value-pair">
                        <div class="input-group">
                            <input type="text" class="form-control" name="key" placeholder="Key">
                            <input type="text" class="form-control" name="value" placeholder="Value">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('queryForm')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
                    </div>
                    <div class="tab-pane fade" id="form-encode">
                        <!-- Content for Form-Encode tab -->
                <form id="queryFormEncodeForm">
                    <div class="key-value-pair">
                        <div class="input-group">
                            <input type="text" class="form-control" name="key" placeholder="Key">
                            <input type="text" class="form-control" name="value" placeholder="Value">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('queryForm')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                         <div class="input-group-append mt-4">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('queryForm')">
                                    <i class="fas fa-file"></i>
                                </button>
                            </div>
                    </div>
                </form>
                    </div>
                    <div class="tab-pane fade" id="form">
                <form id="formForm">
                    <div class="key-value-pair">
                        <div class="input-group">
                            <input type="text" class="form-control" name="key" placeholder="Key">
                            <input type="text" class="form-control" name="value" placeholder="Value">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('formForm')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                         <div class="input-group-append mt-4">
                                <button type="button" class="btn btn-success" onclick="addKeyValuePair('formForm')">
                                    <i class="fas fa-file"></i>
                                </button>
                            </div>
                    </div>
                </form>
                    </div>
                    <div class="tab-pane fade" id="json">
                        <!-- Content for JSON tab -->
                        <textarea class="form-control" id="json" placeholder="Request JSON"></textarea>
                    </div>
                    <div class="tab-pane fade" id="xml">
                        <!-- Content for XML tab -->
                        <textarea class="form-control" id="xml" placeholder="Request XML"></textarea>
                    </div>
                </div>
								</div>
						 <div class="col-md-6">
                <label for="body" class="form-label">Response</label>
 <div class="row">
        <div class="col-12">
            <div class="d-flex">
                <div class="col-4">Status: <span id="statusColor" class="text-success">200</span></div>
                <div class="col-4">Time: <span id="statusColor" class="text-success">200</span></div>
                <div class="col-4">Size: <span id="statusColor" class="text-success">200</span></div>
            </div>
        </div>
    </div>
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" id="text-tab" data-bs-toggle="tab" href="#text-response">Text</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="beautify-tab" data-bs-toggle="tab" href="#beautify-response">Beautify</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="header-tab" data-bs-toggle="tab" href="#header-response">Header</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="html-preview-tab" data-bs-toggle="tab" href="#html-preview">HTML Preview</a>
                    </li>
                </ul>

                <!-- Tab content for response -->
                <div class="tab-content mt-2">
                    <div class="tab-pane fade show active" id="text-response">
                        <!-- Content for Text tab -->
                        <div id="response-text" class="form-control"></div>
                    </div>
                    <div class="tab-pane fade" id="beautify-response">
                        <!-- Content for Beautify tab -->
                        <div id="response-beautify" class="form-control"></div>
                    </div>
                    <div class="tab-pane fade" id="header-response">
                        <!-- Content for HTML Preview tab -->
                        <div id="response-header" class="form-control"></div>
                    </div>
                    <div class="tab-pane fade" id="html-preview">
                        <!-- Content for HTML Preview tab -->
                        <div id="response-html" class="form-control"></div>
                    </div>
                </div>
            </div>
   					</div>

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

function getBaseURL(context: vscode.ExtensionContext) {
    const jsonFilePath = vsCodePath + '.vscode/baseurl.json';;
    if (!fs.existsSync(jsonFilePath)) {
        // Create the file with default data
        const defaultData = [
            {
                "url": "http://example.com",
                "description": "Example Website"
            }
        ];

        fs.writeFileSync(jsonFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }

    // Read baseurl.json file
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    let selectElement = ''
    jsonData.forEach((item: { url: string; description: string | null; }) => {
        selectElement += `<option>${item.url}</option>`;
    });
    return selectElement

}