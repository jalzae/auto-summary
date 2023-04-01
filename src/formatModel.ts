import { getLastFunction,  writeIt } from './formatApi'
import { MyItem, isJsonString } from './extension'
import { destructedType, resultDestruct } from './model'



export function formatTsModel(items: MyItem[], extension: string) {
  const destructed = [] as destructedType[];

  for (const item of items) {
    if (item.route != '' && item.method != '' && item.function != '' && item.res!='{}') {
      destructed.push({
        parent: item.url,
        title: item.function,
        name: item.name,
        res: item.res,
        url: item.route
      })
    }
  }

  const uniquePeople = Array.from(new Set(destructed.map((person: any) => person.parent)));

  const result: resultDestruct[] = [];
  uniquePeople.forEach((e: any) => {
    const resultFilter = (destructed.filter((el: any) => el.parent == e));
    result.push({ title: e, items: resultFilter })
  })

  for (const item of result) {
    const fileName = item.title.split('\\').pop(); // get the file name with extension
    const name = fileName!.split('.').shift(); // remove the extension and get the name
    const formatname = name!.toLowerCase()
    let content = ''
    for (const i of item.items) {
      const result = isJsonString(i.res)
      if (result) {
        const jsonResult: { [key: string]: string | number | boolean } = JSON.parse(i.res);
        content += `interface ${formatname}${getLastFunction(i.url)} {
          `
        for (const key in jsonResult) {
          if (jsonResult.hasOwnProperty(key)) {
            const value = jsonResult[key];
            content += `${key}:${value}`
          }
        }
        content += `
      }`
      }

    }
    const outputString = item.title.replace(/\\[^\\]+$/, '').replace(/\\/g, '/');
    writeIt(extension, outputString + `/model`, formatname, content)
  }
}