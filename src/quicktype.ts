import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { writeIt } from './formatApi'
import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
  JSONSchemaInput,
  FetchingJSONSchemaStore
} from "quicktype-core";

async function quicktypeJSON(targetLanguage: string, typeName: string, jsonString: string) {
  const jsonInput = jsonInputForTargetLanguage(targetLanguage);

  // We could add multiple samples for the same desired
  // type, or many sources for other types. Here we're
  // just making one type from one piece of sample JSON.
  await jsonInput.addSource({
    name: typeName,
    samples: [jsonString]
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  return await quicktype({
    inputData,
    lang: targetLanguage
  });
}

async function quicktypeJSONSchema(targetLanguage: string, typeName: string, jsonSchemaString: string) {
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());

  // We could add multiple schemas for multiple types,
  // but here we're just making one type from JSON schema.
  await schemaInput.addSource({ name: typeName, schema: jsonSchemaString });

  const inputData = new InputData();
  inputData.addInput(schemaInput);

  return await quicktype({
    inputData,
    lang: targetLanguage
  });
}

export async function main(lang: string, className: string, jsonString: string) {
  const { lines: result } = await quicktypeJSON(lang, className, jsonString);
  return result.join("\n");

}

export async function generate(lang: string, extension: string = "ts") {
  const Arrlang = ['dart', 'csharp', 'typescript', 'swift', 'python']

  const datas = Arrlang.find((e) => e == lang)
  if (!datas) {
    vscode.window.showErrorMessage(`Languane ${lang} does not exist`);
    return false
  }

  if (createModelFolderIfNotExists()) {
    //check all json inside  folder model
    const result = await getJSONStringsFromModelFolder()
    for (const item of result) {
      const itemFormated = await main(lang, item.filename, item.content)
      writeIt(extension, 'resultModel', item.filename, itemFormated)
    }
  }
}
async function getJSONStringsFromModelFolder() {
  interface jsonBody {
    filename: string,
    content: string
  }
  const jsonStrings: jsonBody[] = [];

  try {
    const combinedPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode/model'  ;
    const files = await fs.promises.readdir(combinedPath);

    for (const file of files) {
      if (path.extname(file).toLowerCase() === ".json") {
        // Get filename without extension
        const fileNameWithoutExt = file.split('.')[0];
        const content = await fs.promises.readFile(path.join(combinedPath, file), "utf-8");
        jsonStrings.push({ filename: fileNameWithoutExt, content });
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to read the model folder. ${error}`);
  }

  return jsonStrings;
}

function createModelFolderIfNotExists() {
  const modelFolderPath = path.join(vscode.workspace.rootPath || '', '.vscode', 'model');
  const exampleJson = `{
    "examplestring": "string",
    "number": 10
}`;
  try {
    if (!fs.existsSync(modelFolderPath)) {
      fs.mkdirSync(modelFolderPath);
      fs.writeFileSync(path.join(modelFolderPath, 'example.json'), exampleJson);
      vscode.window.showInformationMessage('Created model folder and example.json file.');
    } else {
      return true
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Error creating model folder or example.json file: ${error}`);
  }
}