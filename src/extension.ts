// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Extension activated!');

	const disposable = vscode.commands.registerCommand('document-summary.scanFiles', () => {

		// get all the files in the workspace
		vscode.workspace.findFiles('**/*').then((uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			uriArray.forEach((fileUri) => {

				// read the file content
				const fileContent = fs.readFileSync(fileUri.fsPath).toString();

				// search for //()SumStart
				const startIndex = fileContent.indexOf('//()SumStart');
				if (startIndex !== -1) {

					// search for //()SumFunc
					const functionIndex = fileContent.indexOf('//()SumFunc:', startIndex);
					if (functionIndex !== -1) {

						// search for //()SumEnd
						const endIndex = fileContent.indexOf('//()SumEnd', functionIndex);
						if (endIndex !== -1) {

							// extract the function name and code
							const functionName = fileContent.substring(functionIndex + 12, endIndex).trim();
							const code = fileContent.substring(startIndex + 13, endIndex).trim();

							const item = {
								url: fileUri.fsPath,
								function: functionName,
								code: code
							}

							items.push(item)

						}
					}
				}
			});

			showItemList(items)
		});
	});

	context.subscriptions.push(disposable);
}

interface MyItem {
	url: string;
	function: string;
	code: string;
}

function showItemList(items: MyItem[]) {
	// Create the webview panel
	const webviewPanel = vscode.window.createWebviewPanel(
		'document-summary.itemList',
		'My Item List',
		vscode.ViewColumn.Beside,
		{}
	);

	// Create an HTML string to display the list
	let html = '<ul>';
	for (let item of items) {
		html += `<li>${item.url}</li>`;
		html += `<li>${item.function} </li>`;
		html += `<li>${item.code}</li>`;
	}
	html += '</ul>';

	// Set the HTML content of the webview panel
	webviewPanel.webview.html = html;
}





// This method is called when your extension is deactivated
export function deactivate() { }
