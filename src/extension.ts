// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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
				let relativePath = ''
				const fileContent = fs.readFileSync(fileUri.fsPath).toString();
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (workspaceFolders) {
					const rootPath = workspaceFolders[0].uri.fsPath;
					relativePath = path.relative(rootPath, fileUri.fsPath);
				}

				// search for //()SumStart
				const startIndex = fileContent.indexOf('//()SumStart');
				if (startIndex !== -1) {

					// search for //()SumFunc
					const functionIndex = fileContent.indexOf('//()SumFunc:', startIndex);
					const lineIndex = fileContent.substr(0, startIndex).split('\n').length - 1;
					if (functionIndex !== -1) {
						const functionNameStartIndex = functionIndex + '//()SumFunc:'.length;
						const functionNameEndIndex = fileContent.indexOf("\n", functionNameStartIndex);
						const functionName = fileContent.substring(functionNameStartIndex, functionNameEndIndex !== -1 ? functionNameEndIndex : undefined).trim();

						// search for //()SumEnd
						const endIndex = fileContent.indexOf('//()SumEnd', functionIndex);
						const lineEnd = fileContent.substr(0, endIndex).split('\n').length - 1;
						if (endIndex !== -1) {

							const code = fileContent.substring(functionIndex + 12, endIndex).trim()
							const match = code.match(/SumFunc:(.*)/);
							const functionOnCode = match ? match[1].trim() : null;
							const stringWithoutFunctionName = code.replace(functionName, "");

							const item = {
								realurl: fileUri.fsPath,
								url: relativePath,
								function: functionName,
								name: functionOnCode || '',
								code: stringWithoutFunctionName,
								start: lineIndex,
								end: lineEnd,
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
	realurl: string;
	url: string;
	function: string;
	name: string;
	code: string;
	start: number;
	end: number;
}

function showItemList(items: MyItem[]) {
	// Create the webview panel
	const webviewPanel = vscode.window.createWebviewPanel(
		'document-summary.itemList',
		'My Documentation List',
		vscode.ViewColumn.Beside,
		{}
	);

	// Create an HTML string to display the list
	let html = '<ul>';
	for (let item of items) {
		html +=`<li><div>`
		html += `<p>${item.url} : ${item.start}-${item.end}</p>`;
		html += `<p>${item.function} </p>`;
		html += `<p>${item.code}</p>`;
		html +=`</div></li>`
	}
	html += '</ul>';

	// Set the HTML content of the webview panel
	webviewPanel.webview.html = html;
}





// This method is called when your extension is deactivated
export function deactivate() { }
