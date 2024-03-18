
export type EntityManageResponse = {
  addResults?: [{
    objectId: number,
    globalId: string,
    success: boolean
  }],
  updateResults?: [{
    objectId: number,
    globalId: string,
    success: boolean
  }]
}
