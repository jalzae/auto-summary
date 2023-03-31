export interface destructedType {
  parent?: string
  title: string
  name: string
  res: string
  url: string
}

export interface resultDestruct {
  title: string
  items: Array<destructedType>
}