declare namespace wxp {
  function downloadFile (config: {
    url: string
  }): Promise<any>

  function request (config: {
    header?: object,
    url: string,
    method?: string,
    data?: object,
    complete?: () => void
  }): Promise<any>

  function showModal (config: {
    title: string,
    content: string,
    showCancel?: boolean,
    confirmText?: string,
  }): Promise<any>

  function login (): Promise<any>

  function getUserCloudStorage (config: {
    keyList: string[]
  }): Promise<{
    KVDataList: KVData[]
  }>

  function getFriendCloudStorage (config: {
    keyList: string[]
  }): Promise<{
    data: UserGameData[]
  }>
}

declare interface KVData {
  key: string
  value: string
}

declare interface UserGameData {
  avatarUrl: string
  nickname: string
  KVDataList: KVData[]
}
