// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function formatTs(result: any, extension: string) {
  for (const item of result) {
    const fileName = item.title.split("\\").pop(); // get the file name with extension
    const name = fileName.split(".").shift(); // remove the extension and get the name
    const formatname = (name.toLowerCase());
    let content = `export default {`;
    for (const i of item.items) {
      content += `${renameFile(formatname)}${getLastFunction(i.url)}(`;
      //cek :id
      if (checkIdExist(i.url)) {
        content += `id:any,`;
      }
      //cek post or put
      if (i.method === "POST" || i.method === "PUT") {
        content += `data:any`;
      }
      content += `){ 
        return {
          `;
      content += `method:"${i.method}",`;
      //cek post or put
      if (
        i.method === "GET" ||
        i.method === "PUT" ||
        i.method === "POST" ||
        i.method === "DELETE"
      ) {
        if (checkIdExist(i.url)) {
          const replacedStr = i.url.replace("/:id", "/${id}`");
          content += "url:`" + replacedStr;
        } else {
          content += `url:"${i.url}"`;
        }
      } else {
        content += `url:"${i.url}"`;
      }
      if (i.method === "POST" || i.method === "PUT") {
        content += `,data`;
      }
      content += `}`;
      content += `},
      `;
    }
    content += `
  }`;
    const outputString = item.title
      .replace(/^.*[\\\/]/, '')
      .replace(/\.[^/.]+$/, '');

    writeIt(extension, outputString, name, content);
  }
}

export function formatDart(result: any, extension: string = "dart") {
  for (const item of result) {
    const fileName = item.title.split("\\").pop(); // get the file name with extension
    const name = fileName.split(".").shift(); // remove the extension and get the name
    const formatname = name.toLowerCase();
    const className = formatString(item.title);
    let content = `class  ${capitalize(removeForwardSlash(className))} {`;
    for (const i of item.items) {
      content += `static ${renameFile(formatname)}${getLastFunction(i.url)}(`;
      //cek :id
      if (checkIdExist(i.url)) {
        content += `String id,`;
      }
      //cek post or put
      if (i.method === "POST" || i.method === "PUT") {
        content += `{Map<String,dynamic> data=const {},Map<String,dynamic> headers=const {}}`;
      }
      content += `){ Map<String,dynamic> request= {`;
      content += `"method":"${i.method}",`;
      //cek post or put
      if (
        i.method === "GET" ||
        i.method === "PUT" ||
        i.method === "POST" ||
        i.method === "DELETE"
      ) {
        if (checkIdExist(i.url)) {
          const replacedStr = i.url.replace("/:id", `/$id`);
          content += `"url":"${replacedStr}`;
        } else {
          content += `"url":"${i.url}"`;
        }
      } else {
        content += `"url":"${i.url}"`;
      }
      content += `};`;
      content += `return request;`;
      content += `}
      `;
    }

    content += `}`;

    const outputString = item.title
      .replace(/\\[^\\]+$/, "")
      .replace(/\\/g, "/");
    writeIt(extension, outputString, formatname, content);
  }
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function removeForwardSlash(inputString: string): string {
  return inputString.replace(/\//g, '');
}

export function capitalize(str: string): string {
  const parts = str.split(/(?=[A-Z])/); // split the string by uppercase letters
  parts[0] = capitalizeFirstLetter(parts[0]); // capitalize the first part
  return parts.join(""); // join the parts back into a string
}

export function formatString(str: string): string {
  const extension = str.split(".").pop(); // get the file extension
  str = str.replace(/\\/g, ""); // remove backslashes
  str = str.replace("." + extension, ""); // remove file extension
  str = str.replace("Controllers", ""); // remove 'Controllers'
  str = str.charAt(0).toLowerCase() + str.slice(1); // convert first letter to lowercase
  return str;
}

export function writeIt(
  extension: string,
  outputString: string,
  formatname: string,
  content: string
) {
  const targetFolder = removeLastPart(formatname);
  const combinedPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + "/.vscode/" + extension + "/" + targetFolder;
  // create the directory if it doesn't exist
  createDirectoryPath(combinedPath);
  fs.writeFileSync(combinedPath + `/${renameFile(outputString)}.${extension}`, content);
}

function removeLastPart(inputString: string): string {
  const lastSlashIndex = inputString.lastIndexOf('/');
  return lastSlashIndex !== -1 ? inputString.substring(0, lastSlashIndex) : inputString;
}

export function checkIdExist(route: string): boolean {
  const idPattern = /\/:id/;
  return idPattern.test(route);
}

export function getLastFunction(route: string) {
  let lastFunction = "";
  const parts = route.split("/");
  const lastPart = parts[parts.length - 1];

  if (lastPart.startsWith(":")) {
    lastFunction = parts[parts.length - 2];
  } else {
    lastFunction = parts[parts.length - 1];
  }
  lastFunction = lastFunction.replace(/_/g, "");
  return lastFunction;
}

export function createDirectoryPath(dirPath: string) {
  const normalizedPath = path.normalize(dirPath);
  const parts = normalizedPath.split(path.sep);

  let currentPath = "";

  parts.forEach((part) => {
    currentPath = path.join(currentPath, part);

    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  });
}

export function renameFile(str: string) {
  return str.replace(/^.*[\\\/]/, '')
    .replace(/\.[^/.]+$/, '');
}
